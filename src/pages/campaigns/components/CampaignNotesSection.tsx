/**
 * CampaignNotesSection - Rich text notes editor with autosave
 *
 * Features:
 * - Always-visible Tiptap rich text editor (no edit button toggle)
 * - Autosave with 2s debounce
 * - Save state indicator (Saving... / Saved)
 * - Converts between plain text (backend) and Tiptap JSON (frontend)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, FileText, Check, AlertCircle, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TiptapEditor } from '@/pages/notes/components/TiptapEditor';
import { useAutosave } from '@/hooks/useAutosave';
import { plainTextToTiptap, tiptapToPlainText, isTiptapEmpty } from '@/lib/tiptapUtils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CampaignNotesSectionProps {
  /** Current notes value from campaign (plain text) */
  notes: string | null | undefined;
  /** Callback to save notes - should call updateCampaign mutation */
  onSave: (notes: string) => Promise<void>;
  /** Whether the campaign is currently loading */
  isLoading?: boolean;
}

export function CampaignNotesSection({
  notes,
  onSave,
  isLoading = false,
}: CampaignNotesSectionProps) {
  // Track the server version of notes to detect external changes
  const serverNotesRef = useRef(notes);
  const [resetKey, setResetKey] = useState(0);

  // Convert plain text to Tiptap JSON for the editor
  const [content, setContent] = useState(() => plainTextToTiptap(notes));

  // Update content when notes prop changes from server (not from our own save)
  useEffect(() => {
    if (!isLoading && notes !== serverNotesRef.current) {
      serverNotesRef.current = notes;
      const newContent = plainTextToTiptap(notes);
      setContent(newContent);
      // Increment reset key to tell autosave this is the new baseline
      setResetKey((k) => k + 1);
    }
  }, [notes, isLoading]);

  // Convert Tiptap content to plain text for saving
  const handleSave = useCallback(
    async (tiptapContent: unknown) => {
      const plainText = tiptapToPlainText(tiptapContent as Parameters<typeof tiptapToPlainText>[0]);
      // Update our tracking ref BEFORE the save completes
      // so we don't treat the refetched data as an external change
      serverNotesRef.current = plainText;
      await onSave(plainText);
    },
    [onSave]
  );

  // Autosave hook
  const { saveState, showSavedIndicator, error, clearError } = useAutosave({
    value: content,
    onSave: handleSave,
    debounceMs: 2000,
    enabled: !isLoading,
    resetKey,
  });

  // Handle editor changes
  const handleContentChange = useCallback((newContent: unknown) => {
    setContent(newContent as typeof content);
  }, []);

  const isEmpty = isTiptapEmpty(content);

  return (
    <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Notes
        </h3>

        {/* Save state indicator */}
        <div className="flex items-center gap-2">
          {saveState === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          {saveState === 'dirty' && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Unsaved
            </span>
          )}
          {saveState === 'error' && (
            <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3 w-3" />
              Error
            </span>
          )}
          {showSavedIndicator && saveState === 'idle' && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-500">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
            onClick={clearError}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div
          className={cn(
            'rounded-lg transition-colors',
            isEmpty && saveState === 'idle' && 'border border-dashed border-muted-foreground/30'
          )}
        >
          <TiptapEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Add notes about this campaign..."
            editable={true}
          />
        </div>
      )}
    </Card>
  );
}
