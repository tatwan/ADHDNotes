import { Box } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useEffect, useRef, useState } from 'react';
import './markdown-preview.css';

interface MarkdownPreviewProps {
  content: string;
  fontSize?: number;
  onCheckboxChange?: (text: string, checked: boolean) => void;
  currentFilePath?: string;
}

const MarkdownPreview = ({ content, fontSize = 14, onCheckboxChange, currentFilePath }: MarkdownPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // React-friendly Image component: resolves local images via IPC and avoids direct DOM mutations
  const ImageComponent = ({ src, alt, title, ...props }: any) => {
    const [dataSrc, setDataSrc] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let cancelled = false;
      const load = async () => {
        if (!src) {
          setLoading(false);
          return;
        }

        // If it's already an absolute URL or data URL, use it directly
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
          setDataSrc(src);
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          let fullPath: string;

          if (src.startsWith('/')) {
            // Absolute path within notes directory
            const notesDir = await window.electronAPI.getNotesDir();
            fullPath = `${notesDir}${src}`;
          } else {
            // Relative path - resolve relative to current note's directory if available
            if (currentFilePath) {
              const noteDir = await window.electronAPI.path.dirname(currentFilePath);
              fullPath = await window.electronAPI.path.resolve(noteDir, src);
            } else {
              // Fallback to notes directory
              const notesDir = await window.electronAPI.getNotesDir();
              fullPath = `${notesDir}/${src}`;
            }
          }

          const res = await window.electronAPI.readImageFile(fullPath);

          if (!cancelled) {
            if (res.success && res.dataUrl) {
              setDataSrc(res.dataUrl);
            } else {
              setFailed(true);
            }
            setLoading(false);
          }
        } catch (err) {
          console.error('Failed to load image:', src, err);
          if (!cancelled) {
            setFailed(true);
            setLoading(false);
          }
        }
      };

      load();
      return () => {
        cancelled = true;
      };
    }, [src, currentFilePath]);

    // Parse inline zoom style (e.g. style="zoom:23%") from props.style and convert to transform
    const style: any = {};
    if (props?.style && typeof props.style === 'string' && props.style.includes('zoom:')) {
      const zoomMatch = (props.style as string).match(/zoom:\s*(\d+(?:\.\d+)?)%?/);
      if (zoomMatch) {
        const zoomValue = parseFloat(zoomMatch[1]) / 100;
        style.transform = `scale(${zoomValue})`;
        style.transformOrigin = 'top left';
      }
    }

    if (failed) {
      return (
        <div
          style={{
            padding: '1em',
            background: 'var(--color-mist-white)',
            border: '1px solid var(--color-cool-grey-2)',
            borderRadius: 4,
            color: 'var(--color-cool-grey-2)',
            fontSize: '0.9em',
            margin: '0.5em 0'
          }}
          title={title}
        >
          📷 Image not found: {alt || src}
        </div>
      );
    }

    if (loading) {
      return (
        <div
          style={{
            padding: '1em',
            background: 'var(--color-mist-white)',
            border: '1px solid var(--color-cool-grey-2)',
            borderRadius: 4,
            color: 'var(--color-cool-grey-2)',
            fontSize: '0.9em',
            margin: '0.5em 0'
          }}
          title={title}
        >
          📷 Loading image...
        </div>
      );
    }

    return (
      <img
        src={dataSrc || ''}
        alt={alt || ''}
        title={title}
        style={{ maxWidth: '100%', height: 'auto', borderRadius: 4, margin: '0.5em 0', display: 'block', ...style }}
        onError={() => setFailed(true)}
        {...props}
      />
    );
  };

  // Preprocess content to convert HTML img tags to markdown img syntax and handle highlight syntax
  const preprocessContent = (content: string) => {
    // Convert HTML img tags to markdown img syntax
    let processed = content.replace(/<img\s+src="([^"]*)"(?:\s+alt="([^"]*)")?(?:\s+title="([^"]*)")?\s*\/?>/gi, (_, src, alt, title) => {
      const altText = alt || '';
      const titleText = title ? ` "${title}"` : '';
      return `![${altText}](${src}${titleText})`;
    });

    // Convert ==highlight== syntax to <mark> tags
    processed = processed.replace(/==([^=]+)==/g, '<mark>$1</mark>');

    return processed;
  };

  const processedContent = preprocessContent(content);

  // Enable disabled checkboxes after render
  useEffect(() => {
    if (containerRef.current) {
      const checkboxes = containerRef.current.querySelectorAll('input[type="checkbox"][disabled]');
      checkboxes.forEach((checkbox) => {
        (checkbox as HTMLInputElement).disabled = false;
      });
    }
  });

  // Image handling is done inside the ImageComponent (no direct DOM mutations here)

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

  // Custom anchor component to open external links in default browser
  const LinkComponent = ({ href, children, ...props }: any) => {
    const handleClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        try {
          await window.electronAPI.openExternal(href);
        } catch (error) {
          console.error('Failed to open external link:', error);
        }
      }
    };

    return (
      <a
        href={href}
        onClick={handleClick}
        style={{ color: 'var(--color-link)', textDecoration: 'underline', cursor: 'pointer' }}
        {...props}
      >
        {children}
      </a>
    );
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
        // Basic styles that themes can override
        '& input[type="checkbox"]': {
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
        key={content}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a: LinkComponent,
          img: ImageComponent,
          code: ({ node, inline, className, children, ...props }: any) => {
            // For code blocks (not inline code), add md-fences class for theme styling
            if (!inline) {
              return (
                <code className={`md-fences ${className || ''}`} {...props}>
                  {children}
                </code>
              );
            }
            // For inline code, render normally
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          blockquote: ({ node, children, ...props }: any) => {
            // React-Markdown wraps blockquote content in <p> tags, which breaks
            // theme CSS rules like "blockquote>h3:first-child"
            // If the blockquote contains only a single paragraph with a single header,
            // unwrap it to match Typora's structure

            const childArray = Array.isArray(children) ? children : [children];

            // Filter out text nodes that are just whitespace
            const contentNodes = childArray.filter((child: any) => {
              if (typeof child === 'string') {
                return child.trim().length > 0;
              }
              return child != null;
            });

            // Check if there's exactly one <p> element
            if (contentNodes.length === 1 && contentNodes[0]?.type === 'p') {
              const pElement = contentNodes[0];
              const pChildren = Array.isArray(pElement.props?.children)
                ? pElement.props.children
                : [pElement.props?.children];

              // Filter out whitespace from p's children
              const pContentNodes = pChildren.filter((child: any) => {
                if (typeof child === 'string') {
                  return child.trim().length > 0;
                }
                return child != null;
              });

              // If the <p> contains only one header element, unwrap it
              if (pContentNodes.length === 1 && pContentNodes[0]?.type?.match(/^h[1-6]$/)) {
                return (
                  <blockquote {...props}>
                    {pContentNodes[0]}
                  </blockquote>
                );
              }
            }

            // Otherwise, render normally
            return <blockquote {...props}>{children}</blockquote>;
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownPreview;
