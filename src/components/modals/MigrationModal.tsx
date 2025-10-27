import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Text,
  VStack,
  HStack,
  Button,
  Box,
  Progress,
  Divider
} from '@chakra-ui/react';
import { useAppStore } from '@stores/appStore';
import { useNoteStore } from '@stores/noteStore';
import { FiArrowRight, FiX, FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import { parseDateFromFileName, formatDateForDisplay } from '@utils/dateUtils';

const MigrationModal = () => {
  const { migrationQueue, processMigrationDecision, processAllMigrationDecisions } = useAppStore();
  const { currentDate } = useNoteStore();

  const total = migrationQueue.length;
  const currentTask = migrationQueue[0];
  const hasMultipleTasks = total > 1;

  if (!currentTask) return null;

  const handleMoveToToday = async () => {
    await processMigrationDecision(currentTask.id, 'move');
  };

  const handleDismiss = async () => {
    await processMigrationDecision(currentTask.id, 'dismiss');
  };

  const handleMoveAll = async () => {
    await processAllMigrationDecisions('move');
  };

  const handleIgnoreAll = async () => {
    await processAllMigrationDecisions('dismiss');
  };

  const progressPercent = total > 0 ? ((total - migrationQueue.length) / total) * 100 : 0;
  const originalDate = parseDateFromFileName(currentTask.originalDate);
  const targetDate = currentDate;
  const targetDateFormatted = formatDateForDisplay(targetDate);

  return (
    <Modal
      isOpen={true}
      onClose={() => {}} // Cannot close
      closeOnOverlayClick={false}
      closeOnEsc={false}
      size="xl"
      isCentered
    >
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(10px)" />
      <ModalContent maxW="600px">
        <ModalHeader>
          <VStack align="stretch" spacing={2}>
            <Text fontSize="2xl" fontWeight="bold">
              Review Previous Tasks
            </Text>
            <Text fontSize="md" fontWeight="normal" color="gray.600">
              From {formatDateForDisplay(originalDate)}
            </Text>

            {/* Progress */}
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" color="gray.600">
                  Task {total - migrationQueue.length + 1} of {total}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {migrationQueue.length} remaining
                </Text>
              </HStack>
              <Progress
                value={progressPercent}
                colorScheme="brand"
                size="sm"
                borderRadius="full"
              />
            </Box>
          </VStack>
        </ModalHeader>

        <ModalBody py={8}>
          <VStack spacing={6} align="stretch">
            {/* Task Content */}
            <Box
              p={6}
              bg="gray.50"
              borderRadius="lg"
              borderLeft="4px solid"
              borderColor="brand.500"
            >
              <HStack spacing={3} align="start">
                <Box
                  mt={1}
                  width="16px"
                  height="16px"
                  border="2px solid"
                  borderColor="gray.400"
                  borderRadius="sm"
                  flexShrink={0}
                />
                <Text fontSize="lg" flex="1">
                  {currentTask.content}
                </Text>
              </HStack>
            </Box>

            {/* Info Box */}
            <Box p={4} bg="blue.50" borderRadius="md" borderLeft="3px solid" borderColor="blue.400">
              <Text fontSize="sm" color="blue.900">
                <strong>Note:</strong> You must decide on each incomplete task. This intentional
                friction helps you prioritize what truly matters.
              </Text>
            </Box>

            {/* Action Buttons */}
            <VStack spacing={3}>
              <Button
                leftIcon={<FiArrowRight />}
                colorScheme="brand"
                size="lg"
                width="100%"
                onClick={handleMoveToToday}
              >
                Move to {targetDateFormatted}
              </Button>

              <Button
                leftIcon={<FiX />}
                variant="outline"
                colorScheme="gray"
                size="lg"
                width="100%"
                onClick={handleDismiss}
              >
                Not Important
              </Button>

              {/* Bulk Actions - only show when multiple tasks remain */}
              {hasMultipleTasks && (
                <>
                  <Divider my={4} />
                  <Text fontSize="sm" color="gray.600" textAlign="center" mb={2}>
                    Or handle all remaining tasks:
                  </Text>
                  <HStack spacing={3} width="100%">
                    <Button
                      leftIcon={<FiCheckCircle />}
                      colorScheme="green"
                      variant="outline"
                      size="md"
                      flex="1"
                      onClick={handleMoveAll}
                    >
                      Move All ({total})
                    </Button>
                    <Button
                      leftIcon={<FiTrash2 />}
                      colorScheme="red"
                      variant="outline"
                      size="md"
                      flex="1"
                      onClick={handleIgnoreAll}
                    >
                      Ignore All ({total})
                    </Button>
                  </HStack>
                </>
              )}
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Text fontSize="xs" color="gray.500" textAlign="center" width="100%">
            Cannot skip or dismiss this review. Each task requires a decision.
          </Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MigrationModal;
