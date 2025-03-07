
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
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TermsPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <div className="prose dark:prose-invert max-w-none">
        <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>
          Welcome to TenderConnect. These Terms of Service ("Terms") govern your access to and use of the TenderConnect application
          and services ("Service"). Please read these Terms carefully before using our Service.
        </p>
        <p>
          By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the Terms, 
          you may not access the Service.
        </p>
        
        <h2>2. Description of Service</h2>
        <p>
          TenderConnect is a comprehensive tender management system designed to help businesses, particularly small and medium 
          enterprises (SMEs), access and qualify for procurement opportunities in Kenya. The service includes tender discovery, 
          qualification assessment, collaboration opportunities, and personalized alerts.
        </p>
        
        <h2>3. Account Registration and Security</h2>
        <p>
          To access certain features of our Service, you may be required to register for an account. You agree to provide accurate,
          current, and complete information during the registration process and to update such information to keep it accurate,
          current, and complete.
        </p>
        <p>
          You are responsible for safeguarding the password that you use to access the Service and for any activities or actions
          under your password. We encourage you to use "strong" passwords (passwords that use a combination of upper and lower case
          letters, numbers, and symbols) with your account.
        </p>
        <p>
          You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any
          breach of security or unauthorized use of your account.
        </p>
        
        <h2>4. User Conduct</h2>
        <p>You agree not to engage in any of the following prohibited activities:</p>
        <ul>
          <li>Using the Service for any illegal purpose or in violation of any local, state, national, or international law</li>
          <li>Violating or infringing other people's intellectual property, privacy, publicity, or other legal rights</li>
          <li>Transmitting viruses, malware, or other types of malicious code</li>
          <li>Attempting to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running the Service</li>
          <li>Taking any action that imposes an unreasonable or disproportionately large load on our infrastructure</li>
          <li>Collecting or harvesting any personally identifiable information from the Service</li>
          <li>Impersonating another person or otherwise misrepresenting your affiliation with a person or entity</li>
          <li>Using automated means to access the Service without our authorization</li>
        </ul>
        
        <h2>5. Points System and Rewards</h2>
        <p>
          Our Service includes a points-based reward system that allows users to earn points through various activities including
          sharing content, completing profile information, and engaging with tenders.
        </p>
        <p>
          Points have no monetary value and cannot be exchanged for cash. Points may be used to access premium features or
          tender opportunities as determined by TenderConnect.
        </p>
        <p>
          TenderConnect reserves the right to modify, suspend, or terminate the points system at any time. We may adjust point values,
          change the activities that earn points, or alter the benefits associated with points.
        </p>
        <p>
          Any attempt to manipulate the points system through fraudulent activities will result in immediate account termination
          and forfeiture of all accumulated points.
        </p>
        
        <h2>6. Tender Information</h2>
        <p>
          While we strive to provide accurate and timely information about tenders, we cannot guarantee the accuracy, completeness,
          or timeliness of the information. The tender information provided through our Service is collected from various public sources
          and may be subject to change without notice.
        </p>
        <p>
          Users are encouraged to verify tender information from official sources before making any decisions or taking any actions.
          TenderConnect shall not be liable for any loss or damage arising from reliance on tender information provided through our Service.
        </p>
        
        <h2>7. Social Media Integration</h2>
        <p>
          Our Service allows you to connect and share content through various social media platforms. By using these features, you
          grant us permission to access your relevant social media account information and to post content on your behalf
          as specified in the feature.
        </p>
        <p>
          You acknowledge that your use of social media platforms is governed by their respective terms of service and privacy policies.
          We recommend reviewing these documents for any platform you connect to our Service.
        </p>
        
        <h2>8. Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are and will remain the exclusive property of TenderConnect
          and its licensors. The Service is protected by copyright, trademark, and other laws of both Kenya and foreign countries.
        </p>
        <p>
          Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent
          of TenderConnect.
        </p>
        
        <h2>9. User Content</h2>
        <p>
          Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or
          other material ("Content"). You are responsible for the Content that you post on or through the Service, including its
          legality, reliability, and appropriateness.
        </p>
        <p>
          By posting Content on or through the Service, you represent and warrant that: (i) the Content is yours (you own it) and/or you
          have the right to use it and the right to grant us the rights and license as provided in these Terms, and (ii) that the posting
          of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or
          any other rights of any person or entity.
        </p>
        <p>
          We reserve the right to terminate the account of any user found to be infringing on a copyright.
        </p>
        
        <h2>10. Limitation of Liability</h2>
        <p>
          In no event shall TenderConnect, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for
          any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data,
          use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
        </p>
        
        <h2>11. Termination</h2>
        <p>
          We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability,
          under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
        </p>
        <p>
          If you wish to terminate your account, you may simply discontinue using the Service or contact us to request account deletion.
        </p>
        
        <h2>12. Changes to Terms</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material
          change will be determined at our sole discretion.
        </p>
        <p>
          By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
          If you do not agree to the new terms, please stop using the Service.
        </p>
        
        <h2>13. Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws of Kenya, without regard to its conflict of law provisions.
        </p>
        <p>
          Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision
          of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
        </p>
        
        <h2>14. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at:
          <br />
          Email: legal@tenderconnect.app
          <br />
          Physical Address: Nairobi, Kenya
          <br />
          Phone: +254 700 000000
        </p>
      </div>
    </div>
  );
};

export default TermsPage;
