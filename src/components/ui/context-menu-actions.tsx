import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';
import { Eye, Edit, Trash2, Copy, Download, Share2, Star, Archive } from 'lucide-react';

interface ContextMenuAction {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  shortcut?: string;
  destructive?: boolean;
  separator?: boolean;
}

interface ContextMenuActionsProps {
  children: React.ReactNode;
  actions: ContextMenuAction[];
}

export function ContextMenuActions({ children, actions }: ContextMenuActionsProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {actions.map((action, index) => (
          <React.Fragment key={index}>
            {action.separator && <ContextMenuSeparator />}
            <ContextMenuItem
              onClick={action.onClick}
              className={action.destructive ? 'text-destructive focus:text-destructive' : ''}
            >
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              <span>{action.label}</span>
              {action.shortcut && (
                <ContextMenuShortcut>{action.shortcut}</ContextMenuShortcut>
              )}
            </ContextMenuItem>
          </React.Fragment>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}

// Preset action builders
export const quickActions = {
  view: (onClick: () => void): ContextMenuAction => ({
    label: 'View',
    icon: Eye,
    onClick,
    shortcut: '⌘V',
  }),
  edit: (onClick: () => void): ContextMenuAction => ({
    label: 'Edit',
    icon: Edit,
    onClick,
    shortcut: '⌘E',
  }),
  duplicate: (onClick: () => void): ContextMenuAction => ({
    label: 'Duplicate',
    icon: Copy,
    onClick,
    shortcut: '⌘D',
  }),
  download: (onClick: () => void): ContextMenuAction => ({
    label: 'Download',
    icon: Download,
    onClick,
  }),
  share: (onClick: () => void): ContextMenuAction => ({
    label: 'Share',
    icon: Share2,
    onClick,
  }),
  favorite: (onClick: () => void): ContextMenuAction => ({
    label: 'Add to Favorites',
    icon: Star,
    onClick,
  }),
  archive: (onClick: () => void): ContextMenuAction => ({
    label: 'Archive',
    icon: Archive,
    onClick,
    separator: true,
  }),
  delete: (onClick: () => void): ContextMenuAction => ({
    label: 'Delete',
    icon: Trash2,
    onClick,
    destructive: true,
    shortcut: '⌘⌫',
  }),
};
