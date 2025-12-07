import { Box, Heading, Text, Link, Flex, Badge, Button, Image } from '@chakra-ui/react';
import { useBookmarkStore } from '../../stores/bookmarkStore';
import { useEffect, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';

const BookmarkReader = () => {
    const { getSelectedBookmark, selectedBookmarkId } = useBookmarkStore();
    const [bookmark, setBookmark] = useState(getSelectedBookmark());

    useEffect(() => {
        setBookmark(getSelectedBookmark());
    }, [selectedBookmarkId, getSelectedBookmark]);

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

                {bookmark.content ? (
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
                            'blockquote': { borderLeft: '4px solid gray', pl: 4, fontStyle: 'italic', color: 'gray.600', my: 4 }
                        }}
                        dangerouslySetInnerHTML={{ __html: bookmark.content }}
                    />
                ) : (
                    <Text color="gray.500" fontStyle="italic">Content not available</Text>
                )}
            </Box>
        </Box>
    );
};

export default BookmarkReader;
