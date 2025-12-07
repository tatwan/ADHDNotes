/// <reference types="chrome" />

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "save-to-adhdnotes",
        title: "Save to ADHDNotes",
        contexts: ["page", "selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "save-to-adhdnotes") {
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, { action: "save_page" });
        }
    }
});
