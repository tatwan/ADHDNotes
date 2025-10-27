import React from 'react';
import { Select, Box, Text } from '@chakra-ui/react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme, themes } = useTheme();

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedThemeName = event.target.value;
    const selectedTheme = themes.find(theme => theme.name === selectedThemeName);
    if (selectedTheme) {
      setTheme(selectedTheme);
    }
  };

  return (
    <Box p={4}>
      <Text mb={2} fontWeight="bold">Theme</Text>
      <Select value={currentTheme.name} onChange={handleThemeChange}>
        {themes.map((theme) => (
          <option key={theme.name} value={theme.name}>
            {theme.name}
          </option>
        ))}
      </Select>
    </Box>
  );
};

export default ThemeSelector;