import { Box, VStack, Text, Button, IconButton, Flex, Input, HStack, Menu, MenuList, MenuItem } from '@chakra-ui/react';
import { FiPlus, FiFolder, FiFile, FiCheck, FiX, FiTrash2, FiEdit, FiCopy, FiFileText, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { useAppStore } from '@stores/appStore';
import { useNoteStore } from '@stores/noteStore';
import { FileTreeItem } from '@/types';
import { join, dirname } from 'path-browserify';
import { getProjectsDir, deleteFile, renameFile, copyFile } from '@utils/fileSystem';
import { useState } from 'react';

const Sidebar = () => {
  const { fileTree, loadFileTree } = useAppStore();
  const { loadProjectNote, createProjectNote } = useNoteStore();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [contextMenuItem, setContextMenuItem] = useState<FileTreeItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleFileClick = async (item: FileTreeItem) => {
    if (!item.isDirectory) {
      await loadProjectNote(item.path);
    }
  };

  const handleNewNote = () => {
    setIsAddingNote(true);
    setNewNoteTitle('');
  };

  const handleCancelNewNote = () => {
    setIsAddingNote(false);
    setNewNoteTitle('');
  };

  const handleConfirmNewNote = async () => {
    if (!newNoteTitle.trim()) return;

    const title = newNoteTitle.trim();
    const projectsDir = await getProjectsDir();
    const filePath = join(projectsDir, `${title}.md`);

    await createProjectNote(title, filePath);
    await loadFileTree();

    setIsAddingNote(false);
    setNewNoteTitle('');
  };

  const handleNewNoteKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmNewNote();
    } else if (e.key === 'Escape') {
      handleCancelNewNote();
    }
  };

  const handleDeleteNote = async (item: FileTreeItem) => {
    if (!item.isDirectory && window.confirm(`Are you sure you want to permanently delete "${item.name}"?`)) {
      await deleteFile(item.path);
      await loadFileTree();
    }
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
      <Box key={item.id} pl={level * 4}>
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
              onClick={() => handleFileClick(item)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenuItem(item);
              }}
            >
              {item.isDirectory ? <FiFolder /> : <FiFile />}
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
              <MenuItem icon={<FiFileText />} onClick={handleNewNote}>
                New File
              </MenuItem>
              <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => handleDeleteNote(item)}>
                Delete
              </MenuItem>
            </MenuList>
          </Menu>
        )}
        {item.children && item.children.length > 0 && (
          <Box>{renderFileTree(item.children, level + 1)}</Box>
        )}
      </Box>
    ));
  };

  return (
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
              onClick={handleNewNote}
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
          {fileTree.length > 0 ? (
            renderFileTree(filterFileTree(fileTree, searchQuery))
          ) : (
            <Text fontSize="sm" color="gray.500" px={2} py={4} textAlign="center">
              No project notes yet
            </Text>
          )}
        </VStack>
      </Box>

      {/* Footer Actions */}
      <Box p={2} borderTop="1px" borderColor="gray.200">
        <Button size="sm" width="100%" leftIcon={<FiFolder />} variant="ghost">
          New Folder
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;
