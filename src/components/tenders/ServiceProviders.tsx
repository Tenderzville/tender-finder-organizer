
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, PlusCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ServiceProvider {
  id: string;
  name: string;
  category: string;
  services: string[];
  website?: string;
  contactInfo: string;
  feeStructure: string;
  specializes: string[];
}

const serviceProviders: ServiceProvider[] = [
  {
    id: "sp1",
    name: "Tender Documentation Services",
    category: "Documentation",
    services: ["Document preparation", "Bid compilation", "Compliance checking"],
    website: "https://example.com/tds",
    contactInfo: "info@tenderdocs.co.ke | +254 700 000000",
    feeStructure: "Free initial consultation, competitive rates based on tender value",
    specializes: ["AGPO documentation", "Financial statements", "Technical proposals"]
  },
  {
    id: "sp2",
    name: "BidBond Solutions",
    category: "Financial",
    services: ["Bid bonds", "Performance guarantees", "Advanced payment guarantees"],
    website: "https://example.com/bidbond",
    contactInfo: "support@bidbond.co.ke | +254 722 000000",
    feeStructure: "Low percentage fees, special rates for AGPO",
    specializes: ["Quick turnaround", "Startup-friendly terms", "No collateral options"]
  },
  {
    id: "sp3",
    name: "Certification Express",
    category: "Compliance",
    services: ["Tax compliance certificates", "Business registration", "AGPO certification"],
    website: "https://example.com/certexpress",
    contactInfo: "help@certexpress.co.ke | +254 733 000000",
    feeStructure: "Free for basic guidance, paid for expedited services",
    specializes: ["Youth registration", "Women enterprise certification", "PWD certification"]
  },
  {
    id: "sp4",
    name: "TenderTech Solutions",
    category: "Technical",
    services: ["Technical specifications", "Engineering designs", "Quality assurance"],
    website: "https://example.com/tendertech",
    contactInfo: "tech@tendertech.co.ke | +254 755 000000",
    feeStructure: "Project-based pricing, discounts for SMEs",
    specializes: ["Construction tenders", "IT procurement", "Medical equipment"]
  },
  {
    id: "sp5",
    name: "BidCoach Mentors",
    category: "Training",
    services: ["Tender response training", "Presentation skills", "Negotiation tactics"],
    website: "https://example.com/bidcoach",
    contactInfo: "learn@bidcoach.co.ke | +254 777 000000",
    feeStructure: "Free webinars, affordable group sessions, premium 1:1 coaching",
    specializes: ["First-time bidders", "AGPO entrepreneurs", "Pitch preparation"]
  }
];

export function ServiceProviders() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Service Providers</CardTitle>
        <CardDescription>
          Connect with service providers who can help you with the tender process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {serviceProviders.map(provider => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </TabsContent>
          
          <TabsContent value="documentation" className="space-y-4">
            {serviceProviders
              .filter(p => p.category === 'Documentation')
              .map(provider => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
          </TabsContent>
          
          <TabsContent value="financial" className="space-y-4">
            {serviceProviders
              .filter(p => p.category === 'Financial')
              .map(provider => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
          </TabsContent>
          
          <TabsContent value="compliance" className="space-y-4">
            {serviceProviders
              .filter(p => p.category === 'Compliance')
              .map(provider => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
          </TabsContent>
          
          <TabsContent value="training" className="space-y-4">
            {serviceProviders
              .filter(p => p.category === 'Training')
              .map(provider => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Suggest Provider
        </Button>
        <Button variant="secondary">Browse All Providers</Button>
      </CardFooter>
    </Card>
  );
}

function ProviderCard({ provider }: { provider: ServiceProvider }) {
  return (
    <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{provider.name}</h3>
          <p className="text-sm text-muted-foreground">{provider.category}</p>
        </div>
        {provider.website && (
          <Button variant="ghost" size="sm" className="h-8" asChild>
            <a href={provider.website} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Website
            </a>
          </Button>
        )}
      </div>
      
      <div className="mt-3">
        <h4 className="text-sm font-medium">Services:</h4>
        <ul className="mt-1 space-y-1">
          {provider.services.map((service, idx) => (
            <li key={idx} className="text-sm flex items-center">
              <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
              {service}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mt-3 text-sm">
        <p><span className="font-medium">Specializes in:</span> {provider.specializes.join(', ')}</p>
        <p className="mt-1"><span className="font-medium">Fee Structure:</span> {provider.feeStructure}</p>
        <p className="mt-1"><span className="font-medium">Contact:</span> {provider.contactInfo}</p>
      </div>
    </div>
  );
}
