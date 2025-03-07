
import React from 'react';
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

function App() {
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
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <ChatSupport />
    </div>
  );
}

export default App;
