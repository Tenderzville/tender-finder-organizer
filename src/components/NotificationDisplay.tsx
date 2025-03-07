import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { useAuthState } from '@/hooks/useAuthState';
import { Bell, CheckCircle, AlertCircle, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  notification_type: 'tender_deadline' | 'new_tender' | 'system' | 'reminder' | 'agpo';
  created_at: string;
}

export const NotificationDisplay: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [open, setOpen] = useState<boolean>(false);
  const { isAuthenticated, profileStatus } = useAuthState();
  const user = isAuthenticated ? { id: 'user_id_placeholder' } : null; // Placeholder for user object
  const navigate = useNavigate();
  
  // Fetch notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated || profileStatus === 'missing') {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (error) {
        throw error;
      }
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(notification => !notification.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mark notification as read
  const markAsRead = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      
      setUnreadCount(prev => Math.max(prev - 1, 0));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to link if provided
    if (notification.link) {
      navigate(notification.link);
    }
    
    // Close popover
    setOpen(false);
  };
  
  // Get icon for notification type
  const getNotificationIcon = (type: Notification['notification_type']) => {
    switch (type) {
      case 'tender_deadline':
        return <Calendar className="h-4 w-4 text-yellow-500" />;
      case 'new_tender':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-purple-500" />;
      case 'reminder':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'agpo':
        return <FileText className="h-4 w-4 text-pink-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Load notifications on mount and when user changes
  useEffect(() => {
    fetchNotifications(); // Fetch notifications when component mounts or user changes
    
    // Set up real-time subscription for new notifications
    if (user) {
      const subscription = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            // Add new notification to state
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();
        
      // Cleanup subscription
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user]);
  
  // Handle open change
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    
    // Fetch latest notifications when opening
    if (newOpen) {
      fetchNotifications();
    }
  };
  
  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">View notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs h-8"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-black' : 'text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500">
                          {format(new Date(notification.created_at), 'MMM d')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs w-full"
            onClick={() => {
              navigate('/notifications');
              setOpen(false);
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDisplay;
