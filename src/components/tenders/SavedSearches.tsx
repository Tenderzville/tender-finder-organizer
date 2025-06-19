
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Save, Trash2, Bell, BellOff } from "lucide-react";
import { useSavedSearches } from "@/hooks/use-saved-searches";
import { useAuthState } from "@/hooks/useAuthState";

interface SavedSearchesProps {
  currentSearchCriteria?: any;
  onApplySearch?: (criteria: any) => void;
}

export const SavedSearches = ({ currentSearchCriteria, onApplySearch }: SavedSearchesProps) => {
  const { isAuthenticated } = useAuthState();
  const [isOpen, setIsOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  
  // For demo purposes, using a mock user ID since auth isn't fully implemented
  const userId = isAuthenticated ? "demo-user-id" : undefined;
  const { savedSearches, saveSearch, deleteSearch, isSaving, isDeleting } = useSavedSearches(userId);

  const handleSaveCurrentSearch = () => {
    if (!searchName.trim() || !currentSearchCriteria) return;
    
    saveSearch({
      name: searchName,
      search_criteria: currentSearchCriteria,
      notification_enabled: true
    });
    
    setSearchName("");
    setIsOpen(false);
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Search
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter search name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
            <Button 
              onClick={handleSaveCurrentSearch}
              disabled={!searchName.trim() || isSaving}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Search
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {savedSearches.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Saved Searches
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{search.name}</h4>
                    {search.notification_enabled ? (
                      <Bell className="h-4 w-4 text-blue-500" />
                    ) : (
                      <BellOff className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Created: {new Date(search.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onApplySearch?.(search.search_criteria)}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSearch(search.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
};
