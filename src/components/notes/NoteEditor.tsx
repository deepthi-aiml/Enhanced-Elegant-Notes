import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pin,
  Archive,
  Trash2,
  Palette,
  Copy,
  Check,
  Clock,
  Share2,
  ExternalLink,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Code
} from 'lucide-react';
import { format } from 'date-fns';
import { Note, NoteColor } from '@/types';
import { cn } from '@/lib/utils';
import { TagInput } from '@/components/ui/TagInput';
import { ColorPalette } from '@/components/ui/ColorPalette';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';

interface NoteEditorProps {
  note: Note;
  allTags: string[];
  onUpdate: (updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onSetColor: (color: NoteColor) => void;
  onPin: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onTogglePublic: () => void;
}

const colorClasses: Record<NoteColor, string> = {
  default: 'bg-card border-border',
  rose: 'bg-note-rose border-note-rose-border',
  red: 'bg-note-red border-note-red-border',
  pink: 'bg-note-pink border-note-pink-border',
  fuchsia: 'bg-note-fuchsia border-note-fuchsia-border',
  violet: 'bg-note-violet border-note-violet-border',
  purple: 'bg-note-purple border-note-purple-border',
  indigo: 'bg-note-indigo border-note-indigo-border',
  navy: 'bg-note-navy border-note-navy-border',
  blue: 'bg-note-blue border-note-blue-border',
  sky: 'bg-note-sky border-note-sky-border',
  cyan: 'bg-note-cyan border-note-cyan-border',
  teal: 'bg-note-teal border-note-teal-border',
  mint: 'bg-note-mint border-note-mint-border',
  emerald: 'bg-note-emerald border-note-emerald-border',
  green: 'bg-note-green border-note-green-border',
  lime: 'bg-note-lime border-note-lime-border',
  yellow: 'bg-note-yellow border-note-yellow-border',
  amber: 'bg-note-amber border-note-amber-border',
  gold: 'bg-note-gold border-note-gold-border',
  orange: 'bg-note-orange border-note-orange-border',
  maroon: 'bg-note-maroon border-note-maroon-border',
  coffee: 'bg-note-coffee border-note-coffee-border',
  slate: 'bg-note-slate border-note-slate-border',
};

export function NoteEditor({
  note,
  allTags,
  onUpdate,
  onAddTag,
  onRemoveTag,
  onSetColor,
  onPin,
  onArchive,
  onDuplicate,
  onDelete,
  onTogglePublic,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const isMobile = useIsMobile();

  // Auto-save with debounce
  const debouncedSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(() => {
        onUpdate({ title: newTitle, content: newContent });
        setIsSaving(false);
        setLastSaved(new Date());
      }, 1500);
    },
    [onUpdate]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: note.content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      debouncedSave(title, html);
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
  });

  // Sync title from cloud/external changes (only if it differs from local state)
  useEffect(() => {
    if (note.title !== title) {
      setTitle(note.title);
    }
  }, [note.title]);

  // Sync content from cloud/external changes (only if it differs from editor state)
  useEffect(() => {
    if (editor && editor.getHTML() !== note.content) {
      editor.commands.setContent(note.content, { emitUpdate: false });
    }
  }, [note.content, editor]);

  // Cleanup pending saves on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Be careful not to save 'undefined' or empty content if editor isn't ready
    const currentContent = editor?.getHTML() || note.content;
    debouncedSave(value, currentContent);
  };

  const formattedDate = format(new Date(note.createdAt), 'MMMM d, yyyy');
  const formattedTime = lastSaved ? format(lastSaved, 'h:mm a') : null;

  return (
    <motion.div
      key={note.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex h-full flex-col overflow-hidden transition-colors duration-500",
        colorClasses[note.color || 'default']
      )}
    >
      {/* Toolbar */}
      <div className={cn(
        "flex items-center justify-between border-b border-border py-2 transition-all",
        isMobile ? "px-4" : "px-6"
      )}>
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={onPin}
            className={cn(
              'action-button',
              note.isPinned && 'active'
            )}
            title={note.isPinned ? 'Unpin' : 'Pin to top'}
          >
            <Pin className={cn('h-4 w-4', note.isPinned && 'rotate-45')} />
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button className="action-button" title="Change color">
                <Palette className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Note color
              </p>
              <ColorPalette
                selectedColor={note.color || 'default'}
                onSelectColor={onSetColor}
              />
            </PopoverContent>
          </Popover>

          <div className="mx-1 h-6 w-px bg-border" />

          {/* Editor Formatting Controls */}
          {editor && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn('action-button', editor.isActive('bold') && 'active')}
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn('action-button', editor.isActive('italic') && 'active')}
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn('action-button', editor.isActive('heading', { level: 1 }) && 'active')}
                title="Heading 1"
              >
                <Heading1 className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn('action-button', editor.isActive('heading', { level: 2 }) && 'active')}
                title="Heading 2"
              >
                <Heading2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn('action-button', editor.isActive('bulletList') && 'active')}
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn('action-button', editor.isActive('orderedList') && 'active')}
                title="Ordered List"
              >
                <ListOrdered className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={cn('action-button', editor.isActive('codeBlock') && 'active')}
                title="Code Block"
              >
                <Code className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mx-1 h-6 w-px bg-border" />

          <button
            onClick={onArchive}
            className={cn(
              'action-button',
              note.isArchived && 'active'
            )}
            title={note.isArchived ? 'Unarchive' : 'Archive'}
          >
            <Archive className="h-4 w-4" />
          </button>

          <button
            onClick={onDuplicate}
            className="action-button"
            title="Duplicate note"
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            onClick={onDelete}
            className="action-button hover:!text-destructive"
            title="Delete note"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'action-button',
                  note.is_public && 'active'
                )}
                title="Share note"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium leading-none">Share note</h4>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is-public"
                      checked={note.is_public}
                      onChange={onTogglePublic}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor="is-public"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Public access
                    </label>
                  </div>
                </div>

                {note.is_public && note.public_slug && (
                  <div className="space-y-2 animate-in">
                    <p className="text-sm text-muted-foreground">
                      Anyone with the link can view this note.
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          readOnly
                          value={`${window.location.origin}/share/${note.public_slug}`}
                          className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/share/${note.public_slug}`;
                          navigator.clipboard.writeText(url);
                          toast.success('Link copied to clipboard');
                        }}
                        className="action-button"
                        title="Copy link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href={`/share/${note.public_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-button"
                        title="Open live preview"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Preview Status</p>
                      <p className="text-xs text-muted-foreground">Your note is now live at the generated URL. Changes are synced in real-time.</p>
                    </div>
                  </div>
                )}
                {!note.is_public && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground italic">Note is currently private.</p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Save status */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.span
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1"
              >
                <Clock className="h-3 w-3 animate-pulse-subtle" />
                Saving...
              </motion.span>
            ) : lastSaved ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1"
              >
                <Check className="h-3 w-3 text-primary" />
                Saved {formattedTime}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className={cn(
          "mx-auto max-w-3xl py-6 transition-all",
          isMobile ? "px-4" : "px-6"
        )}>
          {/* Date */}
          <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
            {formattedDate}
          </p>

          {/* Title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Note"
            className="mb-6 w-full bg-transparent text-4xl font-extrabold tracking-tight outline-none placeholder:text-muted-foreground/30"
          />

          {/* Tags */}
          <TagInput
            tags={note.tags}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
            suggestions={allTags.filter((t) => !note.tags.includes(t))}
            placeholder="Add tags..."
            className="mb-8"
          />

          {/* Tiptap Editor */}
          <EditorContent editor={editor} className="editor-content min-h-[400px]" />
        </div>
      </div>
    </motion.div>
  );
}
