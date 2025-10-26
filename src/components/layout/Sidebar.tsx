import { Box, VStack, Text, Button, IconButton, Flex, Input, HStack, Menu, MenuList, MenuItem, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@chakra-ui/react';
import { FiPlus, FiFolder, FiFile, FiCheck, FiX, FiTrash2, FiEdit, FiCopy, FiFileText, FiRefreshCw, FiSearch, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { useAppStore } from '@stores/appStore';
import { useNoteStore } from '@stores/noteStore';
import { FileTreeItem } from '@/types';
import { join, dirname } from 'path-browserify';
import { getProjectsDir, deleteFile, renameFile, copyFile, createFolder } from '@utils/fileSystem';
import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';

const Sidebar = () => {
  const { fileTree, loadFileTree } = useAppStore();
  const { loadProjectNote, createProjectNote } = useNoteStore();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [contextMenuItem, setContextMenuItem] = useState<FileTreeItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [currentDirectory, setCurrentDirectory] = useState<string | undefined>();
  const [activeItem, setActiveItem] = useState<FileTreeItem | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Toggle folder expansion
  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  const [itemToDelete, setItemToDelete] = useState<FileTreeItem | null>(null);

  // Load both file trees on mount
  useEffect(() => {
    loadFileTree();

    // Set up file watchers
    window.electronAPI.onFileAdded(() => {
      loadFileTree();
    });
    window.electronAPI.onFileChanged(() => {
      loadFileTree();
    });
    window.electronAPI.onFileDeleted(() => {
      loadFileTree();
    });

    return () => {
      window.electronAPI.removeFileListeners();
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const findItemRecursive = (items: FileTreeItem[], id: string): FileTreeItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemRecursive(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const getAllItemIds = (items: FileTreeItem[]): string[] => {
    const ids: string[] = [];
    for (const item of items) {
      ids.push(item.id);
      if (item.children) {
        ids.push(...getAllItemIds(item.children));
      }
    }
    return ids;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = findItemRecursive(fileTree, active.id as string);
    setActiveItem(item || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) {
      // Dropped outside any droppable - move to root
      const draggedItem = findItemRecursive(fileTree, active.id as string);
      if (!draggedItem || draggedItem.isDirectory) return;

      const projectsDir = await getProjectsDir();
      const newPath = join(projectsDir, draggedItem.name);
      const result = await renameFile(draggedItem.path, newPath);

      if (result.success) {
        await loadFileTree();
      }
      return;
    }

    const draggedItem = findItemRecursive(fileTree, active.id as string);
    const targetItem = findItemRecursive(fileTree, over.id as string);

    if (!draggedItem || draggedItem.isDirectory) return;

    // Allow dropping on directories or on the root level
    let targetPath: string;
    if (targetItem?.isDirectory) {
      targetPath = targetItem.path;
    } else if (over.id === 'root') {
      const projectsDir = await getProjectsDir();
      targetPath = projectsDir;
    } else {
      return;
    }

    // Move the file to the target directory
    const newPath = join(targetPath, draggedItem.name);
    const result = await renameFile(draggedItem.path, newPath);

    if (result.success) {
      await loadFileTree();
    }
  };

  const handleFileClick = async (item: FileTreeItem) => {
    if (!item.isDirectory) {
      await loadProjectNote(item.path);
    }
  };

  const handleNewNote = (directoryPath?: string) => {
    setIsAddingNote(true);
    setNewNoteTitle('');
    // Store the directory where the new note should be created
    setCurrentDirectory(directoryPath);
  };

  const handleCancelNewNote = () => {
    setIsAddingNote(false);
    setNewNoteTitle('');
    setCurrentDirectory(undefined);
  };

  const handleConfirmNewNote = async () => {
    if (!newNoteTitle.trim()) return;

    const title = newNoteTitle.trim();
    const baseDir = currentDirectory || (await getProjectsDir());
    const filePath = join(baseDir, `${title}.md`);

    await createProjectNote(title, filePath);
    await loadFileTree();

    setIsAddingNote(false);
    setNewNoteTitle('');
    setCurrentDirectory(undefined);
  };

  const handleNewNoteKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmNewNote();
    } else if (e.key === 'Escape') {
      handleCancelNewNote();
    }
  };

  const handleDeleteNote = async (item: FileTreeItem) => {
    setItemToDelete(item);
    onDeleteModalOpen();
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteFile(itemToDelete.path);
      await loadFileTree();
    } catch (error) {
      console.error('Failed to delete:', error);
      // You could add a toast notification here
    }

    setItemToDelete(null);
    onDeleteModalClose();
  };

  const handleCancelDelete = () => {
    setItemToDelete(null);
    onDeleteModalClose();
  };

  const handleRenameNote = (item: FileTreeItem) => {
    setIsRenaming(item.path);
    setRenameTitle(item.name.replace('.md', ''));
  };

  const handleConfirmRename = async (item: FileTreeItem) => {
    if (!renameTitle.trim()) return;

    const newName = `${renameTitle.trim()}.md`;
    const dir = dirname(item.path);
    const newPath = join(dir, newName);

    const result = await renameFile(item.path, newPath);
    if (result.success) {
      await loadFileTree();
    }

    setIsRenaming(null);
    setRenameTitle('');
  };

  const handleCancelRename = () => {
    setIsRenaming(null);
    setRenameTitle('');
  };

  const handleDuplicateNote = async (item: FileTreeItem) => {
    if (item.isDirectory) return;

    const baseName = item.name.replace('.md', '');
    const dir = dirname(item.path);
    let newName = `${baseName} copy.md`;
    let counter = 1;

    // Find a unique name
    while (true) {
      const testPath = join(dir, newName);
      const exists = await window.electronAPI.fileExists(testPath);
      if (!exists.exists) break;
      newName = `${baseName} copy ${counter}.md`;
      counter++;
    }

    const newPath = join(dir, newName);
    const result = await copyFile(item.path, newPath);

    if (result.success) {
      await loadFileTree();
    }
  };

  const handleNewFolder = () => {
    setIsAddingFolder(true);
    setNewFolderName('');
  };

  const handleCancelNewFolder = () => {
    setIsAddingFolder(false);
    setNewFolderName('');
  };

  const handleConfirmNewFolder = async () => {
    if (!newFolderName.trim()) return;

    const folderName = newFolderName.trim();
    const projectsDir = await getProjectsDir();
    const folderPath = join(projectsDir, folderName);

    const result = await createFolder(folderPath);
    if (result.success) {
      await loadFileTree();
    }

    setIsAddingFolder(false);
    setNewFolderName('');
  };

  const handleNewFolderKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmNewFolder();
    } else if (e.key === 'Escape') {
      handleCancelNewFolder();
    }
  };

  const RootDroppable = ({ children }: { children: React.ReactNode }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: 'root',
    });

    return (
      <Box
        ref={setNodeRef}
        minH="50px"
        p={2}
        bg={isOver ? 'green.50' : 'transparent'}
        border={isOver ? '2px dashed green.200' : 'none'}
        borderRadius="md"
        transition="all 0.2s"
      >
        {children}
      </Box>
    );
  };

  const DroppableFolder = ({ item, children }: { item: FileTreeItem; children: React.ReactNode }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: item.id,
    });

    return (
      <Box
        ref={setNodeRef}
        bg={isOver ? 'blue.50' : 'transparent'}
        border={isOver ? '2px dashed blue.200' : 'none'}
        borderRadius="md"
        transition="all 0.2s"
      >
        {children}
      </Box>
    );
  };

  const DraggableItem = ({ item, children }: { item: FileTreeItem; children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: item.id,
    });

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: isDragging ? 0 : 1,
    };

    return (
      <Box ref={setNodeRef} style={style} {...listeners} {...attributes}>
        {children}
      </Box>
    );
  };

  const handleRefresh = async () => {
    await loadFileTree();
  };

  const filterFileTree = (items: FileTreeItem[], query: string): FileTreeItem[] => {
    if (!query.trim()) return items;

    return items
      .map(item => {
        if (item.isDirectory) {
          const filteredChildren = filterFileTree(item.children || [], query);
          if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          }
          return null;
        } else {
          // For files, check if the filename (without extension) contains the search query
          const fileNameWithoutExt = item.name.replace('.md', '').toLowerCase();
          if (fileNameWithoutExt.includes(query.toLowerCase())) {
            return item;
          }
          return null;
        }
      })
      .filter((item): item is FileTreeItem => item !== null);
  };

  const renderFileTree = (items: FileTreeItem[], level: number = 0) => {
    return items.map((item) => (
      <DraggableItem key={item.id} item={item}>
        {item.isDirectory ? (
          <DroppableFolder item={item}>
            <Box pl={level * 4}>
              {isRenaming === item.path ? (
                <HStack spacing={2}>
                  <Input
                    size="sm"
                    value={renameTitle}
                    onChange={(e) => setRenameTitle(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleConfirmRename(item);
                      if (e.key === 'Escape') handleCancelRename();
                    }}
                    autoFocus
                  />
                  <IconButton
                    aria-label="Confirm rename"
                    icon={<FiCheck />}
                    size="sm"
                    colorScheme="green"
                    onClick={() => handleConfirmRename(item)}
                  />
                  <IconButton
                    aria-label="Cancel rename"
                    icon={<FiX />}
                    size="sm"
                    onClick={handleCancelRename}
                  />
                </HStack>
              ) : (
                <Menu isOpen={contextMenuItem?.id === item.id} onClose={() => setContextMenuItem(null)}>
                  <Flex
                    align="center"
                    p={2}
                    cursor="pointer"
                    _hover={{ bg: 'gray.200' }}
                    borderRadius="md"
                    onClick={() => toggleFolderExpansion(item.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenuItem(item);
                    }}
                    id={item.id}
                  >
                    {expandedFolders.has(item.id) ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                    <FiFolder style={{ marginLeft: '4px' }} />
                    <Text ml={2} fontSize="sm" noOfLines={1}>
                      {item.name}
                    </Text>
                  </Flex>
                  <MenuList>
                    <MenuItem icon={<FiEdit />} onClick={() => handleRenameNote(item)}>
                      Rename
                    </MenuItem>
                    <MenuItem icon={<FiCopy />} onClick={() => handleDuplicateNote(item)}>
                      Duplicate
                    </MenuItem>
                    <MenuItem icon={<FiFileText />} onClick={() => handleNewNote(item.isDirectory ? item.path : undefined)}>
                      New File
                    </MenuItem>
                    <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => handleDeleteNote(item)}>
                      Delete
                    </MenuItem>
                  </MenuList>
                </Menu>
              )}
              {item.children && item.children.length > 0 && expandedFolders.has(item.id) && (
                <Box>{renderFileTree(item.children, level + 1)}</Box>
              )}
            </Box>
          </DroppableFolder>
        ) : (
          <Box pl={level * 4}>
            {isRenaming === item.path ? (
              <HStack spacing={2}>
                <Input
                  size="sm"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleConfirmRename(item);
                    if (e.key === 'Escape') handleCancelRename();
                  }}
                  autoFocus
                />
                <IconButton
                  aria-label="Confirm rename"
                  icon={<FiCheck />}
                  size="sm"
                  colorScheme="green"
                  onClick={() => handleConfirmRename(item)}
                />
                <IconButton
                  aria-label="Cancel rename"
                  icon={<FiX />}
                  size="sm"
                  onClick={handleCancelRename}
                />
              </HStack>
            ) : (
              <Menu isOpen={contextMenuItem?.id === item.id} onClose={() => setContextMenuItem(null)}>
                <Flex
                  align="center"
                  p={2}
                  cursor="grab"
                  _hover={{ bg: 'gray.200' }}
                  borderRadius="md"
                  onClick={() => handleFileClick(item)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenuItem(item);
                  }}
                  id={item.id}
                >
                  <FiFile />
                  <Text ml={2} fontSize="sm" noOfLines={1}>
                    {item.name}
                  </Text>
                </Flex>
                <MenuList>
                  <MenuItem icon={<FiEdit />} onClick={() => handleRenameNote(item)}>
                    Rename
                  </MenuItem>
                  <MenuItem icon={<FiCopy />} onClick={() => handleDuplicateNote(item)}>
                    Duplicate
                  </MenuItem>
                  <MenuItem icon={<FiFileText />} onClick={() => handleNewNote(item.isDirectory ? item.path : undefined)}>
                    New File
                  </MenuItem>
                  <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => handleDeleteNote(item)}>
                    Delete
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
          </Box>
        )}
      </DraggableItem>
    ));
  };  return (
    <Box height="100%" display="flex" flexDirection="column">
      {/* Header */}
      <Box p={4} borderBottom="1px" borderColor="gray.200">
        {isAddingNote ? (
          <HStack spacing={2}>
            <Input
              size="sm"
              placeholder="Note title..."
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyPress={handleNewNoteKeyPress}
              autoFocus
            />
            <IconButton
              aria-label="Confirm"
              icon={<FiCheck />}
              size="sm"
              colorScheme="green"
              onClick={handleConfirmNewNote}
              isDisabled={!newNoteTitle.trim()}
            />
            <IconButton
              aria-label="Cancel"
              icon={<FiX />}
              size="sm"
              variant="ghost"
              onClick={handleCancelNewNote}
            />
          </HStack>
        ) : (
          <Flex justify="space-between" align="center">
            <Text fontSize="lg" fontWeight="bold">
              Notes
            </Text>
            <IconButton
              aria-label="New note"
              icon={<FiPlus />}
              size="sm"
              onClick={() => handleNewNote()}
            />
          </Flex>
        )}
      </Box>

      {/* File Tree */}
      <Box flex="1" overflow="auto" p={2}>
        {/* Search and Refresh Bar */}
        <Box mb={3}>
          <Flex gap={2}>
            <Flex flex="1" position="relative">
              <Input
                size="sm"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                pr="2.5rem"
              />
              <Box position="absolute" right="0.5rem" top="50%" transform="translateY(-50%)">
                <FiSearch size={16} color="gray" />
              </Box>
            </Flex>
            <IconButton
              aria-label="Refresh notes"
              icon={<FiRefreshCw />}
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
            />
          </Flex>
        </Box>

        <VStack align="stretch" spacing={1}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Visible drop zone for moving items to the root/projects dir. Appears while dragging. */}
            {activeItem && (
              <Box px={2} mb={2}>
                <RootDroppable>
                  <Flex align="center" justify="center" p={2} color="gray.600">
                    Drop here to move to top-level
                  </Flex>
                </RootDroppable>
              </Box>
            )}

            {/* File tree (folders are droppable themselves) */}
            {fileTree.length > 0 ? (
              renderFileTree(filterFileTree(fileTree, searchQuery))
            ) : (
              <Text fontSize="sm" color="gray.500" px={2} py={4} textAlign="center">
                No notes yet
              </Text>
            )}

            <DragOverlay>
              {activeItem ? (
                <Box p={2} bg="white" borderRadius="md" boxShadow="md">
                  {activeItem.isDirectory ? <FiFolder /> : <FiFile />}
                  <Text ml={2} fontSize="sm">
                    {activeItem.name}
                  </Text>
                </Box>
              ) : null}
            </DragOverlay>
          </DndContext>
        </VStack>
      </Box>

      {/* Footer Actions */}
      <Box p={2} borderTop="1px" borderColor="gray.200">
        {isAddingFolder ? (
          <HStack spacing={2}>
            <Input
              size="sm"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={handleNewFolderKeyPress}
              autoFocus
            />
            <IconButton
              aria-label="Confirm"
              icon={<FiCheck />}
              size="sm"
              colorScheme="green"
              onClick={handleConfirmNewFolder}
              isDisabled={!newFolderName.trim()}
            />
            <IconButton
              aria-label="Cancel"
              icon={<FiX />}
              size="sm"
              variant="ghost"
              onClick={handleCancelNewFolder}
            />
          </HStack>
        ) : (
          <Button size="sm" width="100%" leftIcon={<FiFolder />} variant="ghost" onClick={handleNewFolder}>
            New Folder
          </Button>
        )}
      </Box>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalBody>
            <Text>
              {itemToDelete?.isDirectory
                ? `Are you sure you want to permanently delete the folder "${itemToDelete.name}" and all its contents?`
                : `Are you sure you want to permanently delete "${itemToDelete?.name}"?`
              }
            </Text>
            <Text fontSize="sm" color="gray.600" mt={2}>
              This action cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Sidebar;
