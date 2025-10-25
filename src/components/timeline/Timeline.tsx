import { Box, Text, VStack } from '@chakra-ui/react';
import { useAppStore } from '@stores/appStore';
import { useNoteStore } from '@stores/noteStore';
import { useTaskStore } from '@stores/taskStore';
import { generateTimeSlots } from '@utils/dateUtils';
import TimeSlot from './TimeSlot';

const Timeline = () => {
  const { settings } = useAppStore();
  const { currentNote } = useNoteStore();
  const { getScheduledTasks } = useTaskStore();

  const startHour = settings.timelineStartHour || 8;
  const endHour = settings.timelineEndHour || 22;

  const timeSlots = generateTimeSlots(startHour, endHour);
  const scheduledTasks = getScheduledTasks();

  // Get time blocks from current note
  const timeBlocks = currentNote && 'timeBlocks' in currentNote ? currentNote.timeBlocks : [];

  return (
    <Box p={4}>
      <Text fontSize="md" fontWeight="bold" mb={4}>
        Timeline
      </Text>

      <VStack spacing={0} align="stretch">
        {timeSlots.map((slot) => {
          const slotKey = slot.label;
          const tasks = scheduledTasks.get(slotKey) || [];
          const blocks = timeBlocks.filter(
            (block) => block.startTime === slotKey
          );

          return (
            <TimeSlot
              key={slotKey}
              hour={slot.hour}
              minute={slot.minute}
              label={slot.label}
              tasks={tasks}
              timeBlocks={blocks}
            />
          );
        })}
      </VStack>
    </Box>
  );
};

export default Timeline;
