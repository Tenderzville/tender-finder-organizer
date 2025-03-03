
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Users, LucideCalendar, Clock, Briefcase, ArrowRight } from "lucide-react";

export const ConsortiumsList = () => {
  const [consortiums] = useState([
    {
      id: 1,
      name: "Health Supplies Consortium",
      description: "A consortium of medical suppliers for large hospital tenders",
      tenderId: 123,
      tenderTitle: "National Hospital Medical Supplies",
      deadline: "March 30, 2025",
      membersCount: 4,
      maxMembers: 5,
      status: "active",
      leadCompany: "MediPlus Ltd"
    },
    {
      id: 2,
      name: "IT Infrastructure Consortium",
      description: "Joint bid for the national education IT infrastructure upgrade",
      tenderId: 124,
      tenderTitle: "National Schools Technology Upgrade",
      deadline: "April 15, 2025",
      membersCount: 3,
      maxMembers: 5,
      status: "forming",
      leadCompany: "TechPartners Inc"
    }
  ]);
  
  if (consortiums.length === 0) {
    return (
      <Alert variant="default" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Consortiums Available</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          <span>There are currently no active consortiums. Create a new one to get started.</span>
          <Button size="sm" className="ml-2">Create Consortium</Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Active Consortiums</h3>
        <Button variant="outline" size="sm">
          Create New Consortium
        </Button>
      </div>
      
      {consortiums.map(consortium => (
        <Card key={consortium.id} className="mb-4 border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg font-medium">{consortium.name}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{consortium.description}</p>
              </div>
              <Badge variant={consortium.status === "active" ? "default" : "outline"}>
                {consortium.status === "active" ? "Active" : "Forming"}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium flex items-center">
                  <Briefcase className="h-4 w-4 mr-1 text-gray-500" />
                  Related Tender
                </h4>
                <p className="text-sm text-blue-600 hover:underline cursor-pointer mt-1">
                  {consortium.tenderTitle}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium flex items-center">
                  <LucideCalendar className="h-4 w-4 mr-1 text-gray-500" />
                  Tender Deadline
                </h4>
                <p className="text-sm mt-1">{consortium.deadline}</p>
              </div>
            </div>
            
            <Separator className="my-3" />
            
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-1 text-gray-500" />
                  Members ({consortium.membersCount}/{consortium.maxMembers})
                </h4>
                <span className="text-xs text-gray-500">
                  Led by: {consortium.leadCompany}
                </span>
              </div>
              
              <Progress value={(consortium.membersCount / consortium.maxMembers) * 100} className="h-2" />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-2">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-gray-500" />
              <span className="text-xs text-gray-500">
                {consortium.status === "forming" 
                  ? "Formation in progress" 
                  : "Consortium active until tender deadline"}
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
