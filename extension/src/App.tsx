import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  const checkStatus = async () => {
    try {
      const res = await fetch('http://localhost:3666/api/status');
      if (res.ok) {
        setStatus('connected');
      } else {
        setStatus('disconnected');
      }
    } catch (e) {
      setStatus('disconnected');
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSavePage = async () => {
    // Send message to active tab - requires chrome types
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0 && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "save_page" });
      window.close(); // Close popup after action
    }
  };

  return (
    <div className="popup-container">
      <h2>ADHDNotes Clipper</h2>
      <div className={`status ${status}`}>
        <span className={`dot ${status}`}></span>
        {status === 'checking' && 'Checking...'}
        {status === 'connected' && 'Connected'}
        {status === 'disconnected' && 'Disconnected'}
      </div>

      {status === 'disconnected' && (
        <p className="error">Make sure ADHDNotes is running.</p>
      )}

      <button onClick={handleSavePage} disabled={status !== 'connected'}>
        Save Current Page
      </button>
    </div>
  )
}

export default App
