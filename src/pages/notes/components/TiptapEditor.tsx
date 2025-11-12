import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Undo, Redo, Heading1, Heading2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TiptapEditorProps {
  content: any;
  onChange: (content: any) => void;
  placeholder?: string;
  editable?: boolean;
}

export const TiptapEditor = ({ content, onChange, placeholder = 'Start writing...', editable = true }: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
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
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px]',
      },
    },
  });

  // Update content when it changes externally
  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return <div className="border rounded-lg min-h-[250px] animate-pulse bg-muted" />;
  }

  return (
    <div>
      {editable && (
        <div className="pb-2 mb-2 flex gap-1 flex-wrap">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            }}
            className={cn(editor.isActive('heading', { level: 1 }) && 'bg-accent')}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            }}
            className={cn(editor.isActive('heading', { level: 2 }) && 'bg-accent')}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBold().run();
            }}
            className={cn(editor.isActive('bold') && 'bg-accent')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleItalic().run();
            }}
            className={cn(editor.isActive('italic') && 'bg-accent')}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBulletList().run();
            }}
            className={cn(editor.isActive('bulletList') && 'bg-accent')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleOrderedList().run();
            }}
            className={cn(editor.isActive('orderedList') && 'bg-accent')}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().undo().run();
            }}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().redo().run();
            }}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="tiptap-content">
        <style>{`
          .tiptap-content .ProseMirror {
            outline: none !important;
            border: none !important;
            box-shadow: none !important;
          }
          .tiptap-content .ProseMirror:focus {
            outline: none !important;
            border: none !important;
            box-shadow: none !important;
          }
          .tiptap-content .ProseMirror ul {
            list-style-type: disc;
            padding-left: 1.5rem;
          }
          .tiptap-content .ProseMirror ol {
            list-style-type: decimal;
            padding-left: 1.5rem;
          }
          .tiptap-content .ProseMirror li {
            margin: 0.25rem 0;
          }
          .tiptap-content .ProseMirror h1 {
            font-size: 1.875rem;
            font-weight: 700;
            margin-top: 1rem;
            margin-bottom: 0.5rem;
          }
          .tiptap-content .ProseMirror h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-top: 0.75rem;
            margin-bottom: 0.5rem;
          }
          .tiptap-content .ProseMirror p {
            margin: 0.5rem 0;
          }
          .tiptap-content .ProseMirror strong {
            font-weight: 700;
          }
          .tiptap-content .ProseMirror em {
            font-style: italic;
          }
          .tiptap-content .ProseMirror p.is-editor-empty:first-child::before {
            color: #adb5bd;
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
