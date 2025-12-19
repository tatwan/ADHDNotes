import { Box, Heading, Text, Link, Flex, Badge, Button, Image } from '@chakra-ui/react';
import { useBookmarkStore } from '../../stores/bookmarkStore';
import { useEffect, useState, useCallback } from 'react';
import { FiExternalLink } from 'react-icons/fi';

/**
 * Process HTML content to replace adhdnotes-asset:// URLs with data URLs
 */
async function processContentImages(content: string): Promise<string> {
    if (!content) return content;

    // Find all adhdnotes-asset:// URLs
    const assetRegex = /adhdnotes-asset:\/\/([^"'\s]+)/g;
    const matches = [...content.matchAll(assetRegex)];

    if (matches.length === 0) return content;

    // Create a map of asset URLs to data URLs
    const replacements: Map<string, string> = new Map();

    // Load all assets in parallel
    await Promise.all(
        matches.map(async (match) => {
            const fullMatch = match[0];
            const filename = match[1];

            if (replacements.has(fullMatch)) return; // Already processed

            try {
                // @ts-ignore
                const result = await window.electronAPI.readBookmarkAsset(filename);
                if (result.success && result.dataUrl) {
                    replacements.set(fullMatch, result.dataUrl);
                }
            } catch (error) {
                console.warn(`Failed to load asset: ${filename}`, error);
            }
        })
    );

    // Replace all asset URLs with data URLs
    let processedContent = content;
    for (const [assetUrl, dataUrl] of replacements) {
        processedContent = processedContent.split(assetUrl).join(dataUrl);
    }

    return processedContent;
}

const BookmarkReader = () => {
    const { getSelectedBookmark, selectedBookmarkId } = useBookmarkStore();
    const [bookmark, setBookmark] = useState(getSelectedBookmark());
    const [processedContent, setProcessedContent] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Process content when bookmark changes
    const loadContent = useCallback(async () => {
        const currentBookmark = getSelectedBookmark();
        setBookmark(currentBookmark);

        if (currentBookmark?.content) {
            setIsProcessing(true);
            try {
                const processed = await processContentImages(currentBookmark.content);
                setProcessedContent(processed);
            } catch (error) {
                console.error('Error processing content:', error);
                setProcessedContent(currentBookmark.content);
            } finally {
                setIsProcessing(false);
            }
        } else {
            setProcessedContent(null);
        }
    }, [getSelectedBookmark]);

    useEffect(() => {
        loadContent();
    }, [selectedBookmarkId, loadContent]);

    if (!bookmark) {
        return (
            <Box p={10} textAlign="center" color="gray.500">
                <Text>Select a bookmark to read</Text>
            </Box>
        );
    }

    return (
        <Box height="100%" overflowY="auto" bg="white">
            <Box maxW="800px" mx="auto" p={8}>
                <Heading size="xl" mb={4}>{bookmark.title}</Heading>

                <Flex align="center" gap={3} mb={6} color="gray.500" fontSize="sm">
                    {bookmark.faviconUrl && (
                        <Image src={bookmark.faviconUrl} boxSize="20px" />
                    )}
                    <Link href={bookmark.url} isExternal display="flex" alignItems="center" gap={1} color="blue.500">
                        Visit Original <FiExternalLink />
                    </Link>
                    <Text>•</Text>
                    <Text>{new Date(bookmark.createdAt).toLocaleDateString()}</Text>
                    <Button
                        size="xs"
                        variant="outline"
                        colorScheme="blue"
                        ml="auto"
                        onClick={async () => {
                            // @ts-ignore
                            await window.electronAPI.appendToDailyNote(`- [${bookmark.title || 'Bookmark'}](${bookmark.url})`);
                            // optional toast or alert
                        }}
                    >
                        Ref in Daily Note
                    </Button>
                </Flex>

                {bookmark.tags && bookmark.tags.length > 0 && (
                    <Flex gap={2} mb={6}>
                        {bookmark.tags.map((tag: any) => (
                            <Badge key={tag.id} colorScheme="purple">{tag.name}</Badge>
                        ))}
                    </Flex>
                )}

                {isProcessing ? (
                    <Text color="gray.500">Loading content...</Text>
                ) : processedContent ? (
                    <Box
                        className="prose"
                        sx={{
                            'img': { maxWidth: '100%', height: 'auto', borderRadius: 'md', my: 4 },
                            'p': { mb: 4, lineHeight: '1.7' },
                            'h1, h2, h3': { mt: 6, mb: 3, fontWeight: 'bold' },
                            'h1': { fontSize: '2xl' },
                            'h2': { fontSize: 'xl' },
                            'ul, ol': { pl: 6, mb: 4 },
                            'li': { mb: 1 },
                            'a': { color: 'blue.500', textDecoration: 'underline', cursor: 'pointer', _hover: { color: 'blue.600' } },
                            'blockquote': { borderLeft: '4px solid gray', pl: 4, fontStyle: 'italic', color: 'gray.600', my: 4 }
                        }}
                        onClick={(e: React.MouseEvent) => {
                            const target = e.target as HTMLElement;
                            if (target.tagName === 'A') {
                                e.preventDefault();
                                const href = target.getAttribute('href');
                                if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                                    // @ts-ignore
                                    window.electronAPI.openExternal(href);
                                }
                            }
                        }}
                        dangerouslySetInnerHTML={{ __html: processedContent }}
                    />
                ) : (
                    <Text color="gray.500" fontStyle="italic">Content not available</Text>
                )}
            </Box>
        </Box>
    );
};

export default BookmarkReader;
