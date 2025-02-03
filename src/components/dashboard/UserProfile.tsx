import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import type { UserProfile } from "@/types/user";

export const UserProfileCard = ({ userId }: { userId: string }) => {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("company_name, total_points")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as UserProfile;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Welcome!</h2>
        <p className="text-sm text-gray-500">Please complete your profile to get started.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Welcome back, {profile.company_name}!</h2>
      <p className="mt-2 text-gray-600">
        You have {profile.total_points || 0} points
      </p>
    </Card>
  );
};