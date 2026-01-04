/**
 * Safely split HTML content into chunks that respect tag boundaries
 */
export function splitHtmlSafely(html: string, maxLength: number = 4000): string[] {
  if (html.length <= maxLength) {
    return [html];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  let openTags: string[] = [];
  
  // Parse HTML and split intelligently
  let i = 0;
  
  while (i < html.length) {
    const char = html[i];
    
    // Check if we're at a tag
    if (char === '<') {
      const tagEnd = html.indexOf('>', i);
      if (tagEnd === -1) {
        // Malformed HTML, just add the rest
        currentChunk += html.slice(i);
        break;
      }
      
      const tag = html.slice(i, tagEnd + 1);
      const tagMatch = tag.match(/<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/);
      
      if (tagMatch) {
        const isClosing = tag.startsWith('</');
        const tagName = tagMatch[1];
        
        // Check if adding this tag would exceed limit
        if (currentChunk.length + tag.length > maxLength && currentChunk.length > 0) {
          // Close all open tags before splitting
          const closingTags = openTags.map(t => `</${t}>`).reverse().join('');
          chunks.push(currentChunk + closingTags);
          
          // Start new chunk with opening tags
          currentChunk = openTags.map(t => `<${t}>`).join('');
        }
        
        currentChunk += tag;
        
        // Track open/close tags
        if (isClosing) {
          const lastIndex = openTags.lastIndexOf(tagName);
          if (lastIndex !== -1) {
            openTags.splice(lastIndex, 1);
          }
        } else if (!tag.endsWith('/>')) {
          // Self-closing tags don't need tracking
          openTags.push(tagName);
        }
      } else {
        currentChunk += tag;
      }
      
      i = tagEnd + 1;
    } else {
      // Regular character
      if (currentChunk.length >= maxLength && currentChunk.length > 0) {
        // Find a good break point (space, newline)
        let breakPoint = currentChunk.lastIndexOf('\n', maxLength);
        if (breakPoint === -1) {
          breakPoint = currentChunk.lastIndexOf(' ', maxLength);
        }
        if (breakPoint === -1 || breakPoint < maxLength * 0.8) {
          breakPoint = maxLength;
        }
        
        // Close all open tags
        const closingTags = openTags.map(t => `</${t}>`).reverse().join('');
        chunks.push(currentChunk.slice(0, breakPoint) + closingTags);
        
        // Start new chunk
        const remainingText = currentChunk.slice(breakPoint);
        currentChunk = openTags.map(t => `<${t}>`).join('') + remainingText;
      }
      
      currentChunk += char;
      i++;
    }
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    // Close any remaining open tags
    const closingTags = openTags.map(t => `</${t}>`).reverse().join('');
    chunks.push(currentChunk + closingTags);
  }
  
  return chunks;
}

/**
 * Truncate HTML content safely, ensuring all tags are properly closed
 */
export function truncateHtmlSafely(html: string, maxLength: number = 4000): string {
  if (html.length <= maxLength) {
    return html;
  }
  
  let truncated = '';
  let openTags: string[] = [];
  let i = 0;
  
  while (i < html.length && truncated.length < maxLength) {
    const char = html[i];
    
    if (char === '<') {
      const tagEnd = html.indexOf('>', i);
      if (tagEnd === -1) break;
      
      const tag = html.slice(i, tagEnd + 1);
      
      // Check if adding this tag would exceed limit
      if (truncated.length + tag.length > maxLength) {
        break;
      }
      
      truncated += tag;
      
      const tagMatch = tag.match(/<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/);
      if (tagMatch) {
        const isClosing = tag.startsWith('</');
        const tagName = tagMatch[1];
        
        if (isClosing) {
          const lastIndex = openTags.lastIndexOf(tagName);
          if (lastIndex !== -1) {
            openTags.splice(lastIndex, 1);
          }
        } else if (!tag.endsWith('/>')) {
          openTags.push(tagName);
        }
      }
      
      i = tagEnd + 1;
    } else {
      if (truncated.length >= maxLength) break;
      truncated += char;
      i++;
    }
  }
  
  // Close all open tags
  const closingTags = openTags.map(t => `</${t}>`).reverse().join('');
  
  // Add ellipsis if truncated
  if (i < html.length) {
    truncated += '...' + closingTags;
  } else {
    truncated += closingTags;
  }
  
  return truncated;
}
