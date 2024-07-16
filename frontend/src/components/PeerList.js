// frontend/src/components/PeerList.js
import React from 'react';

function PeerList({ peers }) {
  return (
    <div className="peer-list">
      <h3 className="highlight-text">Peers</h3>
      <table>
        <thead>
          <tr>
            <th>IP</th>
            <th>Port</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {peers.map((peer, index) => (
            <tr key={index}>
              <td>{peer.ip}</td>
              <td>{peer.port}</td>
              <td className={peer.connected ? 'highlight-text' : ''}>{peer.connected ? 'Connected' : 'Not Connected'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PeerList;