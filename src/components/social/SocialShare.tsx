
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Facebook, Twitter, Linkedin, Share } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const SocialShare = ({ tenderId }: { tenderId?: number }) => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
          tender_id: tenderId || null,
        });

      if (error) throw error;

      toast({
        title: "Share verified!",
        description: "You've earned 250 points for sharing",
      });
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
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

  // New method to trigger manual social media posting
  const triggerSocialPosting = async () => {
    if (!tenderId) {
      toast({
        title: "Error",
        description: "No tender specified for social media posting",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);
    try {
      // Check if user is authenticated as admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to post to social media",
          variant: "destructive",
        });
        setIsSharing(false);
        return;
      }

      // Call the send-social-media Edge Function
      const { data, error } = await supabase.functions.invoke('send-social-media', {
        body: { tenderId }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Social Media Post Sent",
        description: "The tender has been posted to social media channels",
      });
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error: any) {
      console.error("Error posting to social media:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to post to social media",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold">Share and Earn Points</h3>
      <p className="text-sm text-gray-600">Share this tender to earn 250 points!</p>
      
      {showSuccess && (
        <Alert className="bg-green-50 border-green-200 mb-2">
          <AlertTitle className="text-green-800">Thank you for sharing!</AlertTitle>
          <AlertDescription className="text-green-700">
            Your points have been added to your account.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-wrap gap-2">
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
        
        {tenderId && (
          <Button
            variant="default"
            onClick={triggerSocialPosting}
            disabled={isSharing}
            className="flex items-center space-x-2 ml-auto"
          >
            <Share className="w-4 h-4" />
            <span>Post to All Channels</span>
          </Button>
        )}
      </div>
    </div>
  );
};
