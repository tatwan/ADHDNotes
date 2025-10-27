import { Box, VStack, Divider } from '@chakra-ui/react';
import CalendarView from '@components/calendar/CalendarView';
import Timeline from '@components/timeline/Timeline';
import ThemeSelector from '@components/ThemeSelector';

const RightPanel = () => {
  return (
    <VStack height="100%" spacing={0} divider={<Divider />}>
      {/* Theme Selector */}
      <ThemeSelector />

      {/* Calendar Section */}
      <Box width="100%" p={4}>
        <CalendarView />
      </Box>

      {/* Timeline Section */}
      <Box flex="1" width="100%" overflow="auto">
        <Timeline />
      </Box>
    </VStack>
  );
};

export default RightPanel;
