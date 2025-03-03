
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Globe, Briefcase } from "lucide-react";
import { NotificationButton } from "@/components/tenders/NotificationButton";
import { ShareSheet } from "@/components/tenders/ShareSheet";
import { ExternalLinkButton } from "@/components/tenders/ExternalLinkButton";
import { formatCurrency } from "@/utils/formatters";
import { tenderCardTranslations } from "@/utils/translations";
import { TenderCardProps } from "@/types/tenderCard";

export const TenderCard = ({
  id,
  title,
  organization,
  deadline,
  category,
  value,
  location,
  pointsRequired = 0,
  tender_url,
  onViewDetails,
  hasAffirmativeAction = false,
  affirmativeActionType = 'none',
  language = 'en',
  shareActions = [],
}: TenderCardProps) => {
  const formattedValue = formatCurrency(value, location);
  const t = tenderCardTranslations[language];

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-start">
          <Badge variant="secondary" className="mb-2">
            {category}
          </Badge>
          <div className="flex gap-1">
            <NotificationButton tenderId={id} tenderTitle={title} />
            <ShareSheet 
              id={id}
              title={title}
              deadline={deadline}
              category={category}
              location={location}
              language={language}
              shareActions={shareActions}
              translations={t}
            />
          </div>
        </div>
        <CardTitle className="text-lg font-semibold line-clamp-2">{title}</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground">
          <Briefcase className="mr-2 h-4 w-4" />
          {organization}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasAffirmativeAction && (
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 w-full justify-center">
            {affirmativeActionType === 'youth' ? t.youth : 
              affirmativeActionType === 'women' ? t.women : 
              affirmativeActionType === 'pwds' ? t.pwds : t.special}
          </Badge>
        )}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            <span>{t.deadline}: {deadline}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Globe className="mr-2 h-4 w-4" />
            <span>{location || 'International'}</span>
          </div>
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="w-full justify-center">
            {t.value}: {formattedValue}
          </Badge>
          {pointsRequired > 0 && (
            <Badge variant="secondary" className="w-full justify-center">
              {t.requiredPoints}: {pointsRequired}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={onViewDetails} className="flex-1">
          {t.viewDetails}
        </Button>
        {tender_url && <ExternalLinkButton url={tender_url} />}
      </CardFooter>
    </Card>
  );
};
