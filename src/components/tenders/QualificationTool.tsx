
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Tender } from '@/types/tender';
import { useToast } from '@/hooks/use-toast';

interface QualificationToolProps {
  tender?: Tender;
  language?: 'en' | 'sw';
}

export const QualificationTool: React.FC<QualificationToolProps> = ({ tender, language = 'en' }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<'qualified' | 'not-qualified' | 'partial' | null>(null);
  const { toast } = useToast();
  
  const translations = {
    en: {
      title: 'Qualification Check',
      description: 'Check if you meet the requirements for this tender',
      checkButton: 'Check Qualification',
      qualified: 'You meet all the requirements',
      notQualified: 'You don\'t meet key requirements',
      partial: 'You partially meet the requirements',
      noTender: 'Select a tender to check qualification'
    },
    sw: {
      title: 'Ukaguzi wa Sifa',
      description: 'Angalia kama unakidhi mahitaji ya zabuni hii',
      checkButton: 'Angalia Sifa',
      qualified: 'Unakidhi mahitaji yote',
      notQualified: 'Hukidhi mahitaji muhimu',
      partial: 'Unakidhi baadhi ya mahitaji',
      noTender: 'Chagua zabuni ili kuangalia sifa'
    }
  };

  const t = translations[language];
  
  const checkQualification = () => {
    if (!tender) return;
    
    setIsChecking(true);
    
    // Simulate qualification check
    setTimeout(() => {
      // Random result for demo purposes
      const outcomes = ['qualified', 'not-qualified', 'partial'] as const;
      const randomResult = outcomes[Math.floor(Math.random() * outcomes.length)];
      setResult(randomResult);
      
      toast({
        title: t.title,
        description: t[randomResult],
        variant: randomResult === 'qualified' ? 'default' : 
                 randomResult === 'not-qualified' ? 'destructive' : 'default'
      });
      
      setIsChecking(false);
    }, 1500);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{t.description}</p>
        
        {tender ? (
          <>
            {result === 'qualified' && (
              <div className="flex items-center space-x-2 mb-4 text-green-600">
                <CheckCircle size={18} />
                <span>{t.qualified}</span>
              </div>
            )}
            
            {result === 'not-qualified' && (
              <div className="flex items-center space-x-2 mb-4 text-red-600">
                <XCircle size={18} />
                <span>{t.notQualified}</span>
              </div>
            )}
            
            {result === 'partial' && (
              <div className="flex items-center space-x-2 mb-4 text-amber-600">
                <AlertCircle size={18} />
                <span>{t.partial}</span>
              </div>
            )}
            
            <Button 
              onClick={checkQualification} 
              disabled={isChecking}
              className="w-full"
            >
              {isChecking ? 'Checking...' : t.checkButton}
            </Button>
          </>
        ) : (
          <p className="text-sm italic">{t.noTender}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default QualificationTool;
