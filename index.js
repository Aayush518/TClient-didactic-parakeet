'use strict';

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const download = require('./src/download');
const torrentParser = require('./src/torrent-parser');

const torrent = torrentParser.open(process.argv[2]);

// Create a screen object
const screen = blessed.screen({
  smartCSR: true,
  title: 'BitTorrent Client'
});

// Create a grid
const grid = new contrib.grid({rows: 12, cols: 12, screen: screen});

// Create a donut chart for progress
const donut = grid.set(0, 0, 4, 4, contrib.donut, {
  label: 'Download Progress',
  radius: 16,
  arcWidth: 4,
  yPadding: 2,
  data: [{label: 'Progress', percent: 0}]
});

// Create a line chart for download speed
const lineChart = grid.set(0, 4, 4, 8, contrib.line, {
  style: {
    line: "yellow",
    text: "green",
    baseline: "black"
  },
  xLabelPadding: 3,
  xPadding: 5,
  showLegend: true,
  wholeNumbersOnly: false,
  label: 'Download Speed (KB/s)'
});

// Create a box for displaying file information
const infoBox = grid.set(4, 0, 4, 12, blessed.box, {
  label: 'File Information',
  content: 'Initializing...',
  border: {type: 'line'},
  style: {border: {fg: 'blue'}}
});

// Create a table for displaying peer information
const peerTable = grid.set(8, 0, 4, 12, contrib.table, {
  keys: true,
  fg: 'white',
  selectedFg: 'white',
  selectedBg: 'blue',
  interactive: true,
  label: 'Connected Peers',
  width: '100%',
  height: '100%',
  border: {type: "line", fg: "cyan"},
  columnSpacing: 10,
  columnWidth: [16, 24, 24]
});

// Render the screen
screen.render();

// Start the download
download(torrent, torrent.info.name, donut, lineChart, infoBox, peerTable, screen);

// Function to update the UI
function updateUI(downloadInfo) {
  if (downloadInfo.peers.length === 0) {
    infoBox.setContent('Waiting for peers...');
  } else {
    donut.setData([{percent: downloadInfo.progress, label: 'Progress', color: 'green'}]);
    lineChart.setData([{x: downloadInfo.timePoints, y: downloadInfo.speeds, title: 'Speed'}]);
    
    const fileSizeInMB = (downloadInfo.fileSize / (1024 * 1024)).toFixed(2);
    const downloadedSizeInMB = (downloadInfo.downloadedSize / (1024 * 1024)).toFixed(2);
    const remainingSizeInMB = (downloadInfo.remainingSize / (1024 * 1024)).toFixed(2);
    
    infoBox.setContent(
      `File: ${downloadInfo.fileName}\n` +
      `Size: ${fileSizeInMB} MB\n` +
      `Downloaded: ${downloadedSizeInMB} MB\n` +
      `Remaining: ${remainingSizeInMB} MB\n` +
      `Peers: ${downloadInfo.peers.length}\n` +
      `Status: ${downloadInfo.status}`
    );
    
    peerTable.setData({
      headers: ['IP', 'Port', 'Connected'],
      data: downloadInfo.peers.map(peer => [peer.ip, peer.port, peer.connected ? 'Yes' : 'No'])
    });
  }
  screen.render();
}

// Update UI every second
setInterval(() => updateUI(download.getDownloadInfo()), 1000);

// Quit on Escape, q, or Control-C
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});