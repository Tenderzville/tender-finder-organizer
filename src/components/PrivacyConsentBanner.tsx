
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

export const PrivacyConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  
  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem("privacy-consent");
    if (!hasConsented) {
      setShowBanner(true);
    }
  }, []);
  
  const handleAccept = () => {
    localStorage.setItem("privacy-consent", "true");
    setShowBanner(false);
  };
  
  const handleDecline = () => {
    // In a real app, this would disable all non-essential cookies and tracking
    localStorage.setItem("privacy-consent", "minimal");
    setShowBanner(false);
  };
  
  if (!showBanner) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 bg-opacity-50 backdrop-blur-sm z-50">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Privacy Consent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            We use cookies and process your data to provide our services and show you relevant content.
            We take your privacy seriously and only collect what's necessary to improve your experience.
          </p>
          <p className="text-sm mt-2">
            By clicking "Accept All", you consent to our use of cookies and data processing as described in our{" "}
            <Link to="/privacy" className="text-primary underline">
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleDecline}>
            Accept Essential Only
          </Button>
          <Button onClick={handleAccept}>
            Accept All
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
