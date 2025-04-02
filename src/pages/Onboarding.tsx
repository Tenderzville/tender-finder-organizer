
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);

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

  const handleComplete = () => {
    // Save onboarding data
    localStorage.setItem('onboardingComplete', 'true');
    localStorage.setItem('userType', userType || '');
    localStorage.setItem('interests', JSON.stringify(interests));

    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl overflow-hidden border-none shadow-lg">
        <CardHeader className="bg-primary/5 pb-8">
          <CardTitle className="text-3xl font-bold text-center">Welcome to TenderTrack</CardTitle>
          <CardDescription className="text-center text-lg">Let's set up your experience</CardDescription>
        </CardHeader>

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CardContent className="p-6 pt-8">
              <h3 className="text-xl font-semibold mb-4">Who are you?</h3>
              <p className="text-muted-foreground mb-6">Help us tailor the experience to your needs</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant={userType === "supplier" ? "default" : "outline"} 
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => setUserType("supplier")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-briefcase"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  <span>I'm a Supplier</span>
                </Button>

                <Button 
                  variant={userType === "buyer" ? "default" : "outline"} 
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => setUserType("buyer")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
                  <span>I'm a Buyer</span>
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between pb-6 px-6">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>Skip</Button>
              <Button onClick={() => setStep(2)} disabled={!userType}>Continue</Button>
            </CardFooter>
          </motion.div>
        )}

        {step === 2 && (
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
                    className={`border rounded-lg p-3 flex items-center space-x-3 cursor-pointer transition-colors bg-primary/10 border-primary`}
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
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleComplete}>Finish Setup</Button>
            </CardFooter>
          </motion.div>
        )}
      </Card>
    </div>
  );
}
