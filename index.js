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
const fileInfoBox = grid.set(0, 0, 2, 6, blessed.box, {
    label: 'File Info',
    content: 'Initializing...',
    border: {type: 'line'},
    style: {border: {fg: 'green'}}
});

// Progress bar
const progressBar = grid.set(2, 0, 2, 6, contrib.gauge, {
    label: 'Download Progress',
    stroke: 'green',
    fill: 'white'
});

// Download stats
const downloadStats = grid.set(4, 0, 4, 6, contrib.table, {
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
    columnWidth: [15, 10, 15],
    interactive: true,
    mouse: true
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
    fileInfoBox.setContent(
        `File: ${downloadInfo.fileName}\n` +
        `Size: ${formatSize(downloadInfo.fileSize)}`
    );

    // Update progress bar
    progressBar.setPercent(downloadInfo.progress || 0);

    // Update download stats
    downloadStats.setData({
        headers: ['Stat', 'Value'],
        data: [
            ['Downloaded', formatSize(downloadInfo.downloadedSize)],
            ['Remaining', formatSize(downloadInfo.remainingSize)],
            ['Speed', formatSize(downloadInfo.speeds[downloadInfo.speeds.length - 1] * 1024) + '/s'],
            ['Status', downloadInfo.status],
            ['Total Peers', downloadInfo.totalPeers.toString()],
            ['Connected Peers', downloadInfo.connectedPeers.toString()]
        ]
    });

    // Update peer list
    const peerData = downloadInfo.peers.map(peer => [
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

// Enable scrolling for peer list
peerList.focus();
screen.key(['up', 'down'], function(ch, key) {
    if (key.name === 'up') {
        peerList.rows.scroll(-1);
    } else if (key.name === 'down') {
        peerList.rows.scroll(1);
    }
    screen.render();
});