import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    "Access to government and private sector tenders",
    "Real-time tender notifications",
    "Automated tender matching",
    "Comprehensive tender analytics",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Your Gateway to African Tenders
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Access and track government and private sector tenders across Kenya and Africa. 
            Stay ahead with real-time updates and automated matching.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg"
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/tenders")}
              className="text-lg"
            >
              Browse Tenders
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Why Choose Tenders Ville?
            </h2>
            <ul className="space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mr-3 mt-1" />
                  <span className="text-lg text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Get Started in Minutes
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">1. Create an Account</h4>
                <p className="text-gray-600">
                  Sign up with your email to access all features
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">2. Set Your Preferences</h4>
                <p className="text-gray-600">
                  Tell us what types of tenders interest you
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">3. Start Receiving Matches</h4>
                <p className="text-gray-600">
                  Get notified about relevant opportunities
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;