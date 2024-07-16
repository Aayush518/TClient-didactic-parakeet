// backend/server.js
const express = require('express');
const cors = require('cors');
const download = require('./src/core/download');
const torrentParser = require('./src/utils/torrent-parser');
const path = require('path');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

let torrent;
let savePath;

app.post('/start-download', (req, res) => {
  const { torrentPath } = req.body;
  torrent = torrentParser.open(torrentPath);
  savePath = path.join(process.cwd(), torrent.info.name.toString('utf8'));
  download(torrent, savePath);
  res.json({ message: 'Download started' });
});

app.get('/download-info', (req, res) => {
  const info = download.getDownloadInfo();
  res.json(info);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});