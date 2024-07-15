'use strict';

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const download = require('./src/download');
const torrentParser = require('./src/torrent-parser');

if (process.argv.length < 3) {
    console.error('Usage: node index.js <path_to_torrent_file>');
    process.exit(1);
}

const torrent = torrentParser.open(process.argv[2]);

const screen = blessed.screen({
    smartCSR: true,
    title: 'BitTorrent Client',
    fullUnicode: true
});

// Create a grid layout
const grid = new contrib.grid({rows: 12, cols: 12, screen: screen});

// File info box
const fileInfoBox = grid.set(0, 0, 4, 6, contrib.lcd, {
    label: 'File Size (Bytes)',
    segmentWidth: 0.06,
    segmentInterval: 0.11,
    strokeWidth: 0.1,
    elements: 8,
    display: '00000000',
    elementSpacing: 4,
    elementPadding: 2
});

// Progress bar
const progressBar = grid.set(4, 0, 2, 6, contrib.gauge, {
    label: 'Download Progress',
    stroke: 'green',
    fill: 'white'
});

// Download stats
const downloadStats = grid.set(6, 0, 6, 6, contrib.table, {
    keys: true,
    fg: 'green',
    label: 'Download Stats',
    columnSpacing: 1,
    columnWidth: [20, 20]
});

// Peer list
const peerList = grid.set(0, 6, 12, 6, contrib.table, {
    keys: true,
    fg: 'green',
    label: 'Peers',
    columnSpacing: 1,
    columnWidth: [20, 10, 15]
});

// Log box
const logBox = grid.set(8, 0, 4, 6, blessed.log, {
    label: 'Logs',
    fg: 'green',
    selectedFg: 'green',
    bufferLength: 50
});

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

download(torrent, torrent.info.name);

function formatSize(bytes) {
    if (isNaN(bytes) || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateUI(downloadInfo) {
    if (!downloadInfo) return;

    // Update file info
    fileInfoBox.setDisplay(downloadInfo.fileSize.toString().padStart(8, '0'));

    // Update progress bar
    progressBar.setPercent(downloadInfo.progress);

    // Update download stats
    downloadStats.setData({
        headers: ['Stat', 'Value'],
        data: [
            ['File Name', downloadInfo.fileName],
            ['File Size', formatSize(downloadInfo.fileSize)],
            ['Downloaded', formatSize(downloadInfo.downloadedSize)],
            ['Remaining', formatSize(downloadInfo.remainingSize)],
            ['Speed', formatSize(downloadInfo.speeds[downloadInfo.speeds.length - 1] * 1024) + '/s'],
            ['Status', downloadInfo.status],
            ['Total Peers', downloadInfo.totalPeers.toString()],
            ['Connected Peers', downloadInfo.connectedPeers.toString()]
        ]
    });

    // Update peer list
    const peerData = downloadInfo.peers.slice(0, 20).map(peer => [
        peer.ip,
        peer.port.toString(),
        peer.connected ? 'Connected' : 'Not Connected'
    ]);
    peerList.setData({
        headers: ['IP', 'Port', 'Status'],
        data: peerData
    });

    // Add log entry
    logBox.log(`[${new Date().toLocaleTimeString()}] Downloaded: ${formatSize(downloadInfo.downloadedSize)}`);

    screen.render();
}

setInterval(() => updateUI(download.getDownloadInfo()), 1000);