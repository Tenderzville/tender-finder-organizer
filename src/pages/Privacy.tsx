
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
        
        <h2>1. Introduction</h2>
        <p>
          TenderConnect ("we", "our", or "us") respects your privacy and is committed to protecting your personal data.
          This privacy policy explains how we collect, use, process, and share your information,
          including personal data, when you use our application ("Service").
        </p>
        <p>
          Please read this privacy policy carefully to understand our practices regarding your personal data and how
          we will treat it. If you do not agree with our policies and practices, your choice is not to use our Service.
        </p>
        
        <h2>2. Information We Collect</h2>
        <p>We collect several types of information from and about users of our Service, including:</p>
        <ul>
          <li><strong>User-provided Information:</strong> This includes registration information (email, name, business details), profile data, and any other information you provide when using our services.</li>
          <li><strong>Business Information:</strong> Details about your business including registration numbers, AGPO certificates, tax compliance information, and other qualification documents.</li>
          <li><strong>Account Credentials:</strong> Login information required to authenticate your identity and provide access to the Service.</li>
          <li><strong>Tender Application Data:</strong> Information related to tenders you've applied for or shown interest in.</li>
          <li><strong>Automatically Collected Information:</strong> This includes device information, log data, usage analytics, and API access tokens.</li>
          <li><strong>Location Information:</strong> With your consent, we collect and process information about your location to provide location-based services.</li>
          <li><strong>Communication Data:</strong> Messages, feedback, and other content you send through our platform.</li>
        </ul>
        
        <h2>3. How We Use Your Information</h2>
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
          <li>To process your tender applications</li>
          <li>To facilitate networking with potential business partners</li>
          <li>To provide personalized tender alerts based on your preferences</li>
          <li>To calculate and manage your points in our rewards system</li>
          <li>To verify your eligibility for specific tender categories</li>
        </ul>
        
        <h2>4. Points System Usage</h2>
        <p>
          Our Service includes a points-based reward system. We collect and use data about your activities to:
        </p>
        <ul>
          <li>Award points for specific actions such as sharing content or completing your profile</li>
          <li>Track your point accumulation and redemption history</li>
          <li>Determine eligibility for premium tender opportunities based on point thresholds</li>
          <li>Analyze engagement patterns to improve the reward structure</li>
        </ul>
        <p>
          Points data is stored securely within our system and is associated with your user profile.
        </p>
        
        <h2>5. Advertising and Analytics</h2>
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
        
        <h2>6. Social Media Integration</h2>
        <p>
          Our Service integrates with various social media platforms (Twitter, Telegram, LinkedIn, Facebook)
          to allow you to share content and receive notifications. When you connect your social media accounts:
        </p>
        <ul>
          <li>We may collect your social media identifiers to enable direct messaging</li>
          <li>We process sharing actions to award points in our reward system</li>
          <li>We maintain records of tender opportunities you've shared</li>
          <li>We may send tender alerts to your connected accounts with your permission</li>
        </ul>
        <p>
          Each social media platform has its own privacy policy governing how they handle your data.
          We recommend reviewing these policies for any platform you connect to our Service.
        </p>
        
        <h2>7. Data Sharing and Disclosure</h2>
        <p>We may share your personal information with:</p>
        <ul>
          <li><strong>Service Providers:</strong> We engage trusted third parties to perform services on our behalf, who may have access to your personal information.</li>
          <li><strong>Business Partners:</strong> With your consent, we may share your information with business partners for collaborative tender applications.</li>
          <li><strong>Legal Requirements:</strong> We may disclose your information if required by law or in response to valid requests by public authorities.</li>
          <li><strong>Business Transfers:</strong> In connection with any merger, sale of company assets, financing, or acquisition, your data may be transferred.</li>
          <li><strong>With Your Consent:</strong> We may share your information for any other purpose disclosed by us when you provide the information.</li>
        </ul>
        
        <h2>8. Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal data against
          accidental or unlawful destruction, loss, alteration, unauthorized disclosure or access.
          However, no method of transmission over the Internet or method of electronic storage is 100% secure.
        </p>
        
        <h2>9. Data Retention</h2>
        <p>
          We will retain your personal data only for as long as is necessary for the purposes set out in this policy.
          We will retain and use your data to the extent necessary to comply with our legal obligations,
          resolve disputes, and enforce our policies.
        </p>
        
        <h2>10. Your Data Rights</h2>
        <p>You have the following rights regarding your personal data:</p>
        <ul>
          <li><strong>Access:</strong> The right to request copies of your personal data</li>
          <li><strong>Rectification:</strong> The right to request that we correct inaccurate data</li>
          <li><strong>Erasure:</strong> The right to request deletion of your data in certain circumstances</li>
          <li><strong>Restriction:</strong> The right to request we restrict processing of your data</li>
          <li><strong>Data Portability:</strong> The right to receive your data in a structured, machine-readable format</li>
          <li><strong>Objection:</strong> The right to object to our processing of your data</li>
          <li><strong>Withdrawing Consent:</strong> The right to withdraw consent at any time where we rely on consent to process your data</li>
        </ul>
        <p>
          To exercise any of these rights, please contact us at privacy@tenderconnect.app.
        </p>
        
        <h2>11. Children's Privacy</h2>
        <p>
          Our service does not address anyone under the age of 18. We do not knowingly collect 
          personally identifiable information from children under 18. If we discover that a child 
          under 18 has provided us with personal information, we immediately delete this information.
        </p>
        
        <h2>12. International Data Transfers</h2>
        <p>
          Your information may be transferred to, and maintained on, computers located outside of your 
          state, province, country or other governmental jurisdiction where the data protection laws may 
          differ. If you are located outside Kenya and choose to provide information to us, please note 
          that we transfer the data to Kenya and process it there.
        </p>
        
        <h2>13. Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by
          posting the new Privacy Policy on this page and updating the "Last Updated" date.
          You are advised to review this Privacy Policy periodically for any changes. Changes 
          to this Privacy Policy are effective when they are posted on this page.
        </p>
        
        <h2>14. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or our data practices, please contact us at:
          <br />
          Email: privacy@tenderconnect.app
          <br />
          Physical Address: Nairobi, Kenya
          <br />
          Phone: +254 700 000000
        </p>
      </div>
    </div>
  );
};

export default PrivacyPage;
