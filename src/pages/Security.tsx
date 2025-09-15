import React from 'react';
import { SecurityDashboard } from '@/components/security/SecurityDashboard';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

const SecurityPage = () => {
  const { user } = useAuth();

  // For now, we'll allow authenticated users to access this
  // In a real app, you'd check for admin role
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to access the security dashboard.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <SecurityDashboard />
      </main>
    </div>
  );
};

export default SecurityPage;