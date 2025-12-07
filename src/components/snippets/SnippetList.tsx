import { VStack, Box, Text, Flex, IconButton, HStack } from '@chakra-ui/react';
import { useSnippetStore } from '../../stores/snippetStore';
import { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FiRefreshCw, FiTrash2 } from 'react-icons/fi';

const SnippetList = () => {
    const { snippets, selectedSnippetId, loadSnippets, setSelectedSnippet, deleteSnippet, deleteAllSnippets } = useSnippetStore();

    useEffect(() => {
        loadSnippets();
    }, [loadSnippets]);

    const handleDelete = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (confirm('Delete this snippet?')) {
            deleteSnippet(id);
        }
    };

    const handleDeleteAll = () => {
        if (confirm(`Are you sure you want to delete all ${snippets.length} snippets? This cannot be undone.`)) {
            deleteAllSnippets();
        }
    };

    if (snippets.length === 0) {
        return (
            <Box p={10} textAlign="center" color="gray.500">
                <Text>No snippets yet</Text>
                <Text fontSize="sm" mt={2}>Highlight text on any webpage and right-click to add a snippet</Text>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header with refresh button */}
            <Flex justify="space-between" align="center" p={2} mb={2}>
                <Text fontSize="sm" fontWeight="medium" color="gray.600">
                    {snippets.length} {snippets.length === 1 ? 'snippet' : 'snippets'}
                </Text>
                <HStack>
                    <IconButton
                        aria-label="Refresh snippets"
                        icon={<FiRefreshCw />}
                        size="xs"
                        variant="ghost"
                        onClick={loadSnippets}
                    />
                    <IconButton
                        aria-label="Delete all snippets"
                        icon={<FiTrash2 />}
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={handleDeleteAll}
                    />
                </HStack>
            </Flex>

            <VStack align="stretch" spacing={2} p={2}>
                {snippets.map((snippet) => (
                    <Box
                        key={snippet.id}
                        p={3}
                        bg={selectedSnippetId === snippet.id ? 'brand.50' : 'white'}
                        borderRadius="md"
                        border="1px"
                        borderColor={selectedSnippetId === snippet.id ? 'brand.300' : 'gray.200'}
                        cursor="pointer"
                        onClick={() => setSelectedSnippet(snippet.id)}
                        _hover={{ bg: selectedSnippetId === snippet.id ? 'brand.50' : 'gray.50' }}
                        transition="all 0.2s"
                    >
                        <Text fontSize="sm" fontWeight="medium" noOfLines={2} mb={1}>
                            {snippet.content.slice(0, 100)}...
                        </Text>
                        <Flex justify="space-between" align="center" mt={2}>
                            <HStack spacing={2} flex={1}>
                                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                    {snippet.title || new URL(snippet.url).hostname}
                                </Text>
                                <Text fontSize="xs" color="gray.400">
                                    {formatDistanceToNow(new Date(snippet.createdAt), { addSuffix: true })}
                                </Text>
                            </HStack>
                            <IconButton
                                aria-label="Delete"
                                icon={<FiTrash2 />}
                                size="xs"
                                variant="ghost"
                                colorScheme="red"
                                onClick={(e) => handleDelete(e, snippet.id)}
                            />
                        </Flex>
                    </Box>
                ))}
            </VStack>
        </Box>
    );
};

export default SnippetList;

