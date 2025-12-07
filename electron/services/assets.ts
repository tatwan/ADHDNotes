import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline);

export async function downloadAsset(url: string, bookmarkId: number): Promise<string | null> {
    try {
        const documentsPath = app.getPath('documents');
        const assetsDir = path.join(documentsPath, 'ADHDNotes', 'bookmarks', 'assets');

        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);

        const contentType = response.headers.get('content-type');
        let ext = 'jpg';
        if (contentType) {
            if (contentType.includes('png')) ext = 'png';
            if (contentType.includes('gif')) ext = 'gif';
            if (contentType.includes('svg')) ext = 'svg';
            if (contentType.includes('webp')) ext = 'webp';
        }

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
