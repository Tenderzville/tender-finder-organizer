
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { appTranslations } from '@/utils/translations';
import { Tender } from '@/types/tender';
import { TenderCard } from '@/components/TenderCard';
import { Skeleton } from '@/components/ui/skeleton';

// Kenya counties list
const KENYA_COUNTIES = [
  'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta', 'Garissa', 
  'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru', 'Tharaka-Nithi', 'Embu', 
  'Kitui', 'Machakos', 'Makueni', 'Nyandarua', 'Nyeri', 'Kirinyaga', 'Murang\'a', 
  'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans-Nzoia', 'Uasin Gishu', 
  'Elgeyo-Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 
  'Kericho', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya', 
  'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Nairobi'
];

interface CountyTendersProps {
  tenders: Tender[];
  onViewDetails: (id: string) => void;
  language: 'en' | 'sw';
  shareActions: {
    shareEmail: (id: string) => void;
    shareWhatsApp: (id: string) => void;
    shareLabels: { email: string; whatsapp: string };
  };
}

export const CountyTenders: React.FC<CountyTendersProps> = ({ 
  tenders, 
  onViewDetails, 
  language, 
  shareActions 
}) => {
  const [selectedCounty, setSelectedCounty] = useState<string>('all');
  const [filteredTenders, setFilteredTenders] = useState<Tender[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const t = appTranslations[language];
  
  // Filter tenders based on selected county
  useEffect(() => {
    setIsLoading(true);
    
    if (selectedCounty === 'all') {
      setFilteredTenders(tenders);
    } else {
      const filtered = tenders.filter(tender => {
        // Check location field for county match
        const tenderLocation = (tender.location || '').toLowerCase();
        return tenderLocation.includes(selectedCounty.toLowerCase());
      });
      setFilteredTenders(filtered);
    }
    
    setTimeout(() => setIsLoading(false), 300); // Small delay to show loading state
  }, [selectedCounty, tenders]);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{t.county_specific}</h2>
        <Select 
          value={selectedCounty} 
          onValueChange={(value) => setSelectedCounty(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t.select_county} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.all_counties}</SelectItem>
            {KENYA_COUNTIES.map(county => (
              <SelectItem key={county} value={county.toLowerCase()}>{county}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border rounded-lg p-4 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTenders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenders.map(tender => (
            <TenderCard
              key={tender.id}
              id={tender.id}
              title={tender.title}
              organization={tender.category}
              deadline={tender.deadline}
              category={tender.category}
              value={tender.fees || "Contact for pricing"}
              location={tender.location}
              pointsRequired={tender.points_required || 0}
              tender_url={tender.tender_url}
              onViewDetails={() => onViewDetails(tender.id)}
              hasAffirmativeAction={tender.affirmative_action?.type !== undefined && tender.affirmative_action?.type !== 'none'}
              affirmativeActionType={tender.affirmative_action?.type || 'none'}
              language={language}
              shareActions={shareActions}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {language === 'en' 
              ? `No tenders found for ${selectedCounty === 'all' ? 'any county' : selectedCounty}` 
              : `Hakuna zabuni zilizopatikana kwa ${selectedCounty === 'all' ? 'kaunti yoyote' : selectedCounty}`}
          </p>
        </div>
      )}
    </div>
  );
};
