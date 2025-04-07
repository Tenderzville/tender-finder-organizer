
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export const TenderFeedLoading = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Tenders</CardTitle>
        <CardDescription>Loading tender information...</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    </Card>
  );
};
