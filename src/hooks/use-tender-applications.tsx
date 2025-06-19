
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TenderApplication {
  id: string;
  user_id: string;
  tender_id: number;
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';
  application_data?: any;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export function useTenderApplications(userId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['tender-applications', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('tender_applications')
        .select(`
          *,
          tenders:tender_id (
            id,
            title,
            deadline,
            procuring_entity
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TenderApplication[];
    },
    enabled: !!userId,
  });

  const createApplicationMutation = useMutation({
    mutationFn: async (data: { tender_id: number; application_data?: any }) => {
      const { error } = await supabase
        .from('tender_applications')
        .insert([{
          user_id: userId,
          tender_id: data.tender_id,
          application_data: data.application_data,
          status: 'draft'
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-applications', userId] });
      toast({
        title: "Application Started",
        description: "Your tender application has been created as a draft",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create application",
        variant: "destructive",
      });
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async (data: { id: string; status?: string; application_data?: any }) => {
      const updateData: any = {};
      if (data.status) updateData.status = data.status;
      if (data.application_data) updateData.application_data = data.application_data;
      if (data.status === 'submitted') updateData.submitted_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('tender_applications')
        .update(updateData)
        .eq('id', data.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-applications', userId] });
      toast({
        title: "Application Updated",
        description: "Your application has been updated successfully",
      });
    },
  });

  return {
    applications,
    isLoading,
    error,
    createApplication: createApplicationMutation.mutate,
    updateApplication: updateApplicationMutation.mutate,
    isCreating: createApplicationMutation.isPending,
    isUpdating: updateApplicationMutation.isPending,
  };
}
