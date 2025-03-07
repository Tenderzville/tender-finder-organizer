
import React from "react";
import { Navigation } from "@/components/Navigation";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold mb-6">Terms of Service</h1>
          
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Tenders Ville, you agree to be bound by these Terms of Service. 
              If you do not agree to all of these terms, you may not use our services.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">2. Description of Service</h2>
            <p>
              Tenders Ville provides an online platform connecting businesses with tender opportunities 
              and service providers. We aggregate tender information from various sources but do not 
              guarantee the accuracy, completeness, or validity of any tender listing.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">3. User Accounts</h2>
            <p>
              To access certain features, you may need to register for an account. You are responsible 
              for maintaining the confidentiality of your account information and for all activities 
              under your account.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">4. Service Providers</h2>
            <p>
              Service providers listed on our platform are independent entities not directly affiliated 
              with Tenders Ville. Users engage with these providers at their own risk. User ratings 
              of service providers represent individual opinions and experiences.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">5. User Conduct</h2>
            <p>
              You agree not to use the service for any illegal purposes or to conduct any activity that 
              could damage, disable, or impair the service.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">6. Modifications to Service</h2>
            <p>
              We reserve the right to modify or discontinue the service with or without notice at any time.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">7. Limitation of Liability</h2>
            <p>
              Tenders Ville shall not be liable for any indirect, incidental, special, consequential, or 
              punitive damages resulting from your use or inability to use the service.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">8. Governing Law</h2>
            <p>
              These Terms shall be governed by the laws of Kenya without regard to its conflict of law provisions.
            </p>
          </div>
          
          <Separator className="my-8" />
          
          <div className="flex justify-between">
            <Button variant="outline" asChild>
              <Link to="/privacy">View Privacy Policy</Link>
            </Button>
            <Button asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
