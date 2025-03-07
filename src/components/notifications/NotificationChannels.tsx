
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, MessageSquare, BellRing, Twitter, Send } from 'lucide-react';

interface NotificationChannelsProps {
  userId: string;
  language: 'en' | 'sw';
}

export const NotificationChannels: React.FC<NotificationChannelsProps> = ({ 
  userId,
  language 
}) => {
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState({
    email: {
      enabled: true,
      value: ''
    },
    sms: {
      enabled: false,
      value: ''
    },
    telegram: {
      enabled: false,
      value: ''
    },
    twitter: {
      enabled: false,
      value: ''
    }
  });
  
  const { toast } = useToast();
  
  // Translations
  const translations = {
    en: {
      title: 'Notification Channels',
      description: 'Receive tender alerts through your preferred channels',
      save: 'Save Preferences',
      saved: 'Your notification preferences have been saved',
      error: 'Error saving notification preferences',
      channels: {
        email: 'Email',
        sms: 'SMS',
        telegram: 'Telegram',
        twitter: 'Twitter'
      },
      placeholders: {
        email: 'Enter your email',
        phone: 'Enter your phone number',
        telegram: 'Enter your Telegram username',
        twitter: 'Enter your Twitter handle'
      },
      connect: 'Connect',
      disconnect: 'Disconnect',
      setup: 'Set up notifications for',
      frequency: {
        title: 'Notification Frequency',
        immediately: 'Immediately',
        daily: 'Daily digest',
        weekly: 'Weekly digest'
      }
    },
    sw: {
      title: 'Njia za Arifa',
      description: 'Pokea arifa za zabuni kupitia njia unazozipenda',
      save: 'Hifadhi Mapendeleo',
      saved: 'Mapendeleo yako ya arifa yamehifadhiwa',
      error: 'Hitilafu katika kuhifadhi mapendeleo ya arifa',
      channels: {
        email: 'Barua pepe',
        sms: 'SMS',
        telegram: 'Telegram',
        twitter: 'Twitter'
      },
      placeholders: {
        email: 'Ingiza barua pepe yako',
        phone: 'Ingiza namba yako ya simu',
        telegram: 'Ingiza jina lako la mtumiaji la Telegram',
        twitter: 'Ingiza jina lako la Twitter'
      },
      connect: 'Unganisha',
      disconnect: 'Tenganisha',
      setup: 'Weka arifa kwa',
      frequency: {
        title: 'Mzunguko wa Arifa',
        immediately: 'Mara moja',
        daily: 'Muhtasari wa kila siku',
        weekly: 'Muhtasari wa kila wiki'
      }
    }
  };
  
  const t = translations[language];
  
  useEffect(() => {
    if (!userId) return;
    
    const fetchNotificationPreferences = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setChannels({
            email: {
              enabled: data.email_enabled || false,
              value: data.email || ''
            },
            sms: {
              enabled: data.sms_enabled || false,
              value: data.phone_number || ''
            },
            telegram: {
              enabled: data.telegram_enabled || false,
              value: data.telegram_username || ''
            },
            twitter: {
              enabled: data.twitter_enabled || false,
              value: data.twitter_handle || ''
            }
          });
        }
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotificationPreferences();
  }, [userId]);
  
  const handleToggleChannel = (channel: keyof typeof channels) => {
    setChannels(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        enabled: !prev[channel].enabled
      }
    }));
  };
  
  const handleInputChange = (channel: keyof typeof channels, value: string) => {
    setChannels(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        value
      }
    }));
  };
  
  const handleSavePreferences = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: userId,
          email_enabled: channels.email.enabled,
          email: channels.email.value,
          sms_enabled: channels.sms.enabled,
          phone_number: channels.sms.value,
          telegram_enabled: channels.telegram.enabled,
          telegram_username: channels.telegram.value,
          twitter_enabled: channels.twitter.enabled,
          twitter_handle: channels.twitter.value,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: t.saved,
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: 'Error',
        description: t.error,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to connect to Twitter (would typically redirect to OAuth flow)
  const connectTwitter = () => {
    // This would normally redirect to Twitter auth
    toast({
      title: 'Twitter Connection',
      description: 'Twitter integration would initiate here',
    });
  };
  
  // Function to connect to Telegram (would typically redirect to Telegram bot)
  const connectTelegram = () => {
    // This would normally open Telegram bot
    toast({
      title: 'Telegram Connection',
      description: 'Telegram bot integration would initiate here',
    });
  };
  
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'telegram': return <Send className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      default: return <BellRing className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="channels" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="frequency">Frequency</TabsTrigger>
          </TabsList>
          <TabsContent value="channels" className="space-y-4 pt-4">
            {Object.entries(channels).map(([key, channel]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center space-x-2">
                  {getChannelIcon(key)}
                  <Label htmlFor={`${key}-toggle`} className="cursor-pointer">
                    {t.channels[key as keyof typeof t.channels]}
                  </Label>
                </div>
                <div className="flex items-center space-x-4">
                  {(key === 'telegram' || key === 'twitter') && channel.enabled && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={key === 'telegram' ? connectTelegram : connectTwitter}
                    >
                      {t.connect}
                    </Button>
                  )}
                  <Switch 
                    id={`${key}-toggle`}
                    checked={channel.enabled}
                    onCheckedChange={() => handleToggleChannel(key as keyof typeof channels)}
                  />
                </div>
              </div>
            ))}
            
            <div className="space-y-4 mt-6">
              <h3 className="text-sm font-medium">{t.setup} {t.channels.email}</h3>
              <Input
                value={channels.email.value}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t.placeholders.email}
                disabled={!channels.email.enabled}
              />
              
              <h3 className="text-sm font-medium">{t.setup} {t.channels.sms}</h3>
              <Input
                value={channels.sms.value}
                onChange={(e) => handleInputChange('sms', e.target.value)}
                placeholder={t.placeholders.phone}
                disabled={!channels.sms.enabled}
              />
              
              <h3 className="text-sm font-medium">{t.setup} {t.channels.telegram}</h3>
              <Input
                value={channels.telegram.value}
                onChange={(e) => handleInputChange('telegram', e.target.value)}
                placeholder={t.placeholders.telegram}
                disabled={!channels.telegram.enabled}
              />
              
              <h3 className="text-sm font-medium">{t.setup} {t.channels.twitter}</h3>
              <Input
                value={channels.twitter.value}
                onChange={(e) => handleInputChange('twitter', e.target.value)}
                placeholder={t.placeholders.twitter}
                disabled={!channels.twitter.enabled}
              />
            </div>
          </TabsContent>
          <TabsContent value="frequency" className="space-y-4 pt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">{t.frequency.title}</h3>
              <div className="grid gap-2">
                <div className="flex items-center space-x-2">
                  <Switch id="notify-immediately" defaultChecked />
                  <Label htmlFor="notify-immediately">{t.frequency.immediately}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="notify-daily" />
                  <Label htmlFor="notify-daily">{t.frequency.daily}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="notify-weekly" />
                  <Label htmlFor="notify-weekly">{t.frequency.weekly}</Label>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSavePreferences}
          disabled={loading}
        >
          {loading ? 'Saving...' : t.save}
        </Button>
      </CardFooter>
    </Card>
  );
};
