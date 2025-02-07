import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, Gift, Video, Eye, Award, Share2, Facebook } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const GetStarted = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Success!",
      description: "Thank you for subscribing to our newsletter!",
    });
    
    setIsLoading(false);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Banner Ad */}
      <div className="w-full bg-blue-100 p-4 text-center border-b">
        <p className="text-sm text-blue-800">Advertisement Space</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl mb-8">
            Welcome to Tenderzville Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your gateway to discovering and winning tender opportunities. Start earning points today!
          </p>
        </div>

        {/* Points System Highlight */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-6">How Our Points System Works</h2>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div className="space-y-2">
                <Eye className="h-8 w-8 mx-auto text-blue-600" />
                <h3 className="font-medium">Sign Up Bonus</h3>
                <p className="text-sm text-gray-600">Get 50 points instantly when you sign up</p>
              </div>
              <div className="space-y-2">
                <Video className="h-8 w-8 mx-auto text-blue-600" />
                <h3 className="font-medium">Watch & Earn</h3>
                <p className="text-sm text-gray-600">Watch 10 ads = 100 points</p>
              </div>
              <div className="space-y-2">
                <Share2 className="h-8 w-8 mx-auto text-blue-600" />
                <h3 className="font-medium">Invite Friends</h3>
                <p className="text-sm text-gray-600">500 points per successful referral</p>
              </div>
              <div className="space-y-2">
                <Facebook className="h-8 w-8 mx-auto text-blue-600" />
                <h3 className="font-medium">Share Socially</h3>
                <p className="text-sm text-gray-600">250 points for social media shares</p>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-lg font-semibold text-blue-800">100 Points = 10 Tender Views</p>
              <p className="text-sm text-gray-600 mt-2">Save your points and use them anytime!</p>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                View Tenders
              </CardTitle>
              <CardDescription>
                Access detailed tender information and requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Redeem your points for tender views anytime. Points never expire!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Earn Points
              </CardTitle>
              <CardDescription>
                Multiple ways to earn points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                • Watch 10 ads = 100 points
                <br />
                • Sign up = 50 points
                <br />
                • Referral = 500 points
                <br />
                • Social share = 1000 points
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Rewards Program
              </CardTitle>
              <CardDescription>
                Unlock premium features and benefits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Save points for later use and access exclusive tender opportunities
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Banner Ad */}
        <div className="w-full bg-blue-100 p-4 text-center rounded-lg mb-16">
          <p className="text-sm text-blue-800">Advertisement Space</p>
        </div>

        {/* Newsletter Signup */}
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="h-6 w-6 text-blue-500" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Stay Updated
            </h2>
          </div>
          <p className="text-gray-600 mb-6">
            Subscribe to our newsletter for the latest tender opportunities and industry insights.
          </p>
          <form onSubmit={handleNewsletterSignup} className="flex gap-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Your Account
          </Button>
          <p className="mt-4 text-sm text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/auth")}
              className="text-blue-600 hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GetStarted;