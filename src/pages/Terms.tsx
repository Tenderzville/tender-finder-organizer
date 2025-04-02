
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Shield } from 'lucide-react';

const TermsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-muted-foreground mb-8">Last updated: September 1, 2023</p>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-3">
            Welcome to TenderConnect ("we," "our," or "us"). By accessing or using our platform,
            you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.
          </p>
          <p>
            If you do not agree to these Terms, you may not access or use our services.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Services</h2>
          <p className="mb-3">
            TenderConnect provides a platform connecting businesses with tender opportunities in Kenya, 
            with a focus on Access to Government Procurement Opportunities (AGPO). Our services include 
            but are not limited to:
          </p>
          <ul className="list-disc pl-5 mb-3">
            <li>Tender notifications and alerts</li>
            <li>Document preparation assistance</li>
            <li>Partner matching for consortium bidding</li>
            <li>Tender qualification assessment</li>
            <li>Educational resources on the procurement process</li>
          </ul>
          <p>
            We reserve the right to modify or discontinue any aspect of our services at any time.
          </p>
        </section>
        
        <div className="bg-primary-foreground border border-primary/20 rounded-lg p-4 my-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Security & Data Protection</h3>
          </div>
          <p className="text-sm">
            We implement reasonable security measures to protect your data and maintain the 
            integrity of our platform. However, no system is completely secure, and we cannot 
            guarantee absolute security. For more information on how we handle your data, 
            please refer to our <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
          </p>
        </div>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <p className="mb-3">
            To access certain features of our platform, you must create an account. You agree to:
          </p>
          <ul className="list-disc pl-5 mb-3">
            <li>Provide accurate and complete information</li>
            <li>Maintain the confidentiality of your account credentials</li>
            <li>Accept responsibility for all activities that occur under your account</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms or 
            engage in inappropriate or unlawful behavior.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
          <p className="mb-3">
            All content on our platform, including but not limited to text, graphics, logos, and software,
            is the property of TenderConnect or its licensors and is protected by intellectual property laws.
          </p>
          <p>
            You may not reproduce, distribute, modify, or create derivative works of any content without 
            our explicit written permission.
          </p>
        </section>
      </div>
      
      <div className="mt-8 flex justify-between">
        <Button variant="outline" asChild>
          <Link to="/">Back to Home</Link>
        </Button>
        <Button asChild>
          <Link to="/privacy">Privacy Policy</Link>
        </Button>
      </div>
    </div>
  );
};

export default TermsPage;
