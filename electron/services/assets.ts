import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { JSDOM } from 'jsdom';
import crypto from 'crypto';

const streamPipeline = promisify(pipeline);

/**
 * Get the assets directory path
 */
function getAssetsDir(): string {
    const documentsPath = app.getPath('documents');
    return path.join(documentsPath, 'ADHDNotes', 'bookmarks', 'assets');
}

/**
 * Extract file extension from URL or content-type
 */
function getImageExtension(url: string, contentType: string | null): string {
    // Try to get extension from content-type first
    if (contentType) {
        if (contentType.includes('png')) return 'png';
        if (contentType.includes('gif')) return 'gif';
        if (contentType.includes('svg')) return 'svg';
        if (contentType.includes('webp')) return 'webp';
        if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
    }
    
    // Try to extract from URL
    try {
        const urlPath = new URL(url).pathname;
        const ext = path.extname(urlPath).toLowerCase().replace('.', '');
        if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
            return ext === 'jpeg' ? 'jpg' : ext;
        }
    } catch {
        // URL parsing failed, use default
    }
    
    return 'jpg'; // default
}

/**
 * Generate a unique filename for an image based on URL hash
 */
function generateImageFilename(url: string, bookmarkId: number, index: number, ext: string): string {
    const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
    return `${bookmarkId}_img_${index}_${hash}.${ext}`;
}

/**
 * Download a single image asset
 */
export async function downloadAsset(url: string, bookmarkId: number): Promise<string | null> {
    try {
        const assetsDir = getAssetsDir();

        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);

        const contentType = response.headers.get('content-type');
        const ext = getImageExtension(url, contentType);
        const filename = `${bookmarkId}_image.${ext}`;
        const localPath = path.join(assetsDir, filename);

        if (response.body) {
            // @ts-ignore
            await streamPipeline(response.body, fs.createWriteStream(localPath));
            return filename;
        }
        return null;
    } catch (e) {
        console.error("Failed to download asset:", e);
        return null;
    }
}

/**
 * Download all images from HTML content and rewrite src attributes to local paths
 * Returns the modified HTML with local image references
 */
export async function downloadContentImages(
    htmlContent: string, 
    bookmarkId: number,
    baseUrl: string
): Promise<string> {
    if (!htmlContent) return htmlContent;

    try {
        const assetsDir = getAssetsDir();
        
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
        }

        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;
        const images = document.querySelectorAll('img');

        let imageIndex = 0;
        const downloadPromises: Promise<void>[] = [];

        for (const img of images) {
            let src = img.getAttribute('src');
            if (!src) continue;

            // Skip data URLs (already embedded)
            if (src.startsWith('data:')) continue;

            // Handle relative URLs
            try {
                if (!src.startsWith('http://') && !src.startsWith('https://')) {
                    src = new URL(src, baseUrl).href;
                }
            } catch {
                console.warn(`Invalid image URL: ${src}`);
                continue;
            }

            const currentIndex = imageIndex++;
            const imgElement = img;
            const imageUrl = src;

            downloadPromises.push(
                (async () => {
                    try {
                        const response = await fetch(imageUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                            }
                        });
                        
                        if (!response.ok) {
                            console.warn(`Failed to fetch image: ${imageUrl}`);
                            return;
                        }

                        const contentType = response.headers.get('content-type');
                        
                        // Skip non-image responses
                        if (contentType && !contentType.includes('image')) {
                            console.warn(`Not an image: ${imageUrl} (${contentType})`);
                            return;
                        }

                        const ext = getImageExtension(imageUrl, contentType);
                        const filename = generateImageFilename(imageUrl, bookmarkId, currentIndex, ext);
                        const localPath = path.join(assetsDir, filename);

                        if (response.body) {
                            // @ts-ignore
                            await streamPipeline(response.body, fs.createWriteStream(localPath));
                            
                            // Update the img src to use a local asset path marker
                            // Format: adhdnotes-asset://filename
                            imgElement.setAttribute('src', `adhdnotes-asset://${filename}`);
                            imgElement.setAttribute('data-original-src', imageUrl);
                        }
                    } catch (error) {
                        console.warn(`Error downloading image ${imageUrl}:`, error);
                    }
                })()
            );
        }

        // Wait for all downloads to complete
        await Promise.all(downloadPromises);

        // Return the modified HTML
        return dom.serialize();
    } catch (error) {
        console.error('Error processing content images:', error);
        return htmlContent; // Return original on error
    }
}

/**
 * Get the full local path for an asset filename
 */
export function getAssetPath(filename: string): string {
    return path.join(getAssetsDir(), filename);
}
