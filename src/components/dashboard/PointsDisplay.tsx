import { Progress } from "@/components/ui/progress";

interface PointsDisplayProps {
  currentPoints: number;
}

export const PointsDisplay = ({ currentPoints }: PointsDisplayProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Points</h3>
        <span className="text-2xl font-bold">{currentPoints}</span>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>Watch videos to earn points and access more tenders!</p>
        <p className="mt-2">Each video watched = 100 points</p>
      </div>
    </div>
  );
};