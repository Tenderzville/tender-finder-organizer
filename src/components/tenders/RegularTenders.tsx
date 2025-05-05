
import { ArrowUpRight, Bookmark, BookmarkCheck } from "lucide-react";
import { TenderCard } from "@/components/TenderCard";
import { Tender } from "@/types/tender";
import { ShareAction } from "@/types/tenderCard";

interface RegularTendersProps {
  tenders: Tender[];
  onViewDetails: (id: number) => void;
  language: 'en' | 'sw';
  shareEmail: (tender: Tender) => void;
  shareWhatsApp: (tender: Tender) => void;
  onBookmark?: (tenderId: number) => void;
  bookmarkedTenders?: number[];
  shareLabels: {
    email: string;
    whatsapp: string;
    bookmark: string;
  };
}

export const RegularTenders = ({
  tenders,
  onViewDetails,
  language,
  shareEmail,
  shareWhatsApp,
  onBookmark,
  bookmarkedTenders = [],
  shareLabels
}: RegularTendersProps) => {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
      {tenders.map((tender) => {
        const isBookmarked = bookmarkedTenders.includes(tender.id);
        
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
        
        // Add bookmark action if onBookmark handler is provided
        if (onBookmark) {
          shareActions.push({
            icon: isBookmarked ? 
              <BookmarkCheck className="h-4 w-4 text-green-600" /> : 
              <Bookmark className="h-4 w-4" />,
            label: isBookmarked ? "Bookmarked" : shareLabels.bookmark,
            onClick: () => onBookmark(tender.id)
          });
        }

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
