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
        // Get selection as HTML to preserve formatting
        const selection = window.getSelection();
        let htmlContent = '';
        let textContent = '';

        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const fragment = range.cloneContents();

            // Create a temporary container to serialize the HTML
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(fragment);
            htmlContent = tempDiv.innerHTML;
            textContent = selection.toString();
        }

        // Use selectedText from context menu if available
        const finalHtml = htmlContent || request.selectedText || '';
        const finalText = textContent || request.selectedText || '';

        if (!finalText.trim()) {
            alert('No text selected!');
            return;
        }

        const payload = {
            url: window.location.href,
            title: document.title,
            content: finalHtml,  // Send HTML content
            textContent: finalText  // Also send plain text as fallback
        };


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
