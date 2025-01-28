import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, BuildingIcon } from "lucide-react";

interface TenderCardProps {
  title: string;
  organization: string;
  deadline: string;
  category: string;
  value: string;
  onViewDetails: () => void;
}

export const TenderCard = ({
  title,
  organization,
  deadline,
  category,
  value,
  onViewDetails,
}: TenderCardProps) => {
  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold line-clamp-2">{title}</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground">
          <BuildingIcon className="mr-2 h-4 w-4" />
          {organization}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Deadline: {deadline}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{category}</Badge>
          <Badge variant="outline">Value: {value}</Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onViewDetails} className="w-full">
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};