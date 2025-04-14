
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [interests, setInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('user_id', session.user.id)
            .maybeSingle();
            
          if (profile?.onboarding_completed) {
            console.log("Onboarding already completed, redirecting to dashboard");
            navigate('/dashboard');
          }
        } else {
          const hasCompletedOnboarding = localStorage.getItem('onboardingComplete') === 'true';
          
          if (hasCompletedOnboarding) {
            console.log("Onboarding already completed (localStorage), redirecting to dashboard");
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      }
    };
    
    checkOnboardingStatus();
  }, [navigate]);

  const interestOptions = [
    "IT & Telecommunications", 
    "Construction", 
    "Medical Supplies", 
    "Energy & Utilities",
    "Agriculture",
    "Education",
    "Security Services",
    "AGPO Related",
    "Women Opportunities",
    "Youth Opportunities",
    "PWD Opportunities",
    "Financial Services",
    "Transportation & Logistics",
    "Environmental Services",
    "Professional Services",
    "Hospitality & Tourism"
  ];

  const handleInterestToggle = (value: string) => {
    setInterests(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem('interests', JSON.stringify(interests));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            user_id: session.user.id,
            onboarding_completed: true,
            areas_of_expertise: interests
          }, {
            onConflict: 'user_id'
          });
          
        if (error) {
          console.error("Error saving onboarding data:", error);
          toast({
            title: "Error",
            description: "Failed to save your preferences. But you can continue to the dashboard.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: "Your preferences have been saved successfully!",
          });
        }
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error("Error in onboarding completion:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl overflow-hidden border-none shadow-lg">
        <CardHeader className="bg-primary/5 pb-8">
          <CardTitle className="text-3xl font-bold text-center">Welcome to TenderTrack</CardTitle>
          <CardDescription className="text-center text-lg">Let's set up your experience</CardDescription>
        </CardHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CardContent className="p-6 pt-8">
            <h3 className="text-xl font-semibold mb-4">What are you interested in?</h3>
            <p className="text-muted-foreground mb-6">Select categories to see related tenders</p>

            <div className="mb-6">
              <Select onValueChange={(value) => {
                if (value && !interests.includes(value)) {
                  setInterests(prev => [...prev, value]);
                }
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Add a category" />
                </SelectTrigger>
                <SelectContent>
                  {interestOptions.map((option) => (
                    <SelectItem key={option} value={option} disabled={interests.includes(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {interests.map((interest) => (
                <div 
                  key={interest}
                  className="border rounded-lg p-3 flex items-center space-x-3 cursor-pointer transition-colors bg-primary/10 border-primary"
                >
                  <Checkbox 
                    id={`interest-${interest}`}
                    checked={true}
                    onCheckedChange={() => handleInterestToggle(interest)}
                  />
                  <label 
                    htmlFor={`interest-${interest}`}
                    className="flex-grow cursor-pointer"
                  >
                    {interest}
                  </label>
                </div>
              ))}
            </div>
            
            {interests.length === 0 && (
              <p className="text-center text-muted-foreground mt-4">
                Add categories you're interested in from the dropdown above
              </p>
            )}
          </CardContent>

          <CardFooter className="flex justify-between pb-6 px-6">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>Skip</Button>
            <Button 
              onClick={handleComplete} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Finish Setup'}
            </Button>
          </CardFooter>
        </motion.div>
      </Card>
    </div>
  );
}
