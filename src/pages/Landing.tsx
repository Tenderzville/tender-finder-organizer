import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Find and Track Tenders Easily
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Access government and private sector tenders all in one place. Get notifications for new opportunities that match your business profile.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button 
            size="lg"
            onClick={() => navigate("/dashboard")}
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;