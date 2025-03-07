import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container max-w-4xl py-8 px-4 mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 flex items-center gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p>
                Tenderzville ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our tender finder and organizer platform ("Platform").
              </p>
              <p className="mt-2">
                Please read this Privacy Policy carefully. By accessing or using our Platform, you acknowledge that you have read, 
                understood, and agree to be bound by all the terms of this Privacy Policy.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
              <p>We may collect the following types of information:</p>
              
              <h3 className="text-lg font-medium mt-4 mb-2">2.1 Personal Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account information: name, email address, phone number, business details</li>
                <li>Profile information: professional qualifications, expertise, services offered</li>
                <li>Communication data: messages exchanged with other users through our Platform</li>
                <li>Transaction information: details of services arranged through our Platform</li>
                <li>Payment information: financial information necessary for processing payments</li>
              </ul>
              
              <h3 className="text-lg font-medium mt-4 mb-2">2.2 Usage Data</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Log data: IP address, browser type, pages visited, time and date of visit</li>
                <li>Device information: device type, operating system, unique device identifiers</li>
                <li>Location data: general location information based on IP address</li>
                <li>Cookies and similar technologies: information collected through cookies and web beacons</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
              <p>We use the information we collect for various purposes, including to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Provide, maintain, and improve our Platform and services</li>
                <li>Create and manage your account and authenticate users</li>
                <li>Facilitate communication between Suppliers and Service Providers</li>
                <li>Send you notifications about tender opportunities matching your preferences</li>
                <li>Process transactions and send related information</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our Platform</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                <li>Protect the rights, property, and safety of Tenderzville, our users, and others</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">4. Sharing Your Information</h2>
              <p>We may share your information in the following circumstances:</p>
              
              <h3 className="text-lg font-medium mt-4 mb-2">4.1 With Other Users</h3>
              <p>
                Your profile information, such as your name, business details, and professional qualifications, may be visible to 
                other users of the Platform. Messages you send to other users through our Platform will be shared with the intended recipients.
              </p>
              
              <h3 className="text-lg font-medium mt-4 mb-2">4.2 With Service Providers</h3>
              <p>
                We may share your information with third-party vendors, consultants, and other service providers who need access to 
                such information to perform services on our behalf, such as hosting services, data analysis, payment processing, and 
                customer service.
              </p>
              
              <h3 className="text-lg font-medium mt-4 mb-2">4.3 For Legal Reasons</h3>
              <p>
                We may disclose your information if we believe in good faith that such disclosure is necessary to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Comply with relevant laws, regulations, or legal processes</li>
                <li>Protect the rights, property, and safety of Tenderzville, our users, or others</li>
                <li>Detect, investigate, and prevent fraud or security issues</li>
                <li>Enforce our Terms of Service, including investigating potential violations</li>
              </ul>
              
              <h3 className="text-lg font-medium mt-4 mb-2">4.4 With Your Consent</h3>
              <p>
                We may share your information with third parties when you have given us your consent to do so.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect the security of your information. However, 
                please be aware that no method of transmission over the Internet or method of electronic storage is 100% secure. 
                Therefore, while we strive to use commercially acceptable means to protect your personal information, we cannot 
                guarantee its absolute security.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
              <p>
                We will retain your information for as long as your account is active or as needed to provide you with our services. 
                We will also retain and use your information as necessary to comply with our legal obligations, resolve disputes, 
                and enforce our agreements.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
              <p>
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Access to your personal information</li>
                <li>Correction of inaccurate or incomplete information</li>
                <li>Deletion of your personal information</li>
                <li>Restriction of processing of your personal information</li>
                <li>Data portability</li>
                <li>Objection to processing of your personal information</li>
                <li>Withdrawal of consent at any time, where processing is based on your consent</li>
              </ul>
              <p className="mt-2">
                To exercise these rights, please contact us at privacy@tenderzville.com.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
              <p>
                Our Platform is not intended for children under the age of 18, and we do not knowingly collect personal information 
                from children under 18. If you are a parent or guardian and believe we may have collected information from your child, 
                please contact us immediately.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">9. International Data Transfers</h2>
              <p>
                Your information may be transferred to, and maintained on, computers located outside of your state, province, country, 
                or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction. By using 
                our Platform, you consent to the transfer of your information to these locations.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">10. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
                on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="mt-2">
                <p>Email: privacy@tenderzville.com</p>
                <p>Phone: +254 XXX XXX XXX</p>
                <p>Address: Nairobi, Kenya</p>
              </div>
            </section>
            
            <div className="pt-4 text-sm text-gray-500">
              <p>Last updated: March 7, 2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
