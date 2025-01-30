import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    location: "",
    areasOfExpertise: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Please sign in to complete your profile",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { error } = await supabase.from("profiles").insert({
        user_id: user.id,
        company_name: formData.companyName,
        industry: formData.industry,
        location: formData.location,
        areas_of_expertise: formData.areasOfExpertise.split(",").map(item => item.trim()),
      });

      if (error) throw error;

      toast({
        title: "Profile Created",
        description: "Your profile has been set up successfully!",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error creating profile:", error);
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Step {step} of 2
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 ? (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={() => setStep(2)}
                className="w-full"
              >
                Next Step
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="areasOfExpertise">
                    Areas of Expertise (comma-separated)
                  </Label>
                  <Input
                    id="areasOfExpertise"
                    name="areasOfExpertise"
                    value={formData.areasOfExpertise}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-full"
                >
                  Back
                </Button>
                <Button type="submit" className="w-full">
                  Complete Profile
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default Onboarding;