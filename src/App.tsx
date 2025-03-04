
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthState } from "@/hooks/useAuthState";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import TenderDetails from "./pages/TenderDetails";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import GetStarted from "./pages/GetStarted";
import Dashboard from "./pages/Dashboard";
import Preferences from "./pages/Preferences";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, profileStatus, isInitialized } = useAuthState();
  
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("[ProtectedRoute] User not authenticated, redirecting to auth");
    return <Navigate to="/auth" />;
  }

  if (profileStatus === 'missing') {
    console.log("[ProtectedRoute] Profile missing, redirecting to onboarding");
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/preferences" element={
            <ProtectedRoute>
              <Preferences />
            </ProtectedRoute>
          } />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/tenders/:id" element={
            <ProtectedRoute>
              <TenderDetails />
            </ProtectedRoute>
          } />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
