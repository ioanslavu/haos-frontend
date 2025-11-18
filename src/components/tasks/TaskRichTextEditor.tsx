import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getSuggestion } from './mentions/suggestion';

interface TaskRichTextEditorProps {
  content: any; // TipTap JSON or legacy string
  onChange: (content: any) => void;
  placeholder?: string;
  minimal?: boolean;
}

export const TaskRichTextEditor = ({
  content,
  onChange,
  placeholder = 'Add details...',
  minimal = false
}: TaskRichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings for task descriptions
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: getSuggestion(),
        renderLabel({ node }) {
          return node.attrs.label;
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      // Return TipTap JSON format (preserves all formatting and mentions)
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none',
          minimal ? 'min-h-[60px]' : 'min-h-[120px]'
        ),
      },
    },
  });

  // Update content when it changes externally
  useEffect(() => {
    if (!editor) return;

    // Get current editor content
    const currentContent = editor.getJSON();

    // Only update if content actually changed (deep comparison)
    const contentChanged = JSON.stringify(content) !== JSON.stringify(currentContent);

    if (contentChanged) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  if (!editor) {
    return <div className="border rounded-lg min-h-[80px] animate-pulse bg-muted/30" />;
  }

  return (
    <div className="space-y-2">
      {!minimal && (
        <div className="flex gap-1 flex-wrap pb-2 border-b border-border/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('bold') && 'bg-accent'
            )}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('italic') && 'bg-accent'
            )}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('bulletList') && 'bg-accent'
            )}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('orderedList') && 'bg-accent'
            )}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      <div className="task-editor-content">
        <style>{`
          .task-editor-content .ProseMirror {
            outline: none !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0.5rem;
          }
          .task-editor-content .ProseMirror:focus {
            outline: none !important;
            border: none !important;
            box-shadow: none !important;
          }
          .task-editor-content .ProseMirror ul {
            list-style-type: disc;
            padding-left: 1.5rem;
          }
          .task-editor-content .ProseMirror ol {
            list-style-type: decimal;
            padding-left: 1.5rem;
          }
          .task-editor-content .ProseMirror li {
            margin: 0.25rem 0;
          }
          .task-editor-content .ProseMirror p {
            margin: 0.5rem 0;
          }
          .task-editor-content .ProseMirror strong {
            font-weight: 600;
          }
          .task-editor-content .ProseMirror em {
            font-style: italic;
          }
          .task-editor-content .ProseMirror p.is-editor-empty:first-child::before {
            color: hsl(var(--muted-foreground) / 0.5);
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }

          /* Mention styles */
          .task-editor-content .ProseMirror .mention {
            background-color: hsl(var(--primary) / 0.1);
            color: hsl(var(--primary));
            border-radius: 0.375rem;
            padding: 0.125rem 0.5rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
            text-decoration: none;
          }
          .task-editor-content .ProseMirror .mention:hover {
            background-color: hsl(var(--primary) / 0.2);
          }
        `}</style>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
