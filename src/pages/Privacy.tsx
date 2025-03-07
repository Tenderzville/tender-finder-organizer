
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PrivacyPage = () => {
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
      
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="prose dark:prose-invert max-w-none">
        <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
        
        <h2>Introduction</h2>
        <p>
          TenderConnect respects your privacy and is committed to protecting your personal data.
          This privacy policy explains how we collect, use, process, and share your information,
          including personal data, when you use our application.
        </p>
        
        <h2>Information We Collect</h2>
        <p>We collect the following types of information:</p>
        <ul>
          <li><strong>User-provided Information:</strong> This includes registration information (email, name, business details), profile data, and any other information you provide when using our services.</li>
          <li><strong>Automatically Collected Information:</strong> This includes device information, log data, and usage analytics.</li>
          <li><strong>Location Information:</strong> With your consent, we collect and process information about your location to provide location-based services.</li>
        </ul>
        
        <h2>How We Use Your Information</h2>
        <p>We use your information for the following purposes:</p>
        <ul>
          <li>To provide and maintain our services</li>
          <li>To notify you about changes to our services</li>
          <li>To allow you to participate in interactive features</li>
          <li>To provide customer support</li>
          <li>To gather analysis to improve our services</li>
          <li>To monitor the usage of our services</li>
          <li>To detect, prevent and address technical issues</li>
          <li>To match you with relevant tender opportunities</li>
        </ul>
        
        <h2>Advertising and Analytics</h2>
        <p>
          Our app uses AdMob to display advertisements. AdMob may collect and process data about you, 
          including your device identifier, location, and other usage data. To learn more about 
          how Google uses this data, visit Google's privacy policy at 
          <a href="https://policies.google.com/privacy"> Google Privacy & Terms</a>.
        </p>
        <p>
          We also use analytics services to help us understand how users engage with our app. 
          These services may collect information sent by your device or our app, including 
          device identifiers, location, and app usage data.
        </p>
        
        <h2>Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal data against 
          accidental or unlawful destruction, loss, alteration, unauthorized disclosure or access.
          However, no method of transmission over the Internet or method of electronic storage is 100% secure.
        </p>
        
        <h2>Data Retention</h2>
        <p>
          We will retain your personal data only for as long as is necessary for the purposes set out in this policy.
          We will retain and use your data to the extent necessary to comply with our legal obligations,
          resolve disputes, and enforce our policies.
        </p>
        
        <h2>Your Data Rights</h2>
        <p>You have the following rights:</p>
        <ul>
          <li>The right to access, update or delete your information</li>
          <li>The right to rectification</li>
          <li>The right to object</li>
          <li>The right of restriction</li>
          <li>The right to data portability</li>
          <li>The right to withdraw consent</li>
        </ul>
        
        <h2>Children's Privacy</h2>
        <p>
          Our service does not address anyone under the age of 13. We do not knowingly collect 
          personally identifiable information from children under 13. If we discover that a child 
          under 13 has provided us with personal information, we immediately delete this information.
        </p>
        
        <h2>Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by 
          posting the new Privacy Policy on this page and updating the "Last Updated" date.
        </p>
        
        <h2>Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at:
          <br />
          Email: privacy@tenderconnect.app
        </p>
      </div>
    </div>
  );
};

export default PrivacyPage;
