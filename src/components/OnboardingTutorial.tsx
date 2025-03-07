import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Tutorial step interface
interface TutorialStep {
  title: string;
  content: string;
  image?: string;
}

// Onboarding tutorial steps
const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Tenders Ville",
    content: "Your one-stop platform for finding government procurement opportunities in Kenya. This quick tour will help you get started.",
    image: "/assets/tutorial/welcome.png"
  },
  {
    title: "Browse Tenders",
    content: "Find tenders from multiple government sources all in one place. Use filters to narrow down opportunities that match your business.",
    image: "/assets/tutorial/browse.png"
  },
  {
    title: "AGPO Opportunities",
    content: "Discover tenders specifically set aside for youth, women, and persons with disabilities under the Access to Government Procurement Opportunities program.",
    image: "/assets/tutorial/agpo.png"
  },
  {
    title: "Save & Track",
    content: "Save tenders you're interested in and track their deadlines so you never miss an opportunity.",
    image: "/assets/tutorial/save.png"
  },
  {
    title: "Ready to Start?",
    content: "You're all set! Start exploring tenders or customize your profile to get personalized recommendations.",
    image: "/assets/tutorial/ready.png"
  }
];

interface OnboardingTutorialProps {
  isFirstVisit?: boolean;
  onComplete?: () => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  isFirstVisit = false,
  onComplete
}) => {
  const [open, setOpen] = useState(isFirstVisit);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Show tutorial automatically on first visit
  useEffect(() => {
    if (isFirstVisit) {
      setOpen(true);
    }
  }, [isFirstVisit]);
  
  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleComplete = () => {
    setOpen(false);
    
    // Store in local storage that user has seen the tutorial
    localStorage.setItem('tutorialComplete', 'true');
    
    // Call the onComplete callback if provided
    if (onComplete) {
      onComplete();
    }
  };
  
  // Skip to specific step
  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < tutorialSteps.length) {
      setCurrentStep(stepIndex);
    }
  };
  
  const currentTutorialStep = tutorialSteps[currentStep];
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {currentTutorialStep.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="my-6">
          {currentTutorialStep.image && (
            <div className="rounded-md overflow-hidden mb-4 h-[200px] flex items-center justify-center bg-gray-100">
              <img 
                src={currentTutorialStep.image} 
                alt={currentTutorialStep.title}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  // Fallback for missing images
                  (e.target as HTMLImageElement).src = "/assets/tutorial/placeholder.png";
                }}
              />
            </div>
          )}
          
          <p className="text-gray-700">{currentTutorialStep.content}</p>
        </div>
        
        {/* Step indicator dots */}
        <div className="flex justify-center space-x-2 mb-4">
          {tutorialSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => goToStep(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-primary' : 'bg-gray-300'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          <div>
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="ghost" onClick={handleComplete}>
              Skip
            </Button>
            
            <Button onClick={handleNext}>
              {currentStep < tutorialSteps.length - 1 ? 'Next' : 'Get Started'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTutorial;
