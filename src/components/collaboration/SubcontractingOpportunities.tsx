
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Building, Clock, Briefcase, ArrowRight, MapPin, DollarSign } from "lucide-react";

export const SubcontractingOpportunities = () => {
  const [opportunities] = useState([
    {
      id: 1,
      title: "Electrical Installations for School Construction",
      description: "Looking for electrical contractors to handle installations for a school construction project",
      company: "BuildRight Construction Ltd",
      value: "$50,000 - $75,000",
      deadline: "April 10, 2025",
      location: "Central Region",
      category: "Construction",
      status: "open"
    },
    {
      id: 2,
      title: "IT Network Implementation",
      description: "Seeking specialized IT networking firms for government office network implementation",
      company: "TechSolutions Global",
      value: "$30,000 - $45,000",
      deadline: "March 25, 2025",
      location: "Capital City",
      category: "IT",
      status: "open"
    }
  ]);
  
  if (opportunities.length === 0) {
    return (
      <Alert variant="default" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Subcontracting Opportunities</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          <span>There are currently no subcontracting opportunities available.</span>
          <Button size="sm" className="ml-2">Post Opportunity</Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Available Opportunities</h3>
        <Button variant="outline" size="sm">
          Post New Opportunity
        </Button>
      </div>
      
      {opportunities.map(opportunity => (
        <Card key={opportunity.id} className="mb-4 border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg font-medium">{opportunity.title}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{opportunity.description}</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {opportunity.status === "open" ? "Open" : "Closing Soon"}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium flex items-center">
                  <Building className="h-4 w-4 mr-1 text-gray-500" />
                  Primary Contractor
                </h4>
                <p className="text-sm mt-1">{opportunity.company}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                  Estimated Value
                </h4>
                <p className="text-sm mt-1">{opportunity.value}</p>
              </div>
            </div>
            
            <Separator className="my-3" />
            
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <h4 className="text-sm font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                  Location
                </h4>
                <p className="text-sm mt-1">{opportunity.location}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium flex items-center">
                  <Briefcase className="h-4 w-4 mr-1 text-gray-500" />
                  Category
                </h4>
                <p className="text-sm mt-1">{opportunity.category}</p>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-2">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-gray-500" />
              <span className="text-xs text-gray-500">
                Application deadline: {opportunity.deadline}
              </span>
            </div>
            
            <Button variant="ghost" size="sm" className="flex items-center">
              View Details
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
