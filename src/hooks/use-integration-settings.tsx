
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IntegrationSetting {
  id: string;
  user_id: string;
  integration_type: string;
  settings: any;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useIntegrationSettings(userId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: integrationSettings = [], isLoading, error } = useQuery({
    queryKey: ['integration-settings', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data as IntegrationSetting[];
    },
    enabled: !!userId,
  });

  const updateSettingMutation = useMutation({
    mutationFn: async (data: { 
      integration_type: string; 
      settings: any; 
      enabled: boolean 
    }) => {
      const { error } = await supabase
        .from('integration_settings')
        .upsert([{
          user_id: userId,
          integration_type: data.integration_type,
          settings: data.settings,
          enabled: data.enabled,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'user_id,integration_type'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-settings', userId] });
      toast({
        title: "Settings Updated",
        description: "Integration settings have been saved",
      });
    },
  });

  const getSettingByType = (type: string): IntegrationSetting | undefined => {
    return integrationSettings.find(setting => setting.integration_type === type);
  };

  return {
    integrationSettings,
    isLoading,
    error,
    updateSetting: updateSettingMutation.mutate,
    getSettingByType,
    isUpdating: updateSettingMutation.isPending,
  };
}
