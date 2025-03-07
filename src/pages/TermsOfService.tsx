import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
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
          <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p>
                Welcome to Tenderzville, a platform dedicated to helping Kenyan businesses find and secure tender opportunities. 
                By accessing or using our website, mobile application, or any of our services, you agree to be bound by these 
                Terms of Service ("Terms"). Please read these Terms carefully before using our services.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">2. Definitions</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>"Tenderzville"</strong> refers to the tender finder and organizer platform.</li>
                <li><strong>"User"</strong> refers to any individual or entity that accesses or uses the Services.</li>
                <li><strong>"Supplier"</strong> refers to a User who seeks tender opportunities.</li>
                <li><strong>"Service Provider"</strong> refers to a User who offers services related to tender applications.</li>
                <li><strong>"Services"</strong> refers to all services, features, content, applications, and products offered by Tenderzville.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <p>
                To access most features of our platform, you must register and create an account. You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Providing accurate, current, and complete information during registration</li>
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">4. Platform Usage</h2>
              <p>As a User of Tenderzville, you agree to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Use the platform solely for lawful purposes and in accordance with these Terms</li>
                <li>Not use the platform in any way that could damage, disable, overburden, or impair the platform</li>
                <li>Not attempt to gain unauthorized access to any part of the platform</li>
                <li>Not use automated systems (bots, scripts, etc.) to access or interact with the platform</li>
                <li>Not engage in any activity that interferes with or disrupts the platform</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">5. Service Providers</h2>
              <p>If you register as a Service Provider, you additionally agree to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Provide accurate information about your services, qualifications, and expertise</li>
                <li>Deliver services as described in your profile and agreed with Suppliers</li>
                <li>Maintain appropriate professional standards in all communications and transactions</li>
                <li>Comply with all applicable laws and regulations related to your professional services</li>
                <li>Not misrepresent your qualifications, experience, or ability to provide services</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">6. User Content</h2>
              <p>
                Users may post content on the platform, including profile information, messages, and reviews. You retain ownership 
                of your content, but grant Tenderzville a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, 
                adapt, publish, and display such content in connection with providing and promoting the Services.
              </p>
              <p className="mt-2">
                You are solely responsible for your content and agree not to post content that:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Is false, misleading, or deceptive</li>
                <li>Is defamatory, obscene, offensive, or harmful</li>
                <li>Infringes on any third party's intellectual property rights</li>
                <li>Violates any law, regulation, or third-party rights</li>
                <li>Contains viruses, malware, or any harmful code</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">7. Tender Information</h2>
              <p>
                Tenderzville aggregates tender information from various public sources. While we strive to provide accurate and 
                up-to-date information, we do not guarantee the accuracy, completeness, or reliability of any tender information. 
                Users should independently verify all tender details before taking any action.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">8. Intellectual Property</h2>
              <p>
                The Tenderzville platform, including its design, logos, software, and content created by Tenderzville, is protected 
                by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease 
                any part of our Services without our explicit permission.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Tenderzville shall not be liable for any indirect, incidental, special, 
                consequential, or punitive damages resulting from your use of or inability to use the Services, including but not 
                limited to loss of profits, data, or business opportunities.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">10. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your access to the Services at any time for any reason, including 
                violation of these Terms. Upon termination, your right to use the Services will immediately cease.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">11. Changes to Terms</h2>
              <p>
                We may modify these Terms at any time. We will notify you of significant changes by posting a notice on our platform. 
                Your continued use of the Services after such modifications constitutes your acceptance of the updated Terms.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">12. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of Kenya, without regard to its conflict 
                of law provisions.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">13. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at support@tenderzville.com.
              </p>
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

export default TermsOfService;
