import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useBookmarks } from '@/hooks/useBookmarks';
import { useToast } from "@/components/ui/use-toast";
import { BookmarkIcon, CheckIcon } from "lucide-react";

interface BookmarkButtonProps {
  tenderId: string;
  className?: string;
  compact?: boolean;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  tenderId,
  className = '',
  compact = false
}) => {
  const { isBookmarked, addBookmark, removeBookmark, isLoading } = useBookmarks();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const bookmarked = isBookmarked(tenderId);
  
  const handleToggleBookmark = async () => {
    if (isLoading || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      if (bookmarked) {
        // Remove bookmark
        const success = await removeBookmark(tenderId);
        
        if (success) {
          toast({
            title: "Tender removed from bookmarks",
            description: "You can add it back anytime.",
            variant: "default",
          });
        } else {
          toast({
            title: "Error removing bookmark",
            description: "Please try again.",
            variant: "destructive",
          });
        }
      } else {
        // Add bookmark
        const result = await addBookmark(tenderId);
        
        if (result) {
          toast({
            title: "Tender bookmarked",
            description: "You can view all your saved tenders in your profile.",
            variant: "default",
          });
        } else {
          toast({
            title: "Error bookmarking tender",
            description: "Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Compact version for mobile or tight spaces
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${className}`}
              onClick={handleToggleBookmark}
              disabled={isLoading || isProcessing}
            >
              {bookmarked ? (
                <BookmarkIcon className="h-4 w-4 fill-primary text-primary" />
              ) : (
                <BookmarkIcon className="h-4 w-4" />
              )}
              <span className="sr-only">
                {bookmarked ? "Remove bookmark" : "Add bookmark"}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{bookmarked ? "Remove from bookmarks" : "Save to bookmarks"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Full button with text
  return (
    <Button
      variant={bookmarked ? "secondary" : "outline"}
      className={`${className} flex items-center gap-2`}
      onClick={handleToggleBookmark}
      disabled={isLoading || isProcessing}
    >
      {bookmarked ? (
        <>
          <CheckIcon className="h-4 w-4" />
          <span>Saved</span>
        </>
      ) : (
        <>
          <BookmarkIcon className="h-4 w-4" />
          <span>Save</span>
        </>
      )}
    </Button>
  );
};

export default BookmarkButton;
