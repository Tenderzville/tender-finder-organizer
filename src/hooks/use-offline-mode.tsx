
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Define types for stored tender data
interface StoredTender {
  id: string;
  title: string;
  description?: string;
  organization: string;
  deadline: string;
  category: string;
  location?: string;
  requirements?: string;
  points_required?: number;
  tender_url?: string;
  affirmative_action?: {
    type: string;
    details?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<{
    tenders: StoredTender[];
    lastSynced: string | null;
  }>({
    tenders: [],
    lastSynced: null
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "You're back online",
        description: "Syncing your data...",
      });
      syncData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description: "Don't worry, you can still view saved tenders",
        variant: "destructive"
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Load offline data on mount
    loadOfflineData();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Load cached data from localStorage
  const loadOfflineData = () => {
    try {
      const savedData = localStorage.getItem('offlineTenders');
      const lastSynced = localStorage.getItem('lastTenderSync');
      
      if (savedData) {
        setOfflineData({
          tenders: JSON.parse(savedData),
          lastSynced: lastSynced
        });
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  };
  
  // Save tenders for offline access
  const saveTendersOffline = (tenders: StoredTender[]) => {
    try {
      localStorage.setItem('offlineTenders', JSON.stringify(tenders));
      const now = new Date().toISOString();
      localStorage.setItem('lastTenderSync', now);
      
      setOfflineData({
        tenders,
        lastSynced: now
      });
      
      return true;
    } catch (error) {
      console.error('Error saving tenders offline:', error);
      toast({
        title: "Storage error",
        description: "Couldn't save tenders for offline use. Storage might be full.",
        variant: "destructive"
      });
      return false;
    }
  };
  
  // Sync local data with server when back online
  const syncData = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      // Here you would implement your sync logic with the server
      // For example, fetch new tenders and update local storage
      
      // Placeholder for actual sync implementation
      const response = await fetch('/api/tenders');
      if (response.ok) {
        const tenders = await response.json();
        saveTendersOffline(tenders);
        toast({
          title: "Sync complete",
          description: "Your tender data is now up to date",
        });
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      toast({
        title: "Sync failed",
        description: "Couldn't sync your tender data",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Save a single tender for offline access
  const saveTenderOffline = (tender: StoredTender) => {
    try {
      const currentTenders = [...offlineData.tenders];
      const existingIndex = currentTenders.findIndex(t => t.id === tender.id);
      
      if (existingIndex >= 0) {
        currentTenders[existingIndex] = tender;
      } else {
        currentTenders.push(tender);
      }
      
      saveTendersOffline(currentTenders);
      
      toast({
        title: "Tender saved",
        description: "This tender is now available offline",
      });
      
      return true;
    } catch (error) {
      console.error('Error saving tender offline:', error);
      return false;
    }
  };
  
  return {
    isOnline,
    offlineData,
    isSyncing,
    saveTenderOffline,
    syncData
  };
};
