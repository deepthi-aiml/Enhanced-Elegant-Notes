import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { notesService } from '@/lib/notesService';
import { Note, NoteColor } from '@/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Share2, Clock, Tag } from 'lucide-react';
import { sanitizeHtml } from '@/lib/utils/security';
import { cn } from '@/lib/utils';

const colorClasses: Record<NoteColor, string> = {
    default: 'bg-background',
    rose: 'bg-note-rose/30',
    red: 'bg-note-red/30',
    pink: 'bg-note-pink/30',
    fuchsia: 'bg-note-fuchsia/30',
    violet: 'bg-note-violet/30',
    purple: 'bg-note-purple/30',
    indigo: 'bg-note-indigo/30',
    navy: 'bg-note-navy/30',
    blue: 'bg-note-blue/30',
    sky: 'bg-note-sky/30',
    cyan: 'bg-note-cyan/30',
    teal: 'bg-note-teal/30',
    mint: 'bg-note-mint/30',
    emerald: 'bg-note-emerald/30',
    green: 'bg-note-green/10', // Subtler for large backgrounds
    lime: 'bg-note-lime/30',
    yellow: 'bg-note-yellow/30',
    amber: 'bg-note-amber/30',
    gold: 'bg-note-gold/30',
    orange: 'bg-note-orange/30',
    maroon: 'bg-note-maroon/30',
    coffee: 'bg-note-coffee/30',
    slate: 'bg-note-slate/30',
};

export default function Share() {
    const { slug } = useParams<{ slug: string }>();
    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const sanitizedContent = useMemo(() => {
        if (!note?.content) return '';
        return sanitizeHtml(note.content);
    }, [note?.content]);

    useEffect(() => {
        if (slug) {
            notesService.getPublicNote(slug)
                .then((data) => {
                    if (!data) throw new Error('Note not found');
                    setNote({
                        id: data.id,
                        title: data.title,
                        content: data.content,
                        tags: data.tags || [],
                        createdAt: data.created_at,
                        updatedAt: data.updated_at,
                        isPinned: data.is_pinned,
                        isArchived: data.is_archived,
                        color: data.color,
                    } as Note);
                })
                .catch((err) => {
                    console.error(err);
                    setError('This note is no longer available or is private.');
                })
                .finally(() => setLoading(false));
        }
    }, [slug]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="animate-pulse font-medium text-muted-foreground">Fetching Note...</p>
                </div>
            </div>
        );
    }

    if (error || !note) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
                <div className="mb-6 rounded-full bg-muted p-6">
                    <Share2 className="h-12 w-12 text-muted-foreground opacity-20" />
                </div>
                <h1 className="mb-2 text-2xl font-bold tracking-tight">Access Restricted</h1>
                <p className="mb-8 max-w-xs text-muted-foreground">{error || 'The note you are looking for does not exist or has been made private.'}</p>
                <Button asChild variant="default" className="rounded-full px-8">
                    <Link to="/">Back to Elegant Notes</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className={cn("min-h-screen transition-colors duration-1000", colorClasses[note.color || 'default'])}>
            <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-16">
                {/* Header Navigation */}
                <div className="mb-12 flex items-center justify-between border-b border-foreground/5 pb-6">
                    <Link to="/" className="group flex items-center font-bold tracking-tighter text-foreground transition-all hover:opacity-70">
                        <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow">
                            EN
                        </div>
                        Elegant Notes
                    </Link>
                    <div className="hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:flex">
                        <Clock className="h-3 w-3" />
                        Shared via Premium Link
                    </div>
                </div>

                <article className="animate-in">
                    {/* Meta Info */}
                    <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground/60">
                        <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(note.createdAt), 'MMMM d, yyyy')}
                        </span>
                        {note.tags && note.tags.length > 0 && (
                            <span className="flex items-center gap-1.5">
                                <Tag className="h-3.5 w-3.5" />
                                {note.tags.length} Tag{note.tags.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="mb-8 text-5xl font-extrabold tracking-tight text-foreground md:text-6xl">
                        {note.title || 'Untitled'}
                    </h1>

                    {/* Expanded Tags */}
                    {note.tags && note.tags.length > 0 && (
                        <div className="mb-12 flex flex-wrap gap-2">
                            {note.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full bg-foreground/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-foreground/70"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Content - Using Prose for Rich Text Styling */}
                    <div
                        className="prose prose-teal dark:prose-invert prose-lg max-w-none prose-headings:tracking-tight prose-p:leading-relaxed prose-pre:bg-muted/50"
                        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                    />
                </article>

                {/* Footer / CTA */}
                <div className="mt-24 border-t border-foreground/5 pt-12 text-center">
                    <p className="mb-6 text-sm text-muted-foreground">Create your own beautiful notes with Elegant Notes.</p>
                    <Button asChild variant="outline" className="rounded-full px-8 hover:bg-primary hover:text-primary-foreground">
                        <Link to="/">Get Started Free</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
