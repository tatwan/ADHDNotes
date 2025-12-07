import { Box, Text, VStack, IconButton, Flex, Image, Badge, HStack } from '@chakra-ui/react';
import { useBookmarkStore, Bookmark } from '../../stores/bookmarkStore';
import { useEffect } from 'react';
import { FiTrash2, FiRefreshCw } from 'react-icons/fi';

const BookmarkCard = ({ bookmark }: { bookmark: Bookmark }) => {
    const { selectBookmark, selectedBookmarkId, deleteBookmark } = useBookmarkStore();
    const isSelected = selectedBookmarkId === bookmark.id;

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this bookmark?')) {
            deleteBookmark(bookmark.id);
        }
    };

    return (
        <Box
            p={3}
            borderRadius="md"
            bg={isSelected ? 'brand.50' : 'white'}
            borderWidth="1px"
            borderColor={isSelected ? 'brand.200' : 'gray.100'}
            cursor="pointer"
            onClick={() => selectBookmark(bookmark.id)}
            _hover={{ borderColor: 'brand.200', boxShadow: 'sm' }}
            transition="all 0.2s"
        >
            <Flex gap={2} mb={1}>
                {bookmark.faviconUrl && (
                    <Image src={bookmark.faviconUrl} boxSize="16px" mt={1} borderRadius="sm" fallbackSrc="" />
                )}
                <Text fontSize="sm" fontWeight="semibold" noOfLines={2} flex={1}>
                    {bookmark.title || bookmark.url}
                </Text>
            </Flex>

            <Text fontSize="xs" color="gray.500" noOfLines={2} mb={2}>
                {bookmark.description}
            </Text>

            <Flex justify="space-between" align="center">
                <HStack spacing={1}>
                    {bookmark.tags?.slice(0, 2).map((tag: any) => (
                        <Badge key={tag.id} size="sm" variant="subtle" colorScheme="blue" fontSize="0.6rem">
                            {tag.name}
                        </Badge>
                    ))}
                </HStack>
                <IconButton
                    aria-label="Delete"
                    icon={<FiTrash2 />}
                    size="xs"
                    variant="ghost"
                    colorScheme="red"
                    onClick={handleDelete}
                />
            </Flex>
        </Box>
    );
};

const BookmarkList = () => {
    const { bookmarks, fetchBookmarks, isLoading, deleteAllBookmarks } = useBookmarkStore();

    useEffect(() => {
        fetchBookmarks();
        // Set up polling or listen to events if possible
        const interval = setInterval(fetchBookmarks, 5000); // Poll for new bookmarks
        return () => clearInterval(interval);
    }, [fetchBookmarks]);

    const handleDeleteAll = () => {
        if (confirm(`Are you sure you want to delete all ${bookmarks.length} bookmarks? This cannot be undone.`)) {
            deleteAllBookmarks();
        }
    };

    if (isLoading && bookmarks.length === 0) {
        return <Box p={4} textAlign="center"><Text fontSize="sm" color="gray.500">Loading...</Text></Box>;
    }

    if (bookmarks.length === 0) {
        return (
            <Box p={8} textAlign="center">
                <Text fontSize="sm" color="gray.500">
                    No bookmarks yet.
                </Text>
                <Text fontSize="xs" color="gray.400" mt={2}>
                    Use the browser extension to save pages.
                </Text>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header with refresh button */}
            <Flex justify="space-between" align="center" p={2} mb={2}>
                <Text fontSize="sm" fontWeight="medium" color="gray.600">
                    {bookmarks.length} {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
                </Text>
                <HStack>
                    <IconButton
                        aria-label="Refresh bookmarks"
                        icon={<FiRefreshCw />}
                        size="xs"
                        variant="ghost"
                        onClick={fetchBookmarks}
                    />
                    <IconButton
                        aria-label="Delete all bookmarks"
                        icon={<FiTrash2 />}
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={handleDeleteAll}
                    />
                </HStack>
            </Flex>

            <VStack spacing={2} align="stretch" p={2} overflowY="auto" flex={1}>
                {bookmarks.map(b => (
                    <BookmarkCard key={b.id} bookmark={b} />
                ))}
            </VStack>
        </Box>
    );
};

export default BookmarkList;
