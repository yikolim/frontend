import React from 'react';
import './App.css';
import TerminalChat from './components/TerminalChat';

function App() {
  return (
    <div className="App" style={{ minHeight: '100vh', padding: '20px' }}>
      <TerminalChat />
    </div>
  );
}

export default App;