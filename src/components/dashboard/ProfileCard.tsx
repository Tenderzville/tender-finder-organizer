
import React from "react";
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

interface ProfileCardProps {
  userData: any | null;
}

export function ProfileCard({ userData }: ProfileCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
        <CardDescription>Your account information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 p-2 rounded-full">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="font-medium">{userData?.email || 'User'}</p>
            <p className="text-sm text-muted-foreground">User ID: {userData?.id || 'Unknown'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
