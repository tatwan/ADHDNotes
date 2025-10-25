import { Box, Flex } from '@chakra-ui/react';
import { useAppStore } from '@stores/appStore';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import MarkdownEditor from '@components/editor/MarkdownEditor';

const AppLayout = () => {
  const { sidebarExpanded, rightPanelExpanded } = useAppStore();

  const sidebarWidth = sidebarExpanded ? '250px' : '0px';
  const rightPanelWidth = rightPanelExpanded ? '350px' : '0px';

  return (
    <Flex height="100vh" width="100vw" overflow="hidden">
      {/* Sidebar */}
      <Box
        width={sidebarWidth}
        minWidth={sidebarWidth}
        height="100vh"
        bg="gray.100"
        borderRight="1px"
        borderColor="gray.200"
        overflow="hidden"
        transition="width 0.2s"
      >
        {sidebarExpanded && <Sidebar />}
      </Box>

      {/* Main Editor Area */}
      <Box flex="1" height="100vh" overflow="hidden" bg="white">
        <MarkdownEditor />
      </Box>

      {/* Right Panel - Calendar and Timeline */}
      <Box
        width={rightPanelWidth}
        minWidth={rightPanelWidth}
        height="100vh"
        bg="gray.100"
        borderLeft="1px"
        borderColor="gray.200"
        overflow="hidden"
        transition="width 0.2s"
      >
        {rightPanelExpanded && <RightPanel />}
      </Box>
    </Flex>
  );
};

export default AppLayout;
