
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface UsePointsOptions {
  userId: string | null;
}

export const usePoints = ({ userId }: UsePointsOptions) => {
  const [points, setPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Fetch current points on mount
  useEffect(() => {
    if (userId) {
      fetchPoints();
    } else {
      // Load from local storage if not logged in
      const localPoints = localStorage.getItem('userPoints');
      if (localPoints) {
        setPoints(parseInt(localPoints, 10));
      }
      setIsLoading(false);
    }
  }, [userId]);
  
  // Fetch points from database
  const fetchPoints = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', userId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setPoints(data.points);
      } else {
        // Create points record if doesn't exist
        await supabase
          .from('user_points')
          .insert([{ user_id: userId, points: 0 }]);
        setPoints(0);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
      toast({
        title: "Couldn't load points",
        description: "There was an error loading your points",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add points and update database
  const addPoints = async (amount: number) => {
    if (amount <= 0) return;
    
    const newPoints = points + amount;
    
    // Optimistically update UI
    setPoints(newPoints);
    
    if (userId) {
      try {
        const { error } = await supabase
          .from('user_points')
          .update({ points: newPoints })
          .eq('user_id', userId);
          
        if (error) throw error;
        
        toast({
          title: "Points added!",
          description: `${amount} points have been added to your account`,
        });
      } catch (error) {
        console.error('Error adding points:', error);
        // Rollback on error
        setPoints(points);
        toast({
          title: "Couldn't add points",
          description: "There was an error adding points",
          variant: "destructive"
        });
      }
    } else {
      // Store in local storage if not logged in
      localStorage.setItem('userPoints', newPoints.toString());
      toast({
        title: "Points added!",
        description: `${amount} points have been added`,
      });
    }
  };
  
  // Spend points on premium features
  const spendPoints = async (amount: number): Promise<boolean> => {
    if (amount <= 0) return true;
    if (points < amount) {
      toast({
        title: "Not enough points",
        description: `You need ${amount} points for this action`,
        variant: "destructive"
      });
      return false;
    }
    
    const newPoints = points - amount;
    
    // Optimistically update UI
    setPoints(newPoints);
    
    if (userId) {
      try {
        const { error } = await supabase
          .from('user_points')
          .update({ points: newPoints })
          .eq('user_id', userId);
          
        if (error) throw error;
        
        return true;
      } catch (error) {
        console.error('Error spending points:', error);
        // Rollback on error
        setPoints(points);
        toast({
          title: "Couldn't process points",
          description: "There was an error processing this action",
          variant: "destructive"
        });
        return false;
      }
    } else {
      // Store in local storage if not logged in
      localStorage.setItem('userPoints', newPoints.toString());
      return true;
    }
  };
  
  return {
    points,
    isLoading,
    addPoints,
    spendPoints,
    refreshPoints: fetchPoints
  };
};
