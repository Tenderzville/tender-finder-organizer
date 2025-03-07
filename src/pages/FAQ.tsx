import React from 'react';
import { Navigation } from "@/components/Navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// FAQ item interface
interface FAQItem {
  question: string;
  answer: React.ReactNode;
  category: string;
}

// FAQ data grouped by category
const faqItems: FAQItem[] = [
  // General Questions
  {
    category: "General",
    question: "What is Tenders Ville?",
    answer: (
      <p>
        Tenders Ville is a free platform designed to help businesses, especially youth, women, and persons with disabilities in Kenya, 
        find and secure government procurement opportunities. We aggregate tenders from multiple sources into one easy-to-use platform.
      </p>
    )
  },
  {
    category: "General",
    question: "Is Tenders Ville free to use?",
    answer: (
      <p>
        Yes, Tenders Ville is completely free for all users. Our mission is to make government procurement opportunities accessible 
        to everyone, particularly those traditionally underrepresented in government contracting.
      </p>
    )
  },
  {
    category: "General",
    question: "Do I need to create an account?",
    answer: (
      <p>
        While you can browse tenders without an account, creating a free account allows you to bookmark tenders, 
        receive notifications, and access additional features like tender tracking and personalized recommendations.
      </p>
    )
  },
  
  // AGPO Questions
  {
    category: "AGPO",
    question: "What is AGPO?",
    answer: (
      <div>
        <p>
          AGPO stands for Access to Government Procurement Opportunities. It's a program established by the Kenyan government 
          that requires 30% of government procurement opportunities to be set aside for enterprises owned by youth, women, and 
          persons with disabilities.
        </p>
        <p className="mt-2">
          This affirmative action program aims to facilitate the participation of these groups in government procurement, 
          fostering their economic empowerment and growth.
        </p>
      </div>
    )
  },
  {
    category: "AGPO",
    question: "How do I qualify for AGPO?",
    answer: (
      <div>
        <p>To qualify for AGPO, your business must be:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>Registered in Kenya</li>
          <li>100% owned by Kenyan citizens</li>
          <li>At least 70% owned by youth (18-35 years), women, or persons with disabilities</li>
        </ul>
        <p className="mt-2">
          You must also obtain an AGPO certificate from the National Treasury. Visit our AGPO page for detailed steps on how to apply.
        </p>
      </div>
    )
  },
  {
    category: "AGPO",
    question: "How do I know if a tender is AGPO-specific?",
    answer: (
      <p>
        On Tenders Ville, AGPO-specific tenders are clearly marked with an "AGPO" badge. You can also use our filters to specifically 
        search for AGPO tenders or visit our dedicated AGPO page to see all available opportunities for youth, women, and PWDs.
      </p>
    )
  },
  
  // Tender Application Questions
  {
    category: "Tender Applications",
    question: "How do I apply for a tender?",
    answer: (
      <div>
        <p>The tender application process typically involves the following steps:</p>
        <ol className="list-decimal ml-6 mt-2">
          <li>Read the tender document carefully to understand requirements</li>
          <li>Prepare all required documentation and certifications</li>
          <li>Complete the tender submission forms</li>
          <li>Pay any applicable fees</li>
          <li>Submit your bid before the deadline using the specified method (online or physical submission)</li>
        </ol>
        <p className="mt-2">
          Each tender has specific instructions that must be followed exactly. Click on any tender to view its details 
          and download the complete tender document.
        </p>
      </div>
    )
  },
  {
    category: "Tender Applications",
    question: "What documents do I need to apply for tenders?",
    answer: (
      <div>
        <p>Common requirements include:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>Business registration certificate</li>
          <li>Tax compliance certificate</li>
          <li>AGPO certificate (for AGPO tenders)</li>
          <li>Company profile</li>
          <li>Audited financial statements</li>
          <li>CVs of key personnel</li>
          <li>Proof of similar work experience</li>
          <li>Bid security (where applicable)</li>
        </ul>
        <p className="mt-2">
          Specific requirements vary by tender, so always check the tender document for the complete list.
        </p>
      </div>
    )
  },
  
  // Platform Features
  {
    category: "Platform Features",
    question: "How do I save a tender for later?",
    answer: (
      <p>
        When viewing a tender, click the "Save" or bookmark button to add it to your saved tenders. You can access all your 
        saved tenders from your profile dashboard. This feature is only available to registered users.
      </p>
    )
  },
  {
    category: "Platform Features",
    question: "Can I get notifications for new tenders?",
    answer: (
      <p>
        Yes, registered users can receive notifications about new tenders that match their interests. You can customize your 
        notification preferences in your profile settings to receive alerts via email, browser notifications, or SMS.
      </p>
    )
  },
  {
    category: "Platform Features",
    question: "What happens when a tender deadline is approaching?",
    answer: (
      <p>
        For saved tenders, you'll receive a reminder notification 3 days before the deadline. This helps ensure you don't 
        miss important submission dates. You can adjust reminder settings in your notification preferences.
      </p>
    )
  },
  
  // Technical Support
  {
    category: "Technical Support",
    question: "How do I report an issue with the platform?",
    answer: (
      <p>
        If you encounter any technical issues, please email us at support@tendersville.co.ke or use the 
        "Report an Issue" option in your profile menu. Please include details about the problem and steps to reproduce it.
      </p>
    )
  },
  {
    category: "Technical Support",
    question: "Is my data secure on Tenders Ville?",
    answer: (
      <p>
        Yes, we take data security seriously. All user data is encrypted and stored securely. We never share your personal 
        information with third parties without your consent. For more details, please review our Privacy Policy.
      </p>
    )
  }
];

// Group FAQs by category
const groupedFAQs = faqItems.reduce((acc: Record<string, FAQItem[]>, item) => {
  if (!acc[item.category]) {
    acc[item.category] = [];
  }
  acc[item.category].push(item);
  return acc;
}, {});

export const FAQ: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Frequently Asked Questions
          </h1>
          <p className="text-center text-gray-600 mb-12">
            Find answers to common questions about Tenders Ville and the tender application process
          </p>
          
          {/* FAQ categories */}
          {Object.entries(groupedFAQs).map(([category, items]) => (
            <div key={category} className="mb-10">
              <h2 className="text-xl font-semibold mb-4 text-primary">{category}</h2>
              
              <Accordion type="single" collapsible className="w-full">
                {items.map((item, index) => (
                  <AccordionItem key={index} value={`${category}-${index}`}>
                    <AccordionTrigger className="text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-gray-700 prose prose-sm max-w-none">
                        {item.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
          
          <div className="mt-12 p-6 bg-blue-50 rounded-xl">
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              Still have questions?
            </h3>
            <p className="text-blue-700 mb-4">
              We're here to help! Contact our support team and we'll get back to you as soon as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="mailto:support@tendersville.co.ke" 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Email Support
              </a>
              <a 
                href="tel:+254712345678" 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-primary hover:bg-gray-100 border border-gray-300 h-10 px-4 py-2"
              >
                Call Support: +254 712 345 678
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
