
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Facebook, Linkedin, Twitter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase-client";
import { Tender } from "@/types/tender";
import { generateSocialMediaPost } from "@/utils/tenderAnalysis";

interface ScheduleSocialPostProps {
  tender: Tender;
}

export function ScheduleSocialPost({ tender }: ScheduleSocialPostProps) {
  const { toast } = useToast();
  const [platform, setPlatform] = useState<'twitter' | 'facebook' | 'linkedin'>('twitter');
  const [postText, setPostText] = useState(generateSocialMediaPost(tender));
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSchedulePost = async () => {
    if (!scheduledDate) {
      toast({
        title: "Date required",
        description: "Please select a date for scheduling this post.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real application, this would connect to the send-social-media function
      // For now, we'll just create a record and show a success message
      await supabase.from('social_shares').insert({
        platform,
        share_url: tender.tender_url || '',
        user_id: (await supabase.auth.getUser()).data.user?.id || 'anonymous',
        verified: false
      });
      
      toast({
        title: "Post scheduled",
        description: `Your post has been scheduled on ${platform} for ${format(scheduledDate, "PPP")}`,
      });
      
      // Reset form
      setPostText(generateSocialMediaPost(tender));
    } catch (err) {
      console.error("Error scheduling post:", err);
      toast({
        title: "Schedule failed",
        description: "There was an error scheduling your social media post.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Platform-specific character limits
  const getCharacterLimit = () => {
    switch(platform) {
      case 'twitter': return 280;
      case 'facebook': return 5000;
      case 'linkedin': return 3000;
      default: return 280;
    }
  };
  
  const characterLimit = getCharacterLimit();
  const charactersUsed = postText.length;
  const isOverLimit = charactersUsed > characterLimit;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Social Media Post</CardTitle>
        <CardDescription>
          Share this tender opportunity on social media
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="twitter" onValueChange={(value) => setPlatform(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="twitter" className="flex items-center">
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </TabsTrigger>
            <TabsTrigger value="facebook" className="flex items-center">
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="flex items-center">
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4 space-y-4">
            <div>
              <Textarea 
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                className={`min-h-[150px] ${isOverLimit ? 'border-red-500' : ''}`}
                placeholder={`Compose your ${platform} post...`}
              />
              <div className={`text-xs mt-1 flex justify-end ${
                isOverLimit ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {charactersUsed}/{characterLimit}
              </div>
            </div>
            
            <div>
              <div className="flex flex-col gap-2">
                <label className="text-sm">Schedule for</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm">Posting time (24h format)</label>
              <Input
                type="time"
                defaultValue="09:00"
                className="w-full"
              />
            </div>
          </div>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSchedulePost}
          disabled={isSubmitting || isOverLimit}
          className="w-full"
        >
          {isSubmitting ? "Scheduling..." : "Schedule Post"}
        </Button>
      </CardFooter>
    </Card>
  );
}
