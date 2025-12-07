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
    }
});
