import { useEffect, useRef, useState } from 'react';
import { Box, Flex, Text, Button, HStack, IconButton, Tooltip, Badge } from '@chakra-ui/react';
import { EditorView, basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { useNoteStore } from '@stores/noteStore';
import { useAppStore } from '@stores/appStore';
import { formatDateForDisplay } from '@utils/dateUtils';
import { FiSave, FiEye, FiEdit3, FiSidebar } from 'react-icons/fi';
import MarkdownPreview from './MarkdownPreview';

const MarkdownEditor = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const { currentNote, updateNoteContent, saveCurrentNote } = useNoteStore();
  const { settings, toggleSidebar } = useAppStore();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize CodeMirror editor
  useEffect(() => {
    if (!editorRef.current || editorViewRef.current) return;

    const startState = EditorState.create({
      doc: currentNote?.content || '',
      extensions: [
        basicSetup,
        markdown(),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString();
            updateNoteContent(newContent);
            setHasUnsavedChanges(true);

            // Auto-save with debounce
            if (autoSaveTimerRef.current) {
              clearTimeout(autoSaveTimerRef.current);
            }

            autoSaveTimerRef.current = setTimeout(() => {
              handleSave();
            }, settings.autoSaveInterval || 3000);
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: `${settings.editorFontSize || 14}px`
          },
          '.cm-scroller': {
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            overflow: 'auto'
          }
        })
      ]
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
  }, []);

  // Update editor content when note changes
  useEffect(() => {
    if (editorViewRef.current && currentNote) {
      const view = editorViewRef.current;
      const currentContent = view.state.doc.toString();

      if (currentContent !== currentNote.content) {
        view.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: currentNote.content
          }
        });
        setHasUnsavedChanges(false);
      }
    }
  }, [currentNote?.id]);

  const handleSave = async () => {
    await saveCurrentNote();
    setHasUnsavedChanges(false);
  };

  const handleManualSave = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    handleSave();
  };

  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  // Keyboard shortcut for preview toggle: Cmd+/ or Ctrl+/
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+/ on macOS or Ctrl+/ on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        togglePreviewMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPreviewMode]);

  // Get note title
  const getNoteTitle = () => {
    if (!currentNote) return 'No note selected';

    if ('date' in currentNote) {
      return formatDateForDisplay(currentNote.date);
    }

    return currentNote.title;
  };

  // Get task count
  const getTaskStats = () => {
    if (!currentNote) return { total: 0, completed: 0 };

    const total = currentNote.tasks.length;
    const completed = currentNote.tasks.filter(t => t.completed).length;

    return { total, completed };
  };

  const taskStats = getTaskStats();

  return (
    <Box height="100%" display="flex" flexDirection="column">
      {/* Editor Header */}
      <Flex
        px={6}
        py={3}
        borderBottom="1px"
        borderColor="gray.200"
        justify="space-between"
        align="center"
        bg="white"
      >
        <Box>
          <Text fontSize="xl" fontWeight="bold">
            {getNoteTitle()}
          </Text>
          <HStack spacing={4} mt={1}>
            <Text fontSize="sm" color="gray.600">
              {taskStats.total} tasks
            </Text>
            <Text fontSize="sm" color="green.600">
              {taskStats.completed} completed
            </Text>
            {hasUnsavedChanges && (
              <Text fontSize="sm" color="orange.500">
                Unsaved changes
              </Text>
            )}
            {isPreviewMode && (
              <Badge colorScheme="purple" fontSize="xs">
                Preview Mode
              </Badge>
            )}
          </HStack>
        </Box>

        <HStack spacing={2}>
          <Tooltip label="Toggle sidebar" fontSize="xs">
            <IconButton
              aria-label="Toggle sidebar"
              icon={<FiSidebar />}
              size="sm"
              variant="outline"
              onClick={toggleSidebar}
            />
          </Tooltip>
          <Tooltip label={isPreviewMode ? 'Edit Mode (Cmd+/)' : 'Preview Mode (Cmd+/)'} fontSize="xs">
            <IconButton
              aria-label="Toggle preview"
              icon={isPreviewMode ? <FiEdit3 /> : <FiEye />}
              size="sm"
              variant={isPreviewMode ? 'solid' : 'outline'}
              colorScheme={isPreviewMode ? 'purple' : 'gray'}
              onClick={togglePreviewMode}
            />
          </Tooltip>
          <Button
            leftIcon={<FiSave />}
            size="sm"
            colorScheme="brand"
            onClick={handleManualSave}
            isDisabled={!hasUnsavedChanges}
          >
            Save
          </Button>
        </HStack>
      </Flex>

      {/* Editor/Preview Area */}
      <Box position="relative" flex="1" overflow="hidden">
        <Box
          ref={editorRef}
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          display={isPreviewMode ? 'none' : 'block'}
        />
        {isPreviewMode && (
          <MarkdownPreview
            content={currentNote?.content || ''}
            fontSize={settings.editorFontSize || 14}
          />
        )}
      </Box>
    </Box>
  );
};

export default MarkdownEditor;
