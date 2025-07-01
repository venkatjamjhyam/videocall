import React from 'react';
import VideoCall from './components/VideoCall';
import './styles.css';

function App() {
  return (
    <div className="app-container">
      <h1>🌐 Video call</h1>
      <div className="buttons">
        <VideoCall />
      </div>
    </div>
  );
}

export default App;
