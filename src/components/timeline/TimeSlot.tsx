import { Box, Text, VStack, HStack, Badge } from '@chakra-ui/react';
import { useDroppable } from '@dnd-kit/core';
import { Task, TimeBlock } from '@/types';
import { FiCheckCircle, FiCircle } from 'react-icons/fi';

interface TimeSlotProps {
  hour: number;
  minute: number;
  label: string;
  tasks: Task[];
  timeBlocks: TimeBlock[];
}

const TimeSlot = ({ hour, minute, label, tasks, timeBlocks }: TimeSlotProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `timeslot-${label}`,
    data: { hour, minute }
  });

  const hasItems = tasks.length > 0 || timeBlocks.length > 0;

  return (
    <Box
      ref={setNodeRef}
      borderTop="1px"
      borderColor="slate.100"
      py={2}
      minHeight="60px"
      bg={isOver ? 'brand.50' : hasItems ? 'slate.50' : 'transparent'}
      transition="background 0.2s"
      _hover={{ bg: hasItems ? 'slate.100' : 'slate.50' }}
    >
      <HStack align="flex-start" spacing={3}>
        {/* Time Label */}
        <Text
          fontSize="xs"
          fontWeight="medium"
          color="gray.600"
          minWidth="50px"
          pt={1}
        >
          {label}
        </Text>

        {/* Items */}
        <VStack align="stretch" flex="1" spacing={1}>
          {/* Time Blocks */}
          {timeBlocks.map((block) => (
            <HStack
              key={block.id}
              p={2}
              bg="peach.100"
              borderLeft="3px solid"
              borderColor="peach.500"
              borderRadius="md"
              spacing={2}
            >
              {block.completed ? (
                <FiCheckCircle style={{ color: 'var(--color-pastel-peach)' }} />
              ) : (
                <FiCircle style={{ color: 'var(--color-pastel-peach)' }} />
              )}
              <Text fontSize="sm" flex="1">
                {block.content}
              </Text>
              <Badge colorScheme="yellow" fontSize="xs">
                {block.duration}m
              </Badge>
            </HStack>
          ))}

          {/* Scheduled Tasks */}
          {tasks.map((task) => (
            <HStack
              key={task.id}
              p={2}
              bg="brand.50"
              borderLeft="3px solid"
              borderColor="brand.500"
              borderRadius="md"
              spacing={2}
            >
              {task.completed ? (
                <FiCheckCircle style={{ color: 'var(--color-muted-teal)' }} />
              ) : (
                <FiCircle style={{ color: 'var(--color-muted-teal)' }} />
              )}
              <Text
                fontSize="sm"
                flex="1"
                textDecoration={task.completed ? 'line-through' : 'none'}
                color={task.completed ? 'slate.500' : 'inherit'}
              >
                {task.content}
              </Text>
            </HStack>
          ))}

          {/* Empty State */}
          {!hasItems && isOver && (
            <Text fontSize="xs" color="gray.400" py={1}>
              Drop task here
            </Text>
          )}
        </VStack>
      </HStack>
    </Box>
  );
};

export default TimeSlot;
