// import metascraper from 'metascraper';
// import metascraperTitle from 'metascraper-title';
// import metascraperDescription from 'metascraper-description';
// import metascraperImage from 'metascraper-image';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
// import fetch from 'node:fetch'; 

// const scraper = metascraper([
//     metascraperTitle(),
//     metascraperDescription(),
//     metascraperImage()
// ]);

export async function scrapeUrl(url: string, providedHtml?: string) {
    try {
        let html = providedHtml;
        if (!html) {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            html = await response.text();
        }

        // Use Readability for content extraction
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        // Basic metadata extraction from DOM
        const doc = dom.window.document;
        const title = article?.title || doc.querySelector('title')?.textContent || '';
        const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
            doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
        const image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';

        return {
            url,
            title,
            description,
            image,
            favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`,
            textContent: article?.textContent || '',
            content: article?.content || ''
        };
    } catch (error) {
        console.error('Scraping error:', error);
        throw error;
    }
}
