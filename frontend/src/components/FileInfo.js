// frontend/src/components/FileInfo.js
import React from 'react';

function FileInfo({ files }) {
  return (
    <div className="file-info">
      <h3>File Info</h3>
      {files.map((file, index) => (
        <p key={index}>{file.name}: {formatSize(file.size)}</p>
      ))}
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

export default FileInfo;