
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QualificationTool } from "@/components/tenders/QualificationTool";
import { Tender } from "@/types/tender";

interface TenderQualificationViewProps {
  onBack: () => void;
  tender?: Tender;
  language: 'en' | 'sw';
}

export const TenderQualificationView = ({ onBack, tender, language }: TenderQualificationViewProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Will I Qualify?</CardTitle>
          <CardDescription>
            Check your eligibility for available tenders
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          onClick={onBack}
        >
          Back to Tenders
        </Button>
      </CardHeader>
      <CardContent>
        <QualificationTool 
          tender={tender} 
          language={language}
        />
      </CardContent>
    </Card>
  );
};
