
import React from 'react';
import { SupportForm } from '@/components/support/SupportForm';
import { useAuth } from '@/hooks/use-auth';

const SupportPage = () => {
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Customer Support</h1>
      <div className="max-w-4xl mx-auto">
        <SupportForm userId={user?.id} language="en" />
      </div>
    </div>
  );
};

export default SupportPage;
