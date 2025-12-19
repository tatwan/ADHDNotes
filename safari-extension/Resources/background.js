// Background script - sets up context menus and handles API calls for Safari extension
// Note: API calls are made here (not in content.js) because Safari content scripts
// have restrictions on cross-origin requests to localhost

browser.runtime.onInstalled.addListener(() => {
    // Create context menu for saving entire page
    browser.contextMenus.create({
        id: "save-to-adhdnotes",
        title: "Save to ADHDNotes",
        contexts: ["page", "selection"]
    });

    // Create context menu for saving selected text as snippet
    browser.contextMenus.create({
        id: "add-as-snippet",
        title: "Add as Snippet",
        contexts: ["selection"]
    });
});

browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "save-to-adhdnotes") {
        if (tab?.id) {
            // Request page data from content script
            browser.tabs.sendMessage(tab.id, { action: "get_page_data" });
        }
    } else if (info.menuItemId === "add-as-snippet") {
        if (tab?.id) {
            // Request snippet data from content script
            browser.tabs.sendMessage(tab.id, {
                action: "get_snippet_data",
                selectedText: info.selectionText
            });
        }
    }
});

// Handle messages from content script and make API calls
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "save_page_api") {
        // Make API call from background script (has more permissions)
        fetch('http://localhost:3666/api/save-bookmark', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message.payload)
        })
            .then(async (res) => {
                const data = await res.json();
                // Send result back to content script for alert
                if (sender.tab?.id) {
                    browser.tabs.sendMessage(sender.tab.id, {
                        action: "show_alert",
                        success: res.ok,
                        message: res.ok ? 'Saved to ADHDNotes!' : `Error saving: ${data.error || 'Unknown error'}`
                    });
                }
            })
            .catch(err => {
                console.error('API error:', err);
                if (sender.tab?.id) {
                    browser.tabs.sendMessage(sender.tab.id, {
                        action: "show_alert",
                        success: false,
                        message: 'Failed to save to ADHDNotes. Is the app running?'
                    });
                }
            });
    } else if (message.action === "save_snippet_api") {
        // Make API call from background script
        fetch('http://localhost:3666/api/save-snippet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message.payload)
        })
            .then(async (res) => {
                const data = await res.json();
                if (sender.tab?.id) {
                    browser.tabs.sendMessage(sender.tab.id, {
                        action: "show_alert",
                        success: res.ok,
                        message: res.ok ? 'Snippet saved to ADHDNotes!' : `Error saving snippet: ${data.error || 'Unknown error'}`
                    });
                }
            })
            .catch(err => {
                console.error('API error:', err);
                if (sender.tab?.id) {
                    browser.tabs.sendMessage(sender.tab.id, {
                        action: "show_alert",
                        success: false,
                        message: 'Failed to save snippet. Is ADHDNotes running?'
                    });
                }
            });
    }
});
