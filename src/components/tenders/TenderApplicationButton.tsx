
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Send } from "lucide-react";
import { useTenderApplications } from "@/hooks/use-tender-applications";
import { useAuthState } from "@/hooks/useAuthState";

interface TenderApplicationButtonProps {
  tenderId: number;
  tenderTitle: string;
}

export const TenderApplicationButton = ({ tenderId, tenderTitle }: TenderApplicationButtonProps) => {
  const { isAuthenticated } = useAuthState();
  const [isOpen, setIsOpen] = useState(false);
  
  // For demo purposes, using a mock user ID since auth isn't fully implemented
  const userId = isAuthenticated ? "demo-user-id" : undefined;
  const { applications, createApplication, updateApplication, isCreating, isUpdating } = useTenderApplications(userId);

  const existingApplication = applications.find(app => app.tender_id === tenderId);

  const handleCreateApplication = () => {
    if (!userId) return;
    
    createApplication({
      tender_id: tenderId,
      application_data: {
        tender_title: tenderTitle,
        created_via: 'web_interface'
      }
    });
    setIsOpen(false);
  };

  const handleSubmitApplication = () => {
    if (!existingApplication) return;
    
    updateApplication({
      id: existingApplication.id,
      status: 'submitted'
    });
    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <Button variant="outline" disabled>
        <FileText className="h-4 w-4 mr-2" />
        Sign in to Apply
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={existingApplication ? "secondary" : "default"}>
          <FileText className="h-4 w-4 mr-2" />
          {existingApplication ? "View Application" : "Apply for Tender"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tender Application</DialogTitle>
        </DialogHeader>
        
        {existingApplication ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Status:</p>
                <Badge variant={
                  existingApplication.status === 'submitted' ? 'default' :
                  existingApplication.status === 'accepted' ? 'secondary' :
                  existingApplication.status === 'rejected' ? 'destructive' : 'outline'
                }>
                  {existingApplication.status.charAt(0).toUpperCase() + existingApplication.status.slice(1)}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Created:</p>
                <p className="text-sm">{new Date(existingApplication.created_at).toLocaleDateString()}</p>
              </div>
              
              {existingApplication.submitted_at && (
                <div>
                  <p className="text-sm text-gray-600">Submitted:</p>
                  <p className="text-sm">{new Date(existingApplication.submitted_at).toLocaleDateString()}</p>
                </div>
              )}
              
              {existingApplication.status === 'draft' && (
                <Button 
                  onClick={handleSubmitApplication}
                  disabled={isUpdating}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Application
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Start Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                This will create a draft application for "{tenderTitle}". You can complete and submit it later.
              </p>
              
              <Button 
                onClick={handleCreateApplication}
                disabled={isCreating}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Draft Application
              </Button>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};
