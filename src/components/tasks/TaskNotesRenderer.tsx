import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import { cn } from '@/lib/utils';

interface TaskNotesRendererProps {
  content: any; // TipTap JSON or legacy string
  className?: string;
}

/**
 * Read-only renderer for task notes with mention support.
 * Used in TaskViewSheet and other places where notes should be displayed but not edited.
 */
export const TaskNotesRenderer = ({ content, className }: TaskNotesRendererProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        renderLabel({ node }) {
          return node.attrs.label;
        },
      }),
    ],
    content,
    editable: false, // Read-only
    editorProps: {
      attributes: {
        class: cn('prose prose-sm max-w-none focus:outline-none'),
      },
    },
  });

  if (!editor || !content) {
    return null;
  }

  return (
    <div className={cn('task-notes-renderer', className)}>
      <style>{`
        .task-notes-renderer .ProseMirror {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0;
        }
        .task-notes-renderer .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .task-notes-renderer .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
        .task-notes-renderer .ProseMirror li {
          margin: 0.25rem 0;
        }
        .task-notes-renderer .ProseMirror p {
          margin: 0.5rem 0;
        }
        .task-notes-renderer .ProseMirror strong {
          font-weight: 600;
        }
        .task-notes-renderer .ProseMirror em {
          font-style: italic;
        }

        /* Mention styles */
        .task-notes-renderer .ProseMirror .mention {
          background-color: hsl(var(--primary) / 0.1);
          color: hsl(var(--primary));
          border-radius: 0.375rem;
          padding: 0.125rem 0.5rem;
          font-weight: 500;
          cursor: default;
          text-decoration: none;
        }
      `}</style>
      <EditorContent editor={editor} />
    </div>
  );
};
