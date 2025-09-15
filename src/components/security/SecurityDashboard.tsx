import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle, Activity, Users, Eye, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SecurityLog {
  id: string;
  user_id?: string;
  event_type: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface AuthLog {
  id: string;
  user_id?: string;
  email?: string;
  event_type: string;
  success: boolean;
  details: any;
  created_at: string;
}

export const SecurityDashboard = () => {
  // Fetch security logs
  const { data: securityLogs, isLoading: securityLoading } = useQuery({
    queryKey: ['security-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as SecurityLog[];
    },
  });

  // Fetch auth logs
  const { data: authLogs, isLoading: authLoading } = useQuery({
    queryKey: ['auth-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auth_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as AuthLog[];
    },
  });

  // Calculate security metrics
  const securityMetrics = React.useMemo(() => {
    if (!securityLogs || !authLogs) return null;

    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const recentSecurityEvents = securityLogs.filter(
      log => new Date(log.created_at) > yesterday
    );

    const recentAuthEvents = authLogs.filter(
      log => new Date(log.created_at) > yesterday
    );

    const failedLogins = recentAuthEvents.filter(log => !log.success);
    const suspiciousActivity = recentSecurityEvents.filter(
      log => log.event_type.includes('suspicious') || log.event_type.includes('blocked')
    );

    return {
      totalSecurityEvents: recentSecurityEvents.length,
      failedLogins: failedLogins.length,
      suspiciousActivity: suspiciousActivity.length,
      activeUsers: new Set(recentAuthEvents.filter(log => log.success).map(log => log.user_id)).size,
    };
  }, [securityLogs, authLogs]);

  const getEventTypeBadge = (eventType: string, success?: boolean) => {
    if (eventType.includes('suspicious') || eventType.includes('blocked')) {
      return <Badge variant="destructive">Critical</Badge>;
    }
    if (eventType.includes('failed') || success === false) {
      return <Badge variant="destructive">Failed</Badge>;
    }
    if (eventType.includes('success') || success === true) {
      return <Badge variant="default">Success</Badge>;
    }
    return <Badge variant="secondary">Info</Badge>;
  };

  const formatEventDetails = (details: any) => {
    if (!details || typeof details !== 'object') return 'No details';
    
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
  };

  if (securityLoading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Security Dashboard</h1>
      </div>

      {/* Security Metrics Overview */}
      {securityMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Events (24h)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityMetrics.totalSecurityEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Logins (24h)</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{securityMetrics.failedLogins}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspicious Activity (24h)</CardTitle>
              <Eye className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{securityMetrics.suspiciousActivity}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users (24h)</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityMetrics.activeUsers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {securityMetrics && securityMetrics.suspiciousActivity > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {securityMetrics.suspiciousActivity} suspicious activities detected in the last 24 hours. 
            Review the security logs for details.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Logs */}
      <Tabs defaultValue="security" className="space-y-4">
        <TabsList>
          <TabsTrigger value="security">Security Events</TabsTrigger>
          <TabsTrigger value="auth">Authentication Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {securityLogs?.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getEventTypeBadge(log.event_type)}
                        <span className="font-medium">{log.event_type}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatEventDetails(log.details)}
                      </p>
                      {log.ip_address && (
                        <p className="text-xs text-muted-foreground">IP: {log.ip_address}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {authLogs?.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getEventTypeBadge(log.event_type, log.success)}
                        <span className="font-medium">{log.event_type}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Email: {log.email || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatEventDetails(log.details)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};