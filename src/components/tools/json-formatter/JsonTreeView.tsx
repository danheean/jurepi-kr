'use client';

import { TreeNode, jsonToTreeNodes } from '@/lib/json-formatter';
import { JsonTreeNode } from './JsonTreeNode';

interface JsonTreeViewProps {
  json: any;
  className?: string;
}

export function JsonTreeView({ json, className = '' }: JsonTreeViewProps) {
  try {
    const rootNode = jsonToTreeNodes(json);

    return (
      <div
        className={`
          p-4 bg-surface rounded-lg border border-surface-muted
          font-mono text-sm overflow-x-auto
          ${className}
        `}
      >
        <JsonTreeNode node={rootNode} depth={0} isRoot={true} />
      </div>
    );
  } catch {
    return (
      <div className="p-4 bg-danger/10 text-danger-ink rounded-lg">
        Error rendering tree view
      </div>
    );
  }
}
