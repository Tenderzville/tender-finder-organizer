
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Gavel, Shield, FileText, Calculator, Search, Info, PlusCircle } from "lucide-react";
import { Navigation } from "@/components/Navigation";

const ServiceProviderCard = ({
  type,
  icon: Icon,
  isEmpty = true,
}: {
  type: string;
  icon: React.ElementType;
  isEmpty?: boolean;
}) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {type}
        </CardTitle>
        <CardDescription>Find qualified {type.toLowerCase()} to assist with your tenders</CardDescription>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No service providers available yet</p>
            <Button variant="outline" size="sm" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Register as a Provider
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

const ServicesPage = () => {
  const [activeTab, setActiveTab] = useState("legal");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tender Support Services</h1>
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            List Your Services
          </Button>
        </div>
        
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Connect with specialized service providers to help with your tender applications. All providers are independent entities and not directly affiliated with Tenders Ville.
          </AlertDescription>
        </Alert>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search for service providers..." className="pl-10" />
            </div>
          </div>
          
          <Separator className="mb-6" />
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="legal" className="gap-2">
                <Gavel className="h-4 w-4" />
                Legal Services
              </TabsTrigger>
              <TabsTrigger value="financial" className="gap-2">
                <Shield className="h-4 w-4" />
                Bid Bonds & Insurance
              </TabsTrigger>
              <TabsTrigger value="documentation" className="gap-2">
                <FileText className="h-4 w-4" />
                Tender Writing
              </TabsTrigger>
              <TabsTrigger value="consulting" className="gap-2">
                <Calculator className="h-4 w-4" />
                BQ Experts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="legal">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Legal Service Providers</h2>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Specialties</SelectItem>
                        <SelectItem value="contract">Contract Law</SelectItem>
                        <SelectItem value="procurement">Procurement Law</SelectItem>
                        <SelectItem value="dispute">Dispute Resolution</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ServiceProviderCard type="Legal Advisors" icon={Gavel} />
              </div>
            </TabsContent>
            
            <TabsContent value="financial">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Bid Bond & Insurance Providers</h2>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="bank">Banks</SelectItem>
                        <SelectItem value="insurance">Insurance Companies</SelectItem>
                        <SelectItem value="microfinance">Microfinance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ServiceProviderCard type="Bid Bond Providers" icon={Shield} />
                <ServiceProviderCard type="Insurance Providers" icon={Shield} />
              </div>
            </TabsContent>
            
            <TabsContent value="documentation">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Tender Writing Services</h2>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by sector" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sectors</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="ict">ICT</SelectItem>
                        <SelectItem value="medical">Medical</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ServiceProviderCard type="Tender Writing Specialists" icon={FileText} />
              </div>
            </TabsContent>
            
            <TabsContent value="consulting">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">BQ and Technical Experts</h2>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by expertise" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Expertise</SelectItem>
                        <SelectItem value="architecture">Architecture</SelectItem>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="quantity">Quantity Surveying</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ServiceProviderCard type="BQ Experts" icon={Calculator} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
