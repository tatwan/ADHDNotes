import Fastify from 'fastify';
import cors from '@fastify/cors';
import { getDB, bookmarks, tags, bookmarksTags } from '../db';
import { scrapeUrl } from '../services/scraper';
import { generateTags } from '../services/ai';
import { eq } from 'drizzle-orm';

const fastify = Fastify({ logger: true });

// Enable CORS for the extension
fastify.register(cors, {
    origin: '*', // Lock this down in production to extension ID
    methods: ['GET', 'POST', 'OPTIONS']
});

fastify.get('/api/status', async (request, reply) => {
    return { status: 'ok', app: 'ADHDNotes' };
});

fastify.post('/api/save-bookmark', async (request, reply) => {
    const { url, html } = request.body as { url: string, html?: string };

    if (!url) {
        return reply.status(400).send({ error: 'URL is required' });
    }

    try {
        const db = getDB();

        // Check if already exists
        const existing = db.select().from(bookmarks).where(eq(bookmarks.url, url)).get();
        if (existing) {
            return { message: 'Already saved', bookmark: existing };
        }

        // Process asynchronously (or await if we want to confirm save)
        // For now, awaiting to ensure success
        const data = await scrapeUrl(url, html);

        // Insert bookmark
        const result = db.insert(bookmarks).values({
            url: data.url,
            title: data.title,
            description: data.description,
            content: data.content,
            faviconUrl: data.image,
            isProcessed: true, // We processed it immediately here
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning().get();

        // Download asset if image exists
        if (data.image) {
            import('../services/assets').then(async ({ downloadAsset }) => {
                const localFilename = await downloadAsset(data.image, result.id);
                if (localFilename) {
                    db.update(bookmarks)
                        .set({ localImagePath: localFilename })
                        .where(eq(bookmarks.id, result.id))
                        .run();
                }
            });
        }

        // Generate tags (fire and forget or await)
        // Let's await for this MVP
        const generatedTags = await generateTags(data.textContent);

        for (const tagName of generatedTags) {
            // Find or create tag
            let tag = db.select().from(tags).where(eq(tags.name, tagName)).get();
            if (!tag) {
                tag = db.insert(tags).values({ name: tagName }).returning().get();
            }

            if (tag && result) {
                db.insert(bookmarksTags).values({
                    bookmarkId: result.id,
                    tagId: tag.id
                }).run();
            }
        }

        return { success: true, bookmark: result };
    } catch (err) {
        request.log.error(err);
        return reply.status(500).send({ error: 'Failed to save bookmark' });
    }
});

export function startServer(port: number = 3666) {
    fastify.listen({ port }, (err, address) => {
        if (err) {
            fastify.log.error(err);
            // Don't crash the main app, just log
        } else {
            console.log(`Local API Server listening on ${address}`);
        }
    });
    return fastify;
}

export function stopServer() {
    fastify.close();
}
