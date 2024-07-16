'use strict';

const blessed = require('blessed');
const download = require('./src/core/download');
const torrentParser = require('./src/utils/torrent-parser');
const path = require('path');
const { createInterface, updateUI } = require('./src/ui/interface');

if (process.argv.length < 3) {
    console.error('Usage: node index.js <path_to_torrent_file>');
    process.exit(1);
}

const torrentPath = process.argv[2];
const torrent = torrentParser.open(torrentPath);


const savePath = path.join(process.cwd(), torrent.info.name.toString('utf8'));
if (typeof savePath !== 'string') {
    console.error('Save path must be a string');
    process.exit(1);
}

const screen = blessed.screen({
    smartCSR: true,
    title: 'BitTorrent Client',
    fullUnicode: true
});

let uiMode = true;

const ui = createInterface(screen);

// Terminal output box
const terminalBox = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    content: '',
    hidden: true
});

screen.append(terminalBox);

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

screen.key(['p'], function(ch, key) {
    uiMode = !uiMode;
    if (uiMode) {
        terminalBox.hide();
    } else {
        terminalBox.show();
    }
    screen.render();
});

download(torrent, savePath);

function updateTerminal(downloadInfo) {
    if (!downloadInfo || uiMode) return;

    let content = '';
    content += `Total Progress: ${downloadInfo.progress.toFixed(2)}%\n`;
    content += `Download Speed: ${formatSize(downloadInfo.speeds[downloadInfo.speeds.length - 1] * 1024)}/s\n`;
    content += `Status: ${downloadInfo.status}\n`;
    content += `Connected Peers: ${downloadInfo.connectedPeers}/${downloadInfo.totalPeers}\n\n`;

    downloadInfo.files.forEach(file => {
        content += `${file.name}: ${formatSize(file.downloaded)}/${formatSize(file.size)}\n`;
    });

    terminalBox.setContent(content);
    screen.render();
}

function formatSize(bytes) {
    if (isNaN(bytes) || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

setInterval(() => {
    const info = download.getDownloadInfo();
    updateUI(info, ui);
    updateTerminal(info);
}, 1000);

// Enable scrolling for peer list
ui.peerList.focus();
screen.key(['up', 'down'], function(ch, key) {
    if (key.name === 'up') {
        ui.peerList.rows.scroll(-1);
    } else if (key.name === 'down') {
        ui.peerList.rows.scroll(1);
    }
    screen.render();
});