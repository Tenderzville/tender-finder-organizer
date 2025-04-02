
import React from 'react';
import { SupportForm } from '@/components/support/SupportForm';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { PrivacyConsentBanner } from '@/components/PrivacyConsentBanner';

const SupportPage = () => {
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Customer Support</h1>
      
      <div className="max-w-4xl mx-auto mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              We take your security and privacy seriously. Here's how we protect your data:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>All data is encrypted in transit and at rest</li>
              <li>We use strict data minimization practices</li>
              <li>Your personal information is never sold to third parties</li>
              <li>Regular security audits protect against vulnerabilities</li>
              <li>You can request a copy of your data or deletion at any time</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <SupportForm userId={user?.id} language="en" />
      </div>
      
      <PrivacyConsentBanner />
    </div>
  );
};

export default SupportPage;
