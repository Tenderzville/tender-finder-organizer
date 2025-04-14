
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { QualificationTool } from "@/components/tenders/QualificationTool";
import { Tender } from "@/types/tender";

interface TenderQualificationViewProps {
  onBack: () => void;
  tender?: Tender;
  language: 'en' | 'sw';
}

export const TenderQualificationView = ({ 
  onBack, 
  tender,
  language 
}: TenderQualificationViewProps) => {
  const t = {
    en: {
      backToTenders: "Back to Tenders",
      checkQualification: "Check Your Qualification",
      noTenderSelected: "No tender selected for qualification check"
    },
    sw: {
      backToTenders: "Rudi kwenye Zabuni",
      checkQualification: "Angalia Sifa Zako",
      noTenderSelected: "Hakuna zabuni iliyochaguliwa kwa ukaguzi wa sifa"
    }
  }[language];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle>{t.checkQualification}</CardTitle>
      </CardHeader>
      <CardContent>
        {tender ? (
          <QualificationTool tender={tender} language={language} />
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">{t.noTenderSelected}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
