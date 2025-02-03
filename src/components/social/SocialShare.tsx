import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Facebook, Twitter, Linkedin } from "lucide-react";

export const SocialShare = () => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const verifyShare = async (platform: string, url: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to share",
          variant: "destructive",
        });
        return;
      }

      // Simple URL pattern matching for verification
      const isValid = url.includes(platform.toLowerCase());
      if (!isValid) {
        toast({
          title: "Invalid share URL",
          description: "Please provide a valid share URL",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("social_shares")
        .insert({
          user_id: user.id,
          platform,
          share_url: url,
          verified: true,
        });

      if (error) throw error;

      toast({
        title: "Share verified!",
        description: "You've earned 250 points for sharing",
      });
    } catch (error: any) {
      console.error("Error verifying share:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleShare = async (platform: string) => {
    setIsSharing(true);
    try {
      const shareUrl = window.location.href;
      const shareText = "Check out this amazing tender opportunity!";
      
      let shareWindow;
      switch (platform) {
        case 'facebook':
          shareWindow = window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        case 'twitter':
          shareWindow = window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
          break;
        case 'linkedin':
          shareWindow = window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
      }

      // Monitor for share completion
      const checkWindow = setInterval(() => {
        if (shareWindow?.closed) {
          clearInterval(checkWindow);
          verifyShare(platform, shareUrl);
          setIsSharing(false);
        }
      }, 1000);

    } catch (error) {
      console.error("Error sharing:", error);
      setIsSharing(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold">Share and Earn Points</h3>
      <p className="text-sm text-gray-600">Share this tender to earn 250 points!</p>
      
      <div className="flex space-x-4">
        <Button
          variant="outline"
          onClick={() => handleShare('facebook')}
          disabled={isSharing}
          className="flex items-center space-x-2"
        >
          <Facebook className="w-4 h-4" />
          <span>Facebook</span>
        </Button>
        
        <Button
          variant="outline"
          onClick={() => handleShare('twitter')}
          disabled={isSharing}
          className="flex items-center space-x-2"
        >
          <Twitter className="w-4 h-4" />
          <span>Twitter</span>
        </Button>
        
        <Button
          variant="outline"
          onClick={() => handleShare('linkedin')}
          disabled={isSharing}
          className="flex items-center space-x-2"
        >
          <Linkedin className="w-4 h-4" />
          <span>LinkedIn</span>
        </Button>
      </div>
    </div>
  );
};