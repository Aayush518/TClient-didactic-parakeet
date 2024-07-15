'use strict';

const fs = require('fs');
const path = require('path');
const net = require('net');
const tracker = require('./tracker');
const message = require('./message');
const Pieces = require('./Pieces');
const Queue = require('./Queue');
const torrentParser = require('./torrent-parser');

let downloadInfo = {
    files: [],
    totalSize: 0,
    progress: 0,
    timePoints: [],
    speeds: [],
    peers: [],
    totalPeers: 0,
    connectedPeers: 0,
    downloadedSize: 0,
    uploadedSize: 0,
    remainingSize: 0,
    status: 'Initializing'
};

module.exports = (torrent, savePath) => {
    const files = torrentParser.files(torrent);
    downloadInfo.files = files.map(file => ({
        name: file.name,
        size: file.length,
        downloaded: 0
    }));
    downloadInfo.totalSize = files.reduce((total, file) => total + file.length, 0);
    downloadInfo.remainingSize = downloadInfo.totalSize;

    tracker.getPeers(torrent, peers => {
        console.log(`Got ${peers.length} peers`);
        downloadInfo.peers = peers.map(peer => ({...peer, connected: false}));
        downloadInfo.totalPeers = peers.length;
        downloadInfo.status = peers.length > 0 ? 'Connecting to peers' : 'No peers found';
        
        if (peers.length === 0) {
            console.warn('No peers found. The torrent might be dead or the tracker might be unreachable.');
            return;
        }

        const pieces = new Pieces(torrent);
        files.forEach(file => {
            let filePath = file.name;
            if (Buffer.isBuffer(filePath)) {
                filePath = filePath.toString('utf8');
            } else if (Array.isArray(filePath)) {
                filePath = filePath.map(p => Buffer.isBuffer(p) ? p.toString('utf8') : p).join(path.sep);
            }
            
            const fullPath = path.join(savePath, filePath);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            file.fileHandle = fs.openSync(fullPath, 'w');
        });
        peers.forEach(peer => download(peer, torrent, pieces, files));
    });
};


module.exports.getDownloadInfo = () => downloadInfo;

function download(peer, torrent, pieces, files) {
    const socket = new net.Socket();
    
    socket.setTimeout(10000);

    socket.on('timeout', () => {
        console.warn(`Connection to peer ${peer.ip}:${peer.port} timed out`);
        socket.destroy();
        retryConnection(peer, torrent, pieces, files);
    });

    socket.on('error', (err) => {
        console.warn(`Error connecting to peer ${peer.ip}:${peer.port}: ${err.message}`);
        retryConnection(peer, torrent, pieces, files);
    });

    socket.connect(peer.port, peer.ip, () => {
        console.log(`Connected to peer: ${peer.ip}:${peer.port}`);
        updatePeerStatus(peer, true);
        socket.write(message.buildHandshake(torrent));
    });

    socket.on('close', () => {
        updatePeerStatus(peer, false);
    });

    const queue = new Queue(torrent);
    onWholeMsg(socket, msg => msgHandler(msg, socket, pieces, queue, torrent, files));
}

function retryConnection(peer, torrent, pieces, files) {
    setTimeout(() => {
        download(peer, torrent, pieces, files);
    }, 5000); // Retry after 5 seconds
}

function updatePeerStatus(peer, connected) {
    const peerIndex = downloadInfo.peers.findIndex(p => p.ip === peer.ip && p.port === peer.port);
    if (peerIndex !== -1) {
        downloadInfo.peers[peerIndex].connected = connected;
        downloadInfo.connectedPeers += connected ? 1 : -1;
    }
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

function msgHandler(msg, socket, pieces, queue, torrent, files) {
    if (isHandshake(msg)) {
        socket.write(message.buildInterested());
    } else {
        const m = message.parse(msg);

        if (m.id === 0) chokeHandler(socket);
        if (m.id === 1) unchokeHandler(socket, pieces, queue);
        if (m.id === 4) haveHandler(socket, pieces, queue, m.payload);
        if (m.id === 5) bitfieldHandler(socket, pieces, queue, m.payload);
        if (m.id === 7) pieceHandler(socket, pieces, queue, torrent, files, m.payload);
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

function pieceHandler(socket, pieces, queue, torrent, files, pieceResp) {
    pieces.addReceived(pieceResp);

    const offset = pieceResp.index * torrent.info['piece length'] + pieceResp.begin;
    let fileOffset = 0;
    for (let file of files) {
        if (offset < fileOffset + file.length) {
            const pieceOffset = offset - fileOffset;
            fs.write(file.fileHandle, pieceResp.block, 0, pieceResp.block.length, pieceOffset, () => {});
            break;
        }
        fileOffset += file.length;
    }

    downloadInfo.downloadedSize += pieceResp.block.length;
    downloadInfo.remainingSize = downloadInfo.totalSize - downloadInfo.downloadedSize;
    downloadInfo.progress = (downloadInfo.downloadedSize / downloadInfo.totalSize) * 100;

    downloadInfo.status = 'Downloading';

    const now = Date.now();
    downloadInfo.timePoints.push(now);
    downloadInfo.speeds.push(pieceResp.block.length / 1024); // KB/s

    if (downloadInfo.timePoints.length > 60) {
        downloadInfo.timePoints.shift();
        downloadInfo.speeds.shift();
    }

    if (pieces.isDone()) {
        console.log('Download complete!');
        downloadInfo.status = 'Complete';
        socket.end();
        files.forEach(file => {
            try { fs.closeSync(file.fileHandle); } catch(e) {}
        });
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