'use client';

import { useState } from 'react';
import { JsonView, allExpanded, darkStyles, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface JsonViewerProps {
  data: string | object;
  title?: string;
  maxHeight?: string;
  defaultExpanded?: boolean;
}

export function JsonViewer({ data, title, maxHeight = '24rem', defaultExpanded = false }: JsonViewerProps) {
  const [viewMode, setViewMode] = useState<'pretty' | 'raw'>('pretty');
  const [copied, setCopied] = useState(false);
  
  // Parse the data if it's a string
  let parsedData: any;
  let rawJson: string;
  
  try {
    if (typeof data === 'string') {
      parsedData = JSON.parse(data);
      rawJson = data;
    } else {
      parsedData = data;
      rawJson = JSON.stringify(data, null, 2);
    }
  } catch (e) {
    // If parsing fails, treat as raw text
    parsedData = null;
    rawJson = typeof data === 'string' ? data : JSON.stringify(data);
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const isDark = typeof window !== 'undefined' && 
    document.documentElement.classList.contains('dark');

  return (
    <div className="space-y-2">
      {/* Header with controls */}
      <div className="flex items-center justify-between gap-2">
        {title && (
          <div className="font-semibold text-sm text-muted-foreground">{title}</div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <Badge 
            variant="outline" 
            className="text-xs cursor-pointer hover:bg-secondary transition-colors"
            onClick={() => setViewMode(viewMode === 'pretty' ? 'raw' : 'pretty')}
          >
            {viewMode === 'pretty' ? '📋 Raw' : '✨ Pretty'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs"
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </Button>
        </div>
      </div>

      {/* JSON Display */}
      <div 
        className="rounded-lg border bg-muted/30 overflow-auto"
        style={{ maxHeight }}
      >
        {viewMode === 'pretty' && parsedData !== null ? (
          <div className="p-3">
            <JsonView
              data={parsedData}
              shouldExpandNode={defaultExpanded ? allExpanded : undefined}
              style={isDark ? darkStyles : defaultStyles}
            />
          </div>
        ) : (
          <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-words">
            {rawJson}
          </pre>
        )}
      </div>
    </div>
  );
}
