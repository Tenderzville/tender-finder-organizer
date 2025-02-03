import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const NotificationPreferencesCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Notifications</h2>
      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate("/preferences")}
        >
          <Bell className="mr-2 h-4 w-4" />
          Manage Alert Preferences
        </Button>
      </div>
    </Card>
  );
};