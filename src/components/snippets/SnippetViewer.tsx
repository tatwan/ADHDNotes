import { Box, Heading, Text, Link, Flex, Button, Textarea, HStack, IconButton, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, useToast } from '@chakra-ui/react';
import { useSnippetStore } from '../../stores/snippetStore';
import { useState } from 'react';
import { FiExternalLink, FiEdit, FiSave, FiX, FiTrash2 } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SnippetViewer = () => {
    const { getSelectedSnippet, updateSnippetContent, deleteSnippet, setSelectedSnippet } = useSnippetStore();
    const snippet = getSelectedSnippet();
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const toast = useToast();

    if (!snippet) {
        return (
            <Box p={10} textAlign="center" color="gray.500">
                <Text>Select a snippet to view</Text>
            </Box>
        );
    }

    const handleEdit = () => {
        setEditedContent(snippet.content);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (editedContent.trim()) {
            await updateSnippetContent(snippet.id, editedContent);
            setIsEditing(false);
            toast({
                title: 'Snippet updated',
                status: 'success',
                duration: 2000,
            });
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedContent('');
    };

    const handleDelete = async () => {
        await deleteSnippet(snippet.id);
        setSelectedSnippet(null);
        onDeleteClose();
        toast({
            title: 'Snippet deleted',
            status: 'info',
            duration: 2000,
        });
    };

    const openUrl = async () => {
        try {
            await window.electronAPI.openExternal(snippet.url);
        } catch (error) {
            console.error('Failed to open URL:', error);
        }
    };

    return (
        <Box height="100%" overflowY="auto" bg="white">
            <Box maxW="800px" mx="auto" p={8}>
                {/* Header with actions */}
                <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">Snippet</Heading>
                    <HStack>
                        {!isEditing && (
                            <>
                                <IconButton
                                    aria-label="Edit"
                                    icon={<FiEdit />}
                                    size="sm"
                                    onClick={handleEdit}
                                />
                                <IconButton
                                    aria-label="Delete"
                                    icon={<FiTrash2 />}
                                    size="sm"
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={onDeleteOpen}
                                />
                            </>
                        )}
                    </HStack>
                </Flex>

                {/* Metadata */}
                <Flex align="center" gap={3} mb={6} color="gray.500" fontSize="sm" flexWrap="wrap">
                    <Text fontWeight="medium">{snippet.title}</Text>
                    <Text>•</Text>
                    <Link onClick={openUrl} display="flex" alignItems="center" gap={1} color="blue.500">
                        Visit Source <FiExternalLink />
                    </Link>
                    <Text>•</Text>
                    <Text>{new Date(snippet.createdAt).toLocaleDateString()}</Text>
                    {snippet.updatedAt && new Date(snippet.updatedAt).getTime() !== new Date(snippet.createdAt).getTime() && (
                        <>
                            <Text>•</Text>
                            <Text fontSize="xs">Edited {new Date(snippet.updatedAt).toLocaleDateString()}</Text>
                        </>
                    )}
                </Flex>

                {/* Content */}
                {isEditing ? (
                    <Box>
                        <Textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            minH="400px"
                            mb={4}
                            fontFamily="monospace"
                        />
                        <HStack>
                            <Button leftIcon={<FiSave />} colorScheme="brand" onClick={handleSave}>
                                Save
                            </Button>
                            <Button leftIcon={<FiX />} variant="ghost" onClick={handleCancel}>
                                Cancel
                            </Button>
                        </HStack>
                    </Box>
                ) : (
                    <Box
                        className="prose"
                        sx={{
                            'p': { mb: 4, lineHeight: '1.7' },
                            'h1, h2, h3': { mt: 6, mb: 3, fontWeight: 'bold' },
                            'ul, ol': { pl: 6, mb: 4 },
                            'li': { mb: 1 },
                            'code': { bg: 'gray.100', px: 1, py: 0.5, borderRadius: 'sm' },
                            'pre': { bg: 'gray.50', p: 4, borderRadius: 'md', overflowX: 'auto' },
                            'blockquote': { borderLeft: '4px solid', borderColor: 'gray.300', pl: 4, fontStyle: 'italic', color: 'gray.600', my: 4 }
                        }}
                    >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {snippet.content}
                        </ReactMarkdown>
                    </Box>
                )}
            </Box>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Delete Snippet</ModalHeader>
                    <ModalBody>
                        <Text>Are you sure you want to delete this snippet? This action cannot be undone.</Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onDeleteClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="red" onClick={handleDelete}>
                            Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default SnippetViewer;
