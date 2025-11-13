import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
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
    ],
    content,
    onUpdate: ({ editor }) => {
      // Return plain text for simple fields, HTML for rich fields
      onChange(editor.getText() || '');
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
    if (editor && content !== editor.getText()) {
      editor.commands.setContent(content);
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
        `}</style>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
