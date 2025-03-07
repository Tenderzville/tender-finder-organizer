
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from '@/pages/Landing';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import TenderDetails from '@/pages/TenderDetails';
import Preferences from '@/pages/Preferences';
import Auth from '@/pages/Auth';
import Services from '@/pages/Services';
import NotFound from '@/pages/NotFound';
import { Toaster } from "@/components/ui/toaster"
import TermsPage from '@/pages/Terms';
import PrivacyPage from '@/pages/Privacy';
import { ChatSupport } from "@/components/ChatSupport";
import LearningHub from '@/pages/LearningHub';
import { AdManager } from '@/integrations/AdManager';
import { usePerformance } from '@/hooks/use-performance';

function App() {
  const { performanceLevel, options } = usePerformance();
  
  // Apply performance optimizations
  useEffect(() => {
    // Apply simplified UI for low-end devices if needed
    if (options.useSimplifiedUI) {
      document.documentElement.classList.add('simplified-ui');
    } else {
      document.documentElement.classList.remove('simplified-ui');
    }
    
    // Disable animations for low-end devices if needed
    if (!options.animations) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [options]);
  
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tenders/:tenderId" element={<TenderDetails />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/services" element={<Services />} />
        <Route path="/learning-hub" element={<LearningHub />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <ChatSupport />
      <AdManager />
    </div>
  );
}

export default App;
