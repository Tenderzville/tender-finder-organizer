
import { Loader2 } from "lucide-react";
import { Navigation } from "@/components/Navigation";

export const DashboardLoading = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </main>
    </div>
  );
};
