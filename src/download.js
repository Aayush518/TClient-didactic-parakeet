'use strict';

const fs = require('fs');
const net = require('net');
const tracker = require('./tracker');
const message = require('./message');
const Pieces = require('./Pieces');
const Queue = require('./Queue');
const torrentParser = require('./torrent-parser');

let downloadInfo = {
  fileName: '',
  fileSize: 0,
  progress: 0,
  timePoints: [],
  speeds: [],
  peers: [],
  downloadedSize: 0,
  uploadedSize: 0,
  remainingSize: 0,
  status: 'Initializing'
};

module.exports = (torrent, path, donut, lineChart, infoBox, peerTable, screen) => {
  downloadInfo.fileName = path;
  downloadInfo.fileSize = torrentParser.size(torrent);
  downloadInfo.remainingSize = downloadInfo.fileSize;

  tracker.getPeers(torrent, peers => {
    console.log(`Got ${peers.length} peers`);
    downloadInfo.peers = peers.map(peer => ({...peer, connected: false}));
    downloadInfo.status = peers.length > 0 ? 'Connecting to peers' : 'No peers found';
    
    if (peers.length === 0) {
      console.warn('No peers found. The torrent might be dead or the tracker might be unreachable.');
      return;
    }

    const pieces = new Pieces(torrent);
    const file = fs.openSync(path, 'w');
    peers.forEach(peer => download(peer, torrent, pieces, file));
  });
};

module.exports.getDownloadInfo = () => downloadInfo;

function download(peer, torrent, pieces, file) {
  const socket = new net.Socket();
  
  socket.setTimeout(10000); // Set a 10-second timeout for the connection

  socket.on('timeout', () => {
    console.warn(`Connection to peer ${peer.ip}:${peer.port} timed out`);
    socket.destroy();
  });

  socket.on('error', (err) => {
    console.warn(`Error connecting to peer ${peer.ip}:${peer.port}: ${err.message}`);
    // You might want to try reconnecting or moving to the next peer
  });

  socket.connect(peer.port, peer.ip, () => {
    console.log(`Connected to peer: ${peer.ip}:${peer.port}`);
    const peerIndex = downloadInfo.peers.findIndex(p => p.ip === peer.ip && p.port === peer.port);
    if (peerIndex !== -1) {
      downloadInfo.peers[peerIndex].connected = true;
    }
    socket.write(message.buildHandshake(torrent));
  });

  const queue = new Queue(torrent);
  onWholeMsg(socket, msg => msgHandler(msg, socket, pieces, queue, torrent, file));
}

function onWholeMsg(socket, callback) {
  let savedBuf = Buffer.alloc(0);
  let handshake = true;

  socket.on('data', recvBuf => {
    const msgLen = () => handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
    savedBuf = Buffer.concat([savedBuf, recvBuf]);

    while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
      callback(savedBuf.slice(0, msgLen()));
      savedBuf = savedBuf.slice(msgLen());
      handshake = false;
    }
  });
}

function msgHandler(msg, socket, pieces, queue, torrent, file) {
  if (isHandshake(msg)) {
    socket.write(message.buildInterested());
  } else {
    const m = message.parse(msg);

    if (m.id === 0) chokeHandler(socket);
    if (m.id === 1) unchokeHandler(socket, pieces, queue);
    if (m.id === 4) haveHandler(socket, pieces, queue, m.payload);
    if (m.id === 5) bitfieldHandler(socket, pieces, queue, m.payload);
    if (m.id === 7) pieceHandler(socket, pieces, queue, torrent, file, m.payload);
  }
}

function isHandshake(msg) {
  return msg.length === msg.readUInt8(0) + 49 &&
    msg.toString('utf8', 1, 20) === 'BitTorrent protocol';
}

function chokeHandler(socket) { socket.end(); }

function unchokeHandler(socket, pieces, queue) {
  queue.choked = false;
  requestPiece(socket, pieces, queue);
}

function haveHandler(socket, pieces, queue, payload) {
  const pieceIndex = payload.readUInt32BE(0);
  const queueEmpty = queue.length === 0;
  queue.queue(pieceIndex);
  if (queueEmpty) requestPiece(socket, pieces, queue);
}

function bitfieldHandler(socket, pieces, queue, payload) {
  const queueEmpty = queue.length === 0;
  payload.forEach((byte, i) => {
    for (let j = 0; j < 8; j++) {
      if (byte % 2) queue.queue(i * 8 + 7 - j);
      byte = Math.floor(byte / 2);
    }
  });
  if (queueEmpty) requestPiece(socket, pieces, queue);
}

function pieceHandler(socket, pieces, queue, torrent, file, pieceResp) {
  pieces.addReceived(pieceResp);

  const offset = pieceResp.index * torrent.info['piece length'] + pieceResp.begin;
  fs.write(file, pieceResp.block, 0, pieceResp.block.length, offset, () => {});

  downloadInfo.downloadedSize += pieceResp.block.length;
  downloadInfo.remainingSize = downloadInfo.fileSize - downloadInfo.downloadedSize;
  downloadInfo.progress = (pieces.received / pieces.total) * 100;
  downloadInfo.status = 'Downloading';

  const now = Date.now();
  downloadInfo.timePoints.push(now);
  downloadInfo.speeds.push(pieceResp.block.length / 1024); // KB/s

  // Keep only the last 60 data points
  if (downloadInfo.timePoints.length > 60) {
    downloadInfo.timePoints.shift();
    downloadInfo.speeds.shift();
  }

  if (pieces.isDone()) {
    console.log('Download complete!');
    downloadInfo.status = 'Complete';
    socket.end();
    try { fs.closeSync(file); } catch(e) {}
  } else {
    requestPiece(socket, pieces, queue);
  }
}

function requestPiece(socket, pieces, queue) {
  if (queue.choked) return null;

  while (queue.length()) {
    const pieceBlock = queue.deque();
    if (pieces.needed(pieceBlock)) {
      socket.write(message.buildRequest(pieceBlock));
      pieces.addRequested(pieceBlock);
      break;
    }
  }
}