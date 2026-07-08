'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { TreeNode } from '@/lib/json-formatter';

interface JsonTreeNodeProps {
  node: TreeNode;
  depth: number;
  isRoot?: boolean;
}

// WCAG-safe text tokens (`-ink`); raw `--accent-*` fills fail contrast on white.
// Keys use near-black bold so all roles stay mutually distinguishable.
const typeColors: Record<string, string> = {
  string: 'text-accent-sky-ink',
  number: 'text-accent-sun-ink',
  boolean: 'text-accent-rose-ink',
  null: 'text-accent-mint-ink',
  key: 'text-text font-semibold',
};

function formatValue(value: any, type: string): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (type === 'string') {
    return `"${value}"`;
  }
  if (type === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (type === 'number') {
    return String(value);
  }
  return String(value);
}

export function JsonTreeNode({
  node,
  depth,
  isRoot = false,
}: JsonTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isCollapsible = node.children && node.children.length > 0;
  const paddingLeft = `${depth * 1.5}rem`;

  return (
    <div className="space-y-0.5">
      {/* Node Header */}
      {!isRoot && (
        <div
          style={{ paddingLeft }}
          className="flex items-center gap-2 font-mono text-sm"
        >
          {/* Expand/Collapse Button */}
          {isCollapsible && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={`
                flex-shrink-0 w-6 h-6 flex items-center justify-center
                hover:bg-surface-muted rounded
                motion-safe:transition-transform
                ${expanded ? 'rotate-90' : 'rotate-0'}
              `}
              aria-expanded={expanded}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setExpanded(!expanded);
                }
              }}
            >
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            </button>
          )}

          {/* Key (if object property) */}
          {node.key && (
            <>
              <span className={typeColors.key}>{node.key}:</span>
              <span className="text-text-secondary">{' '}</span>
            </>
          )}

          {/* Value */}
          {node.type === 'object' || node.type === 'array' ? (
            <>
              <span className="text-text">
                {node.type === 'object' ? '{' : '['}
              </span>
              <span className="text-text-secondary text-xs">
                {node.value}
              </span>
              {!isCollapsible && (
                <span className="text-text">
                  {node.type === 'object' ? '}' : ']'}
                </span>
              )}
            </>
          ) : (
            <span className={typeColors[node.type] || 'text-text'}>
              {formatValue(node.value, node.type)}
            </span>
          )}
        </div>
      )}

      {/* Children */}
      {isCollapsible && expanded && node.children && (
        <div>
          {node.children.map((child, idx) => (
            <JsonTreeNode key={idx} node={child} depth={depth + 1} />
          ))}
          {/* Closing Bracket */}
          <div
            style={{ paddingLeft }}
            className="font-mono text-sm text-text"
          >
            {node.type === 'object' ? '}' : ']'}
          </div>
        </div>
      )}

      {/* Closing Bracket (collapsed) */}
      {isCollapsible &&
        !expanded &&
        (isRoot || node.type === 'object' || node.type === 'array') && (
          <div
            style={{ paddingLeft }}
            className="font-mono text-sm text-text-secondary"
          >
            {node.type === 'object' ? '} ...' : '] ...'}
          </div>
        )}
    </div>
  );
}
