
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, Users, LucideCalendar, Clock, Briefcase, ArrowRight, PlusCircle, UserPlus, CheckCircle, Lightbulb } from "lucide-react";

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
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExpertDialogOpen, setIsExpertDialogOpen] = useState(false);
  
  const handleCreateConsortium = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreateDialogOpen(false);
    toast({
      title: "Consortium Creation Started",
      description: "Your new consortium has been created and is now in forming status."
    });
  };
  
  const handleSeekExpertGuidance = (e: React.FormEvent) => {
    e.preventDefault();
    setIsExpertDialogOpen(false);
    toast({
      title: "Request Sent",
      description: "Your request for expert guidance has been sent. An expert will contact you shortly."
    });
  };
  
  if (consortiums.length === 0) {
    return (
      <Alert variant="default" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Consortiums Available</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          <span>There are currently no active consortiums. Create a new one to get started.</span>
          <Button size="sm" className="ml-2" onClick={() => setIsCreateDialogOpen(true)}>Create Consortium</Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Active Consortiums</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => setIsExpertDialogOpen(true)}>
            <Lightbulb className="h-4 w-4" />
            Seek Expert Guidance
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            Create New Consortium
          </Button>
        </div>
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
            
            <div className="flex gap-2">
              {consortium.status === "forming" && (
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Members
                </Button>
              )}
              <Button variant="ghost" size="sm" className="flex items-center">
                View Details
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
      
      {/* Create Consortium Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Consortium</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateConsortium}>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-2">
                <Label htmlFor="name">Consortium Name</Label>
                <Input id="name" required placeholder="e.g., Healthcare Supplies Consortium" />
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" required placeholder="Brief description of the consortium purpose and goals" />
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="tender">Related Tender</Label>
                <Select required>
                  <SelectTrigger id="tender">
                    <SelectValue placeholder="Select a tender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tender1">National Hospital Medical Supplies</SelectItem>
                    <SelectItem value="tender2">County Schools Infrastructure</SelectItem>
                    <SelectItem value="tender3">Ministry of Health Equipment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="maxMembers">Maximum Members</Label>
                <Input id="maxMembers" type="number" min="2" max="10" defaultValue="5" required />
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Creating a consortium will make you the lead company. You'll be responsible for coordinating the bid process.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Create Consortium</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Expert Guidance Dialog */}
      <Dialog open={isExpertDialogOpen} onOpenChange={setIsExpertDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Seek Expert Guidance</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSeekExpertGuidance}>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-2">
                <Label htmlFor="expertType">Type of Expert</Label>
                <Select required>
                  <SelectTrigger id="expertType">
                    <SelectValue placeholder="Select expert type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legal">Legal Advisor</SelectItem>
                    <SelectItem value="financial">Financial Advisor</SelectItem>
                    <SelectItem value="procurement">Procurement Specialist</SelectItem>
                    <SelectItem value="technical">Technical Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="inquiry">Your Inquiry</Label>
                <Textarea id="inquiry" required rows={4} placeholder="Describe what you need help with regarding your consortium" />
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="consortium">Related Consortium (Optional)</Label>
                <Select>
                  <SelectTrigger id="consortium">
                    <SelectValue placeholder="Select a consortium" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New Consortium (Not Created Yet)</SelectItem>
                    <SelectItem value="1">Health Supplies Consortium</SelectItem>
                    <SelectItem value="2">IT Infrastructure Consortium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-800" />
                <AlertDescription>
                  An expert will contact you within 24 hours to provide guidance on forming or managing your consortium.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsExpertDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
