import { useState, useEffect } from 'react';
import { Box, Text, IconButton, HStack } from '@chakra-ui/react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Calendar from 'react-calendar';
import { useNoteStore } from '@stores/noteStore';
import { useAppStore } from '@stores/appStore';
import { getDatesWithContentIndicators, DateContentIndicators } from '@utils/noteUtils';
import { formatDateForFileName } from '@utils/dateUtils';
import 'react-calendar/dist/Calendar.css';
import './calendar.css';

const CalendarView = () => {
  const { currentDate, loadDailyNote, setCurrentDate } = useNoteStore();
  const { checkForMigration } = useAppStore();
  const [datesWithContent, setDatesWithContent] = useState<Map<string, DateContentIndicators>>(new Map());

  const handleDateChange = async (date: Date) => {
    setCurrentDate(date);
    await loadDailyNote(date);
    await checkForMigration();
  };

  const handleToday = async () => {
    const today = new Date();
    setCurrentDate(today);
    await loadDailyNote(today);
    await checkForMigration();
  };

  const handlePrevDay = async () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
    await loadDailyNote(prev);
    await checkForMigration();
  };

  const handleNextDay = async () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
    await loadDailyNote(next);
    await checkForMigration();
  };

  // Load dates with content when month changes
  useEffect(() => {
    const loadDatesWithContent = async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const contentIndicators = await getDatesWithContentIndicators(year, month);
      setDatesWithContent(contentIndicators);
    };

    loadDatesWithContent();
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  // Refresh dates when a note is saved
  useEffect(() => {
    const refreshDates = async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const contentIndicators = await getDatesWithContentIndicators(year, month);
      setDatesWithContent(contentIndicators);
    };

    // Small delay to ensure file is written
    const timer = setTimeout(refreshDates, 500);
    return () => clearTimeout(timer);
  }, [currentDate]);

  // Add indicator dots for dates with content
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateKey = formatDateForFileName(date);
      const indicators = datesWithContent.get(dateKey);

      if (indicators) {
        const { hasTasks, hasTimeBlocks } = indicators;

        return (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '2px',
              gap: '2px'
            }}
          >
            {hasTasks && (
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-calm-teal)'
                }}
              />
            )}
            {hasTimeBlocks && (
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-pastel-peach)'
                }}
              />
            )}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <Box>
      <Text fontSize="md" fontWeight="bold" mb={3}>
        Calendar
      </Text>

      {/* Navigation Controls */}
      <HStack spacing={2} mb={3} justify="space-between">
        <IconButton
          aria-label="Previous day"
          icon={<FiChevronLeft />}
          size="sm"
          onClick={handlePrevDay}
        />
        <Text fontSize="sm" fontWeight="medium" flex="1" textAlign="center">
          {currentDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </Text>
        <IconButton
          aria-label="Next day"
          icon={<FiChevronRight />}
          size="sm"
          onClick={handleNextDay}
        />
      </HStack>

      {/* Calendar */}
      <Box className="calendar-container">
        <Calendar
          onChange={(value) => handleDateChange(value as Date)}
          value={currentDate}
          locale="en-US"
          tileContent={tileContent}
        />
      </Box>

      {/* Today Button */}
      <Box mt={3}>
        <button
          onClick={handleToday}
            style={{
            width: '100%',
            padding: '8px',
            fontSize: '14px',
            fontWeight: '500',
              backgroundColor: 'var(--color-calm-teal)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Today
        </button>
      </Box>
    </Box>
  );
};

export default CalendarView;
