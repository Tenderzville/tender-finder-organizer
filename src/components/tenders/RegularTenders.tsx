
import { ArrowUpRight } from "lucide-react";
import { TenderCard } from "@/components/TenderCard";
import { Tender } from "@/types/tender";
import { ShareAction } from "@/types/tenderCard";

interface RegularTendersProps {
  tenders: Tender[];
  onViewDetails: (id: number) => void;
  language: 'en' | 'sw';
  shareEmail: (tender: Tender) => void;
  shareWhatsApp: (tender: Tender) => void;
  shareLabels: {
    email: string;
    whatsapp: string;
  };
}

export const RegularTenders = ({
  tenders,
  onViewDetails,
  language,
  shareEmail,
  shareWhatsApp,
  shareLabels
}: RegularTendersProps) => {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
      {tenders.map((tender) => {
        const shareActions: ShareAction[] = [
          {
            icon: <ArrowUpRight className="h-4 w-4" />,
            label: shareLabels.email,
            onClick: () => shareEmail(tender)
          },
          {
            icon: <ArrowUpRight className="h-4 w-4" />,
            label: shareLabels.whatsapp,
            onClick: () => shareWhatsApp(tender)
          }
        ];

        return (
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
        );
      })}
    </div>
  );
};
