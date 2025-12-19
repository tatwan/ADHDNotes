// Popup script - handles status checking and save page button

let status = 'checking';

const statusDiv = document.getElementById('status');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const errorMessage = document.getElementById('error-message');
const savePageBtn = document.getElementById('save-page-btn');

function updateStatus(newStatus) {
    status = newStatus;

    // Remove all status classes
    statusDiv.classList.remove('checking', 'connected', 'disconnected');
    statusDot.classList.remove('checking', 'connected', 'disconnected');

    // Add new status class
    statusDiv.classList.add(newStatus);
    statusDot.classList.add(newStatus);

    // Update text
    const statusTexts = {
        checking: 'Checking...',
        connected: 'Connected',
        disconnected: 'Disconnected'
    };
    statusText.textContent = statusTexts[newStatus];

    // Show/hide error message
    errorMessage.style.display = newStatus === 'disconnected' ? 'block' : 'none';

    // Enable/disable button
    savePageBtn.disabled = newStatus !== 'connected';
}

async function checkStatus() {
    try {
        const res = await fetch('http://localhost:3666/api/status');
        if (res.ok) {
            updateStatus('connected');
        } else {
            updateStatus('disconnected');
        }
    } catch (e) {
        updateStatus('disconnected');
    }
}

async function handleSavePage() {
    try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs.length > 0 && tabs[0].id) {
            // Send get_page_data to content script (same flow as context menu)
            await browser.tabs.sendMessage(tabs[0].id, { action: "get_page_data" });
            window.close();
        }
    } catch (err) {
        console.error('Error saving page:', err);
    }
}

// Initialize
savePageBtn.addEventListener('click', handleSavePage);
checkStatus();

// Check status periodically
setInterval(checkStatus, 5000);
