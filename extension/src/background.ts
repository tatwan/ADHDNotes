/// <reference types="chrome" />

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "save-to-adhdnotes",
        title: "Save to ADHDNotes",
        contexts: ["page", "selection"]
    });
    chrome.contextMenus.create({
        id: "add-as-snippet",
        title: "Add as Snippet",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "save-to-adhdnotes") {
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, { action: "save_page" });
        }
    } else if (info.menuItemId === "add-as-snippet") {
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, { action: "save_snippet", selectedText: info.selectionText });
        }
    }
});
