// frontend/src/components/LogBox.js
import React from 'react';

function LogBox({ logs }) {
  return (
    <div className="log-box">
      <h3 className="neon-text">Logs</h3>
      <div className="logs">
        {logs.map((log, index) => (
          <p key={index}>{log}</p>
        ))}
      </div>
    </div>
  );
}

export default LogBox;