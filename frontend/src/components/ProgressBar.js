// frontend/src/components/ProgressBar.js
import React from 'react';

function ProgressBar({ progress }) {
  return (
    <div className="progress-bar pulse">
      <h3 className="neon-text">Download Progress</h3>
      <div className="progress">
        <div className="progress-inner" style={{ width: `${progress}%` }}></div>
      </div>
      <p className="neon-text">{progress.toFixed(2)}%</p>
    </div>
  );
}

export default ProgressBar;