import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { User, Shield, Loader2, Filter, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { TenderCard } from '@/components/TenderCard';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import { TenderCardProps } from '@/types/tenderCard';

// Define AGPO categories
const AGPO_CATEGORIES = [
  { id: "youth", name: "Youth", description: "Enterprises owned by youth (18-35 years)" },
  { id: "women", name: "Women", description: "Enterprises owned by women" },
  { id: "pwd", name: "Persons with Disabilities", description: "Enterprises owned by persons with disabilities" }
];

const AgpoTenders = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch AGPO tenders with filtering
  const { data: tenders, isLoading, error, refetch } = useQuery<TenderCardProps[]>({
    queryKey: ['agpo-tenders', selectedCategory],
    queryFn: async () => {
      console.log(`Fetching AGPO tenders with filter: ${selectedCategory || 'all'}`);
      let query = supabase
        .from('tenders')
        .select('id, title, organization, deadline, category, value, location, pointsRequired, tender_url, hasAffirmativeAction, affirmativeActionType, language, shareActions')
        .not('affirmative_action', 'is', null)
        .not('affirmative_action->type', 'eq', 'none');

      // Apply category filter if selected
      if (selectedCategory) {
        query = query.eq('affirmative_action->type', selectedCategory);
      }

      // Order by deadline (most recent first)
      query = query.order('deadline', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching AGPO tenders:", error);
        throw error;
      }

      return data ? (Array.isArray(data) ? data : [data]) : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
      <Navigation />
      <div className="container py-8 px-4 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AGPO Tenders</h1>
            <p className="text-gray-600 mt-1">
              Access to Government Procurement Opportunities for youth, women, and persons with disabilities
            </p>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {selectedCategory ? AGPO_CATEGORIES.find(c => c.id === selectedCategory)?.name : "All Categories"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedCategory(null)}>
                  All Categories
                </DropdownMenuItem>
                {AGPO_CATEGORIES.map(category => (
                  <DropdownMenuItem 
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* AGPO Information Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">About AGPO</h2>
          </div>

          <p className="text-gray-700 mb-4">
            Access to Government Procurement Opportunities (AGPO) is a Kenya government initiative that seeks to enable 
            youth, women, and persons with disabilities to participate in government procurement opportunities. The program 
            aims to empower these groups by allocating 30% of government tenders to enterprises owned by youth, women, and persons with disabilities.
          </p>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="eligibility">
              <AccordionTrigger className="text-left font-medium">
                Eligibility Requirements
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div>
                    <h4 className="font-medium">Youth</h4>
                    <ul className="list-disc pl-6 mt-1 text-gray-700 space-y-1">
                      <li>Age between 18-35 years</li>
                      <li>Registered business enterprise (sole proprietorship, partnership, or company)</li>
                      <li>At least 70% ownership by youth</li>
                      <li>Kenyan citizenship</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium">Women</h4>
                    <ul className="list-disc pl-6 mt-1 text-gray-700 space-y-1">
                      <li>Registered business enterprise (sole proprietorship, partnership, or company)</li>
                      <li>At least 70% ownership by women</li>
                      <li>Kenyan citizenship</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium">Persons with Disabilities</h4>
                    <ul className="list-disc pl-6 mt-1 text-gray-700 space-y-1">
                      <li>Registered business enterprise (sole proprietorship, partnership, or company)</li>
                      <li>At least 70% ownership by persons with disabilities</li>
                      <li>Kenyan citizenship</li>
                      <li>Registration with National Council for Persons with Disabilities</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="certification">
              <AccordionTrigger className="text-left font-medium">
                AGPO Certification Process
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <p className="text-gray-700">
                    To participate in AGPO, eligible businesses must obtain an AGPO certificate by following these steps:
                  </p>
                  <ol className="list-decimal pl-6 text-gray-700 space-y-2">
                    <li>Register your business with the relevant authorities (Business Registration Service)</li>
                    <li>Obtain a KRA PIN certificate</li>
                    <li>Register on the AGPO portal (<a href="https://agpo.go.ke" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">agpo.go.ke</a>)</li>
                    <li>Submit required documentation for verification</li>
                    <li>Upon approval, receive your AGPO certificate</li>
                  </ol>
                  <p className="text-gray-700 mt-2">
                    AGPO certificates are valid for two years and can be renewed upon expiry.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="benefits">
              <AccordionTrigger className="text-left font-medium">
                Benefits of AGPO Registration
              </AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-6 pt-2 text-gray-700 space-y-2">
                  <li>Access to 30% of government procurement opportunities reserved for AGPO</li>
                  <li>Exemption from bid security/tender security requirements</li>
                  <li>Preferential treatment in tender evaluation</li>
                  <li>Access to government procurement-related training and capacity building</li>
                  <li>Prompt payment for goods and services provided (within 30 days)</li>
                  <li>Access to affordable financing through various government initiatives</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="resources">
              <AccordionTrigger className="text-left font-medium">
                Additional Resources
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div>
                    <h4 className="font-medium">Official Websites</h4>
                    <ul className="list-disc pl-6 mt-1 text-gray-700">
                      <li><a href="https://agpo.go.ke" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">AGPO Portal</a></li>
                      <li><a href="https://treasury.go.ke" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">National Treasury</a></li>
                      <li><a href="https://ppra.go.ke" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Public Procurement Regulatory Authority</a></li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium">Contact Information</h4>
                    <p className="text-gray-700 mt-1">
                      AGPO Secretariat<br />
                      National Treasury Building<br />
                      Harambee Avenue, Nairobi<br />
                      Tel: +254 (0)20 2252299<br />
                      Email: info@agpo.go.ke
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Loading State */}
        {isLoading && <Loader2 className="animate-spin h-5 w-5 text-blue-600" />}

        {/* Error Handling */}
        {error && <p className="text-red-600">Error fetching tenders: {error.message}</p>}

        {/* Tenders list */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 font-medium">Error loading tenders. Please try again.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </div>
          ) : tenders && tenders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tenders.map((tender) => (
                <TenderCard 
                  key={tender.id} 
                  id={tender.id} 
                  title={tender.title} 
                  organization={tender.organization} 
                  deadline={tender.deadline} 
                  category={tender.category} 
                  value={tender.value} 
                  location={tender.location} 
                  pointsRequired={tender.pointsRequired} 
                  tender_url={tender.tender_url} 
                  onViewDetails={() => navigate(`/tenders/${tender.id}`)} 
                  hasAffirmativeAction={tender.hasAffirmativeAction} 
                  affirmativeActionType={tender.affirmativeActionType} 
                  language={tender.language} 
                  shareActions={tender.shareActions} 
                  highlightAgpo={true}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600">
                {selectedCategory 
                  ? `No ${AGPO_CATEGORIES.find(c => c.id === selectedCategory)?.name || ''} tenders found. Try selecting a different category.`
                  : "No AGPO tenders found at the moment. Please check back later."}
              </p>
              {selectedCategory && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSelectedCategory(null)}
                >
                  View All AGPO Categories
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple refresh icon component
const RefreshIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export default AgpoTenders;
