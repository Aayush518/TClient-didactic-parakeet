
# TClient-didactic-parakeet

## Table of Contents
1. [Introduction](#introduction)
2. [Features](#features)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Usage](#usage)
6. [How It Works](#how-it-works)
7. [Architecture](#architecture)
8. [Limitations](#limitations)
9. [Future Improvements](#future-improvements)
10. [Contributing](#contributing)


## Introduction

This project is an advanced BitTorrent client implemented in Node.js. It provides a terminal-based user interface for downloading torrent files, displaying real-time statistics, and managing peer connections.

## Features

- Parse and process .torrent files
- Connect to trackers and retrieve peer lists
- Implement the BitTorrent protocol for peer communication
- Download file pieces from multiple peers simultaneously
- Real-time download progress visualization
- Display of connected peers and their information
- Download speed monitoring and graphing
- Terminal-based user interface for ease of use

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/Aayush518/TClient-didactic-parakeet.git
   ```

2. Navigate to the project directory:
   ```
   cd TClient-didactic-parakeet
   ```

3. Install the required dependencies:
   ```
   npm install
   ```

## Usage

To use the BitTorrent client, run the following command:

```
node index.js path/to/your/torrent/file.torrent
```

Replace `path/to/your/torrent/file.torrent` with the actual path to the .torrent file you want to download.

## How It Works

1. The client parses the .torrent file to extract necessary information.
2. It connects to the tracker(s) specified in the .torrent file to get a list of peers.
3. The client then connects to multiple peers and starts requesting pieces of the file.
4. As pieces are downloaded, they are verified and written to disk.
5. The user interface is updated in real-time to show download progress, speed, and peer information.
6. Once all pieces are downloaded, the file is complete and ready for use.

## Architecture

### Components

1. **Torrent Parser**: Extracts information from .torrent files.
2. **Tracker Client**: Communicates with trackers to get peer lists.
3. **Peer Connection Manager**: Handles connections to multiple peers.
4. **Piece Manager**: Keeps track of which pieces have been requested and received.
5. **File Writer**: Writes downloaded pieces to disk.
6. **User Interface**: Displays real-time information and statistics.

### Operation Model

- **Asynchronous**: The client operates asynchronously, using Node.js's event-driven, non-blocking I/O model.
- **Single-threaded**: Node.js is single-threaded, but it can handle multiple connections concurrently due to its event loop.
- **Multiple peer connections**: While single-threaded, the client manages multiple peer connections simultaneously using asynchronous operations.

## Limitations

1. **DHT and PEX**: The client does not support Distributed Hash Table (DHT) or Peer Exchange (PEX) for finding additional peers.
2. **Uploading**: Currently, the client only downloads and does not support uploading (seeding) files.
3. **Magnet Links**: The client does not support magnet links, only .torrent files.
4. **Large Files**: Performance may degrade with very large files or torrents with many files.
5. **Error Handling**: Robust error handling for network issues or corrupted data is limited.

## Future Improvements

1. Implement DHT and PEX for better peer discovery.
2. Add support for uploading (seeding) files.
3. Implement magnet link support.
4. Optimize performance for large files and multi-file torrents.
5. Enhance error handling and recovery mechanisms.
6. Add support for selecting specific files in multi-file torrents.
7. Implement bandwidth throttling and scheduling.
8. Create a web-based or native GUI for broader usability.

## Contributing

Contributions to this project are welcome. Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with clear, descriptive messages.
4. Push your changes to your fork.
5. Submit a pull request with a clear description of your changes.

