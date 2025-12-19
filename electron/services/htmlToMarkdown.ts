import TurndownService from 'turndown';

// Create a configured Turndown instance
const turndown = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined'
});

// Add rules for better conversion
turndown.addRule('strikethrough', {
    filter: ['del', 's'],
    replacement: (content: string) => `~~${content}~~`
});

// Preserve code blocks
turndown.addRule('pre', {
    filter: 'pre',
    replacement: (content: string, node: Node) => {
        const element = node as HTMLPreElement;
        const codeElement = element.querySelector('code');
        const language = codeElement?.className?.match(/language-(\w+)/)?.[1] || '';
        const code = codeElement?.textContent || element.textContent || '';
        return `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
    }
});

/**
 * Convert HTML content to Markdown
 */
export function htmlToMarkdown(html: string): string {
    if (!html || !html.trim()) {
        return '';
    }

    try {
        // Clean up the HTML slightly
        let cleanHtml = html
            .replace(/<br\s*\/?>/gi, '\n')  // Convert br to newlines
            .replace(/&nbsp;/g, ' ');        // Convert nbsp to regular spaces

        const markdown = turndown.turndown(cleanHtml);

        // Clean up extra whitespace while preserving intentional formatting
        return markdown
            .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
            .trim();
    } catch (error) {
        console.error('Error converting HTML to Markdown:', error);
        return html; // Return original if conversion fails
    }
}
