
import React from "react";
import { Navigation } from "@/components/Navigation";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
          
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mt-6 mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide directly, including account information, preferences, 
              and interactions with the service. We also automatically collect usage data and device information.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">2. How We Use Your Information</h2>
            <p>
              We use your information to provide and improve our services, process transactions, 
              send notifications, and personalize your experience. We may also use your data to 
              develop new services and features.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">3. Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share information with service providers, 
              for legal reasons, or in connection with business transfers. When you rate service providers, 
              your feedback may be visible to other users.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">4. Data Security</h2>
            <p>
              We implement reasonable security measures to protect your information. However, no method 
              of transmission over the internet is 100% secure. We encrypt sensitive information and 
              regularly review our security practices.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">5. Your Rights and Choices</h2>
            <p>
              You may access, correct, or delete your personal information by accessing your account 
              settings. You can also opt-out of receiving communications from us.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">6. Cookies and Similar Technologies</h2>
            <p>
              We use cookies and similar technologies to enhance your experience, understand usage patterns, 
              and deliver personalized content. You can control cookie settings through your browser.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">7. Data Retention</h2>
            <p>
              We retain your information for as long as needed to provide services and comply with legal 
              obligations. You may request deletion of your data at any time.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">8. Changes to Privacy Policy</h2>
            <p>
              We may update this policy periodically. We will notify you of significant changes by posting 
              the new policy on this page.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">9. Contact Us</h2>
            <p>
              If you have questions about this policy, please contact us at privacy@tendersville.com.
            </p>
          </div>
          
          <Separator className="my-8" />
          
          <div className="flex justify-between">
            <Button variant="outline" asChild>
              <Link to="/terms">View Terms of Service</Link>
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

export default PrivacyPage;
