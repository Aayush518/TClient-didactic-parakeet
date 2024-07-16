// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import FileInfo from './components/FileInfo';
import ProgressBar from './components/ProgressBar';
import DownloadStats from './components/DownloadStats';
import PeerList from './components/PeerList';
import LogBox from './components/LogBox';

function App() {
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [torrentPath, setTorrentPath] = useState('');
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDownloadInfo();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchDownloadInfo = async () => {
    try {
      const response = await axios.get('http://localhost:3001/download-info');
      setDownloadInfo(response.data);
      if (response.data) {
        setLogs(prevLogs => [...prevLogs, `[${new Date().toLocaleTimeString()}] Downloaded: ${formatSize(response.data.downloadedSize)}`]);
      }
    } catch (error) {
      console.error('Error fetching download info:', error);
    }
  };

  const handleStartDownload = async () => {
    try {
      await axios.post('http://localhost:3001/start-download', { torrentPath });
      setLogs(prevLogs => [...prevLogs, `[${new Date().toLocaleTimeString()}] Download started`]);
    } catch (error) {
      console.error('Error starting download:', error);
    }
  };

  return (
    <div className="App">
      <h1 className="neon-text">BitTorrent Client</h1>
      <div className="input-container">
        <input
          type="text"
          value={torrentPath}
          onChange={(e) => setTorrentPath(e.target.value)}
          placeholder="Enter torrent file path"
        />
        <button onClick={handleStartDownload}>Start Download</button>
      </div>
      {downloadInfo && (
        <div className="content">
          <FileInfo files={downloadInfo.files} />
          <ProgressBar progress={downloadInfo.progress} />
          <DownloadStats
            stats={{
              Downloaded: formatSize(downloadInfo.downloadedSize),
              Remaining: formatSize(downloadInfo.remainingSize),
              Speed: `${formatSize(downloadInfo.speeds[downloadInfo.speeds.length - 1] * 1024)}/s`,
              Status: downloadInfo.status,
              'Total Peers': downloadInfo.totalPeers,
              'Connected Peers': downloadInfo.connectedPeers,
            }}
          />
          <PeerList peers={downloadInfo.peers} />
          <LogBox logs={logs.slice(-50)} />
        </div>
      )}
    </div>
  );
}

function formatSize(bytes) {
  if (isNaN(bytes) || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default App;