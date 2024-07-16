'use strict';

const dgram = require('dgram');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const crypto = require('crypto');
const torrentParser = require('../utils/torrent-parser');
const util = require('../utils/util');

module.exports.getPeers = (torrent, callback) => {
    const socket = dgram.createSocket('udp4');
    const url = torrent.announce.toString('utf8');

    // Use multiple trackers if available
    const announceList = torrent['announce-list'];
    const trackers = announceList ? announceList.map(ann => ann.toString('utf8')) : [url];

    console.log(`Connecting to trackers: ${trackers.join(', ')}`);

    let peersFound = false;
    let allPeers = [];

    trackers.forEach(tracker => {
        if (tracker.startsWith('udp:') || tracker.startsWith('http:')) {
            try {
                udpSend(socket, buildConnReq(), tracker);
            } catch (error) {
                console.warn(`Error sending request to tracker ${tracker}: ${error.message}`);
            }
        }
    });

    socket.on('error', (err) => {
        console.error(`Tracker connection error: ${err.message}`);
    });

    socket.on('message', response => {
        if (respType(response) === 'connect') {
            const connResp = parseConnResp(response);
            const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
            udpSend(socket, announceReq, url);
        } else if (respType(response) === 'announce') {
            const announceResp = parseAnnounceResp(response);
            if (announceResp.peers.length > 0) {
                peersFound = true;
                allPeers = allPeers.concat(announceResp.peers);
            }
        }
    });

    // Set a timeout for the tracker connection
    setTimeout(() => {
        if (!peersFound) {
            console.error('No peers found from any tracker');
            socket.close();
            callback([]);
        } else {
            socket.close();
            callback(allPeers);
        }
    }, 15000); // 15 seconds timeout
};

function udpSend(socket, message, rawUrl, callback=()=>{}) {
    const url = urlParse(rawUrl);
    let port = url.port ? parseInt(url.port) : 80;  // Default to 80 if no port specified
    
    // Some trackers use non-standard ports in the hostname
    if (!url.port && url.hostname.includes(':')) {
        const parts = url.hostname.split(':');
        url.hostname = parts[0];
        port = parseInt(parts[1]);
    }

    if (isNaN(port) || port <= 0 || port >= 65536) {
        console.warn(`Invalid port ${port} for tracker ${rawUrl}. Skipping.`);
        return;
    }

    socket.send(message, 0, message.length, port, url.hostname, callback);
}

function respType(resp) {
    const action = resp.readUInt32BE(0);
    if (action === 0) return 'connect';
    if (action === 1) return 'announce';
}

function buildConnReq() {
    const buf = Buffer.allocUnsafe(16);

    // connection id
    buf.writeUInt32BE(0x417, 0);
    buf.writeUInt32BE(0x27101980, 4);
    // action
    buf.writeUInt32BE(0, 8);
    // transaction id
    crypto.randomBytes(4).copy(buf, 12);

    return buf;
}

function parseConnResp(resp) {
    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        connectionId: resp.slice(8)
    }
}

function buildAnnounceReq(connId, torrent, port=6881) {
    const buf = Buffer.allocUnsafe(98);

    // connection id
    connId.copy(buf, 0);
    // action
    buf.writeUInt32BE(1, 8);
    // transaction id
    crypto.randomBytes(4).copy(buf, 12);
    // info hash
    torrentParser.infoHash(torrent).copy(buf, 16);
    // peerId
    util.genId().copy(buf, 36);
    // downloaded
    Buffer.alloc(8).copy(buf, 56);
    // left
    torrentParser.size(torrent).copy(buf, 64);
    // uploaded
    Buffer.alloc(8).copy(buf, 72);
    // event
    buf.writeUInt32BE(0, 80);
    // ip address
    buf.writeUInt32BE(0, 84);
    // key
    crypto.randomBytes(4).copy(buf, 88);
    // num want
    buf.writeInt32BE(-1, 92);
    // port
    buf.writeUInt16BE(port, 96);

    return buf;
}

function parseAnnounceResp(resp) {
    function group(iterable, groupSize) {
        let groups = [];
        for (let i = 0; i < iterable.length; i += groupSize) {
            groups.push(iterable.slice(i, i + groupSize));
        }
        return groups;
    }

    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        leechers: resp.readUInt32BE(8),
        seeders: resp.readUInt32BE(12),
        peers: group(resp.slice(20), 6).map(address => {
            return {
                ip: address.slice(0, 4).join('.'),
                port: address.readUInt16BE(4)
            }
        })
    }
}