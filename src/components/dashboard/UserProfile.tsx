import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { UserProfile } from "@/types/user";

export const UserProfileCard = ({ userId }: { userId: string }) => {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      console.log("Fetching user profile for:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("company_name, total_points")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      console.log("Profile data:", data);
      return data as UserProfile;
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32 space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load profile. Please try again later.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-2 text-lg font-semibold">Welcome!</h2>
          <p className="text-sm text-gray-500">Please complete your profile to get started.</p>
        </div>
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