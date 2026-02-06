import { supabase } from './supabase';
import { Note } from '@/types';
import { withRetry } from './utils/retry';
import { toast } from 'sonner';

export const notesService = {
    async getNotes() {
        return withRetry(async () => {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data;
        }, {
            onRetry: (err) => console.warn('Retrying getNotes...', err)
        });
    },

    async getNotesPaged(page: number, pageSize: number = 20, search?: string) {
        return withRetry(async () => {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from('notes')
                .select('*', { count: 'exact' })
                .order('updated_at', { ascending: false });

            if (search) {
                query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
            }

            const { data, error, count } = await query.range(from, to);

            if (error) throw error;
            return { data, count };
        });
    },

    async createNote(note: Partial<Note>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        return withRetry(async () => {
            const { data, error } = await supabase
                .from('notes')
                .insert([{ ...note, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            return data;
        }, {
            onRetry: (err) => toast.warning('Syncing note... Retrying Connection.')
        });
    },

    async updateNote(id: string, updates: Partial<Note>) {
        return withRetry(async () => {
            const { data, error } = await supabase
                .from('notes')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        }, {
            onRetry: (err) => console.warn(`Retrying updateNote for ${id}...`, err)
        });
    },

    async deleteNote(id: string) {
        return withRetry(async () => {
            const { error } = await supabase
                .from('notes')
                .delete()
                .eq('id', id);

            if (error) throw error;
        }, {
            onRetry: (err) => console.warn(`Retrying deleteNote for ${id}...`, err)
        });
    },

    async getPublicNote(slug: string) {
        return withRetry(async () => {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('public_slug', slug)
                .eq('is_public', true)
                .single();

            if (error) throw error;
            return data;
        });
    }
};
