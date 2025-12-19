// Content script - collects page/snippet data and sends to background script
// Note: API calls are made in background.js because Safari content scripts
// have restrictions on cross-origin requests to localhost

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "get_page_data") {
        // Collect page data and send to background for API call
        const payload = {
            url: window.location.href,
            html: document.documentElement.outerHTML
        };

        browser.runtime.sendMessage({
            action: "save_page_api",
            payload: payload
        });

    } else if (request.action === "get_snippet_data") {
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
            content: finalHtml,
            textContent: finalText
        };

        browser.runtime.sendMessage({
            action: "save_snippet_api",
            payload: payload
        });

    } else if (request.action === "show_alert") {
        // Display alert from background script result
        alert(request.message);
    }
});
