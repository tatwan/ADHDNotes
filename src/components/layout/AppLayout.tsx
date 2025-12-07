import { Box, Flex } from '@chakra-ui/react';
import { useAppStore } from '@stores/appStore';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import MarkdownEditor from '../editor/MarkdownEditor';
import { useBookmarkStore } from '@stores/bookmarkStore';
import BookmarkReader from '../bookmarks/BookmarkReader';
import SnippetViewer from '../snippets/SnippetViewer';

const AppLayout = () => {
  const { sidebarExpanded, rightPanelExpanded } = useAppStore();
  const { viewMode } = useBookmarkStore();

  const sidebarWidth = sidebarExpanded ? '250px' : '0px';
  const rightPanelWidth = rightPanelExpanded ? '350px' : '0px';

  return (
    <Flex height="100vh" width="100vw" overflow="hidden">
      {/* Sidebar */}
      <Box
        width={sidebarWidth}
        minWidth={sidebarWidth}
        height="100vh"
        bg="slate.50"
        borderRight="1px"
        borderColor="slate.100"
        overflow="hidden"
        transition="width 0.2s"
      >
        {sidebarExpanded && <Sidebar />}
      </Box>

      {/* Main Content Area */}
      <Box flex="1" overflow="hidden" display="flex" flexDirection="column" position="relative">
        {viewMode === 'bookmarks' ? <BookmarkReader /> : viewMode === 'snippets' ? <SnippetViewer /> : <MarkdownEditor />}
      </Box>

      {/* Right Panel - Calendar and Timeline */}
      <Box
        width={rightPanelWidth}
        minWidth={rightPanelWidth}
        height="100vh"
        bg="slate.50"
        borderLeft="1px"
        borderColor="slate.100"
        overflow="hidden"
        transition="width 0.2s"
      >
        {rightPanelExpanded && <RightPanel />}
      </Box>
    </Flex>
  );
};

export default AppLayout;
