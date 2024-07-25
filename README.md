# 🌪️ Torrent

A sleek, modern BitTorrent client with a dark-inspired interface built using React and Node.js.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-17.0.2-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-14.0.0-green.svg)](https://nodejs.org/)

## ✨ Features

- 📥 Download torrents using the BitTorrent protocol
- 📊 Real-time download progress and statistics
- 👥 Live peer connection information
- 📁 Detailed file information display
- 📝 Advanced logging system
- 📱 Responsive and intuitive user interface

## 🛠️ Tech Stack

- 🖥️ Frontend: React
- 🗄️ Backend: Node.js with Express
- 🔧 BitTorrent Protocol Implementation: Custom

## 📋 Prerequisites

- Node.js (v14+ recommended)
- npm (v6+ recommended)

## 🚀 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Aayush518/TClient-didactic-parakeet.git
   cd TClient-didactic-parakeet
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

## 🏃‍♂️ Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## 📖 Usage

1. Enter the path to a `.torrent` file in the input field. (Full system path, not relative)
2. Click "Start Download" to begin the download process.
3. Monitor the download progress, peer connections, and logs in the user interface.

## 📁 Project Structure

```
hackertorrent/
├── backend/
│   ├── src/
│   │   ├── core/
│   │   │   ├── download.js
│   │   │   ├── message.js
│   │   │   ├── pieces.js
│   │   │   ├── queue.js
│   │   │   └── tracker.js
│   │   └── utils/
│   │       ├── torrent-parser.js
│   │       └── util.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileInfo.js
│   │   │   ├── ProgressBar.js
│   │   │   ├── DownloadStats.js
│   │   │   ├── PeerList.js
│   │   │   └── LogBox.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
└── README.md
```

## 🔑 Key Components

| Component | Description |
|-----------|-------------|
| `download.js` | Core functionality for managing the download process |
| `tracker.js` | Handles communication with BitTorrent trackers |
| `pieces.js` | Manages the pieces of the torrent file |
| `queue.js` | Implements the download queue system |
| `App.js` | Main React component orchestrating the UI |
| `FileInfo.js` | Displays information about the files being downloaded |
| `ProgressBar.js` | Shows the overall download progress |
| `DownloadStats.js` | Presents various download statistics |
| `PeerList.js` | Lists connected peers and their status |
| `LogBox.js` | Displays real-time logs of the download process |

## 🎨 Customization

The user interface can be easily customized by modifying the `App.css` file in the frontend directory. The color scheme uses CSS variables, making it simple to adjust the overall look and feel of the application.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Guidelines for Contributions

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👏 Acknowledgments

- [node-bencode](https://github.com/themasch/node-bencode) for Bencode encoding/decoding
- [React](https://reactjs.org/) for the frontend framework
- [Express](https://expressjs.com/) for the backend server

## ⚠️ Disclaimer

This software is for educational purposes only. Ensure you have the right to download and share the content of any torrent you use with this client. The developers are not responsible for any misuse of this software.

## 🔮 Future Enhancements

- [ ] Add support for magnet links
- [ ] Implement upload functionality
- [ ] Create a system for managing multiple torrents simultaneously
- [ ] Add more detailed peer information and management
- [ ] Implement bandwidth throttling options

## 🆘 Support

If you encounter any problems or have any questions, please [open an issue](https://github.com/Aayush518/TClient-didactic-parakeet/issues) in the GitHub repository.

---

Happy torrenting! 🚀
