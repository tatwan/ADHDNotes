/// <reference types="chrome" />

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "save_page") {
        const payload = {
            url: window.location.href,
            html: document.documentElement.outerHTML
        };

        // Attempt to contact local server
        fetch('http://localhost:3666/api/save-bookmark', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(async (res) => {
                const data = await res.json();
                if (res.ok) {
                    alert('Saved to ADHDNotes!');
                } else {
                    alert(`Error saving: ${data.error || 'Unknown error'}`);
                }
            })
            .catch(err => {
                alert('Failed to save to ADHDNotes. Is the app running?');
                console.error(err);
            });
    } else if (request.action === "save_snippet") {
        const payload = {
            url: window.location.href,
            title: document.title,
            content: request.selectedText || window.getSelection()?.toString() || ''
        };

        if (!payload.content.trim()) {
            alert('No text selected!');
            return;
        }

        fetch('http://localhost:3666/api/save-snippet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(async (res) => {
                const data = await res.json();
                if (res.ok) {
                    alert('Snippet saved to ADHDNotes!');
                } else {
                    alert(`Error saving snippet: ${data.error || 'Unknown error'}`);
                }
            })
            .catch(err => {
                alert('Failed to save snippet. Is ADHDNotes running?');
                console.error(err);
            });
    }
});
