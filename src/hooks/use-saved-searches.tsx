
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  search_criteria: any;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useSavedSearches(userId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedSearches = [], isLoading, error } = useQuery({
    queryKey: ['saved-searches', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SavedSearch[];
    },
    enabled: !!userId,
  });

  const saveSearchMutation = useMutation({
    mutationFn: async (data: { name: string; search_criteria: any; notification_enabled?: boolean }) => {
      const { error } = await supabase
        .from('saved_searches')
        .insert([{
          user_id: userId,
          name: data.name,
          search_criteria: data.search_criteria,
          notification_enabled: data.notification_enabled ?? true
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches', userId] });
      toast({
        title: "Search Saved",
        description: "Your search has been saved successfully",
      });
    },
  });

  const deleteSearchMutation = useMutation({
    mutationFn: async (searchId: string) => {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', searchId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches', userId] });
      toast({
        title: "Search Deleted",
        description: "Your saved search has been deleted",
      });
    },
  });

  return {
    savedSearches,
    isLoading,
    error,
    saveSearch: saveSearchMutation.mutate,
    deleteSearch: deleteSearchMutation.mutate,
    isSaving: saveSearchMutation.isPending,
    isDeleting: deleteSearchMutation.isPending,
  };
}
