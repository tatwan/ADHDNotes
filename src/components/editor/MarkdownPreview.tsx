import { Box } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useEffect, useRef } from 'react';
import './markdown-preview.css';

interface MarkdownPreviewProps {
  content: string;
  fontSize?: number;
  onCheckboxChange?: (text: string, checked: boolean) => void;
}

const MarkdownPreview = ({ content, fontSize = 14, onCheckboxChange }: MarkdownPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Enable disabled checkboxes after render
  useEffect(() => {
    if (containerRef.current) {
      const checkboxes = containerRef.current.querySelectorAll('input[type="checkbox"][disabled]');
      checkboxes.forEach((checkbox) => {
        (checkbox as HTMLInputElement).disabled = false;
      });
    }
  });

  // Handle checkbox clicks using event delegation
  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
      const checkbox = target as HTMLInputElement;
      
      // Find the parent li element
      const li = target.closest('li');
      if (li) {
        // Extract text from the li content, excluding the input
        const liClone = li.cloneNode(true) as HTMLElement;
        const inputInClone = liClone.querySelector('input[type="checkbox"]');
        if (inputInClone) {
          inputInClone.remove();
        }
        const text = liClone.textContent?.trim() || '';
        if (text && onCheckboxChange) {
          onCheckboxChange(text, checkbox.checked);
        }
      }
    }
  };
  return (
    <Box
      ref={containerRef}
      className="markdown-preview"
      p={6}
      height="100%"
      overflow="auto"
      fontSize={`${fontSize}px`}
      onClick={handleContainerClick}
      sx={{
        '& h1': {
          fontSize: '2em',
          fontWeight: 'bold',
          marginTop: '0.67em',
          marginBottom: '0.67em',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0.3em'
        },
        '& h2': {
          fontSize: '1.5em',
          fontWeight: 'bold',
          marginTop: '0.83em',
          marginBottom: '0.83em',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0.3em'
        },
        '& h3': {
          fontSize: '1.17em',
          fontWeight: 'bold',
          marginTop: '1em',
          marginBottom: '1em'
        },
        '& p': {
          marginTop: '0',
          marginBottom: '1em',
          lineHeight: '1.6'
        },
        '& ul, & ol': {
          paddingLeft: '2em',
          marginBottom: '1em'
        },
        '& li': {
          marginBottom: '0.5em',
          lineHeight: '1.6'
        },
        '& code': {
          backgroundColor: '#f6f8fa',
          padding: '0.2em 0.4em',
          borderRadius: '3px',
          fontSize: '0.9em',
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace"
        },
        '& pre': {
          backgroundColor: '#f6f8fa',
          padding: '1em',
          borderRadius: '6px',
          overflow: 'auto',
          marginBottom: '1em'
        },
        '& pre code': {
          backgroundColor: 'transparent',
          padding: '0',
          fontSize: '0.9em'
        },
        '& blockquote': {
          borderLeft: '4px solid #dfe2e5',
          paddingLeft: '1em',
          color: '#6a737d',
          marginBottom: '1em',
          marginLeft: '0'
        },
        '& table': {
          borderCollapse: 'collapse',
          marginBottom: '1em',
          width: '100%'
        },
        '& th, & td': {
          border: '1px solid #dfe2e5',
          padding: '0.5em 1em'
        },
        '& th': {
          backgroundColor: '#f6f8fa',
          fontWeight: 'bold'
        },
        '& a': {
          color: '#2196F3',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline'
          }
        },
        '& hr': {
          border: 'none',
          borderTop: '1px solid #e2e8f0',
          marginTop: '2em',
          marginBottom: '2em'
        },
        '& input[type="checkbox"]': {
          marginRight: '0.5em',
          cursor: 'pointer',
          pointerEvents: 'auto !important'
        },
        '& input[type="checkbox"][disabled]': {
          pointerEvents: 'auto !important'
        },
        '& .task-list-item input[type="checkbox"]': {
          pointerEvents: 'auto !important'
        }
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{}}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownPreview;
