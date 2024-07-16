// frontend/src/components/DownloadStats.js
import React from 'react';

function DownloadStats({ stats }) {
  return (
    <div className="download-stats">
      <h3 className="neon-text">Download Stats</h3>
      <table>
        <tbody>
          {Object.entries(stats).map(([key, value]) => (
            <tr key={key}>
              <td>{key}</td>
              <td className="neon-text">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DownloadStats;