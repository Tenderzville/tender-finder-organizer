import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuthState } from '@/hooks/useAuthState';

// Bookmark interface
export interface BookmarkedTender {
  id: string;
  user_id: string;
  tender_id: string;
  created_at: string;
  notes?: string;
  reminder_date?: string;
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkedTender[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthState();

  // Fetch bookmarks
  const fetchBookmarks = async () => {
    if (!user) {
      setBookmarks([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('bookmarked_tenders')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      setBookmarks(data || []);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error('Error fetching bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add bookmark
  const addBookmark = async (tenderId: string, notes?: string, reminderDate?: string) => {
    if (!user) {
      setError('You must be logged in to bookmark tenders');
      return null;
    }
    
    try {
      setError(null);
      
      const newBookmark = {
        user_id: user.id,
        tender_id: tenderId,
        notes,
        reminder_date: reminderDate
      };
      
      const { data, error } = await supabase
        .from('bookmarked_tenders')
        .insert(newBookmark)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Update local state with new bookmark
      setBookmarks(prev => [...prev, data]);
      
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error('Error adding bookmark:', error);
      return null;
    }
  };

  // Remove bookmark
  const removeBookmark = async (tenderId: string) => {
    if (!user) {
      setError('You must be logged in to manage bookmarks');
      return false;
    }
    
    try {
      setError(null);
      
      const { error } = await supabase
        .from('bookmarked_tenders')
        .delete()
        .eq('user_id', user.id)
        .eq('tender_id', tenderId);
        
      if (error) {
        throw error;
      }
      
      // Update local state to remove bookmark
      setBookmarks(prev => prev.filter(bookmark => bookmark.tender_id !== tenderId));
      
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error('Error removing bookmark:', error);
      return false;
    }
  };

  // Update bookmark
  const updateBookmark = async (tenderId: string, updates: { notes?: string; reminder_date?: string }) => {
    if (!user) {
      setError('You must be logged in to manage bookmarks');
      return null;
    }
    
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('bookmarked_tenders')
        .update(updates)
        .eq('user_id', user.id)
        .eq('tender_id', tenderId)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setBookmarks(prev => 
        prev.map(bookmark => 
          bookmark.tender_id === tenderId ? data : bookmark
        )
      );
      
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error('Error updating bookmark:', error);
      return null;
    }
  };

  // Check if a tender is bookmarked
  const isBookmarked = (tenderId: string): boolean => {
    return bookmarks.some(bookmark => bookmark.tender_id === tenderId);
  };

  // Load bookmarks on mount and when user changes
  useEffect(() => {
    fetchBookmarks();
  }, [user]);

  return {
    bookmarks,
    isLoading,
    error,
    fetchBookmarks,
    addBookmark,
    removeBookmark,
    updateBookmark,
    isBookmarked
  };
};

export default useBookmarks;
