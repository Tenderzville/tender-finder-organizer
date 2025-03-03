
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, Users, Building, Handshake, AlertTriangle, PlusCircle } from "lucide-react";
import { ConsortiumsList } from "@/components/collaboration/ConsortiumsList";
import { SubcontractingOpportunities } from "@/components/collaboration/SubcontractingOpportunities";
import { FindPartners } from "@/components/collaboration/FindPartners";

export const SupplierCollaborationHub = () => {
  const [activeTab, setActiveTab] = useState("consortiums");
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center">
              <Handshake className="mr-2 h-5 w-5 text-primary" />
              Supplier Collaboration Hub
            </CardTitle>
            <CardDescription>
              Join forces with other suppliers to bid on larger tenders or find subcontracting opportunities
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            New Feature
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>About Supplier Collaboration</AlertTitle>
          <AlertDescription>
            Small and medium-sized enterprises can increase their competitiveness by forming 
            consortiums or engaging in subcontracting arrangements to bid on larger tenders.
          </AlertDescription>
        </Alert>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="consortiums" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Consortiums
            </TabsTrigger>
            <TabsTrigger value="subcontracting" className="flex items-center">
              <Building className="mr-2 h-4 w-4" />
              Subcontracting
            </TabsTrigger>
            <TabsTrigger value="find-partners" className="flex items-center">
              <Handshake className="mr-2 h-4 w-4" />
              Find Partners
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="consortiums">
            <ConsortiumsList />
          </TabsContent>
          
          <TabsContent value="subcontracting">
            <SubcontractingOpportunities />
          </TabsContent>
          
          <TabsContent value="find-partners">
            <FindPartners />
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <p className="text-xs text-gray-500">
          Consortium formation and subcontracting are subject to local procurement laws.
        </p>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Create New Collaboration
        </Button>
      </CardFooter>
    </Card>
  );
};
