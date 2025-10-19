import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Activity, Send, Timer, DollarSign, Info } from 'lucide-react';
import { logger } from '@/lib/logger';

export const AnalyticsDebugPanel = () => {
  const { track, trackPage, timeEvent, trackRevenue, isInitialized, provider } = useAnalytics();
  const [eventName, setEventName] = useState('test_event');
  const [eventProperties, setEventProperties] = useState('{}');
  const [pageName, setPageName] = useState('Test Page');
  const [revenueAmount, setRevenueAmount] = useState('99.99');
  const [timedEvent, setTimedEvent] = useState('');

  const handleTrackEvent = () => {
    try {
      const properties = JSON.parse(eventProperties);
      track(eventName, properties);
      logger.info('Debug: Event tracked', { eventName, properties }, 'AnalyticsDebugPanel');
    } catch (error) {
      logger.error('Debug: Invalid JSON', { error }, 'AnalyticsDebugPanel');
    }
  };

  const handleTrackPage = () => {
    trackPage(pageName);
    logger.info('Debug: Page tracked', { pageName }, 'AnalyticsDebugPanel');
  };

  const handleStartTimer = () => {
    if (!timedEvent) return;
    timeEvent(timedEvent);
    logger.info('Debug: Timer started', { event: timedEvent }, 'AnalyticsDebugPanel');
  };

  const handleTrackRevenue = () => {
    const amount = parseFloat(revenueAmount);
    if (isNaN(amount)) return;
    trackRevenue(amount, { type: 'test' });
    logger.info('Debug: Revenue tracked', { amount }, 'AnalyticsDebugPanel');
  };

  const recentLogs = logger.getRecentLogs()
    .filter(log => {
      const component = log.context?.component;
      return component === 'AnalyticsService' || component === 'useAnalytics';
    })
    .slice(-10)
    .reverse();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Analytics Debug Panel
            </CardTitle>
            <CardDescription>
              Test and debug analytics integration
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={isInitialized ? 'default' : 'secondary'}>
              {isInitialized ? 'Initialized' : 'Not Initialized'}
            </Badge>
            <Badge variant="outline">{provider}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="my_custom_event"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventProperties">Properties (JSON)</Label>
              <Input
                id="eventProperties"
                value={eventProperties}
                onChange={(e) => setEventProperties(e.target.value)}
                placeholder='{"key": "value"}'
              />
            </div>

            <Button onClick={handleTrackEvent} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Track Event
            </Button>

            <div className="pt-4 border-t space-y-2">
              <Label htmlFor="timedEvent">Timed Event</Label>
              <div className="flex gap-2">
                <Input
                  id="timedEvent"
                  value={timedEvent}
                  onChange={(e) => setTimedEvent(e.target.value)}
                  placeholder="lesson_completion"
                />
                <Button onClick={handleStartTimer} variant="outline">
                  <Timer className="h-4 w-4 mr-2" />
                  Start Timer
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pages" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pageName">Page Name</Label>
              <Input
                id="pageName"
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                placeholder="Home Page"
              />
            </div>

            <Button onClick={handleTrackPage} className="w-full">
              <Activity className="h-4 w-4 mr-2" />
              Track Page View
            </Button>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="revenueAmount">Amount</Label>
              <Input
                id="revenueAmount"
                type="number"
                step="0.01"
                value={revenueAmount}
                onChange={(e) => setRevenueAmount(e.target.value)}
                placeholder="99.99"
              />
            </div>

            <Button onClick={handleTrackRevenue} className="w-full">
              <DollarSign className="h-4 w-4 mr-2" />
              Track Revenue
            </Button>
          </TabsContent>

          <TabsContent value="logs" className="space-y-2">
            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No analytics logs yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentLogs.map((log, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-muted text-sm font-mono"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={
                        log.level === 'error' ? 'destructive' :
                        log.level === 'warn' ? 'secondary' : 'default'
                      }>
                        {log.level}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-foreground">{log.event}</div>
                    {Object.keys(log.context).length > 0 && (
                      <pre className="text-xs mt-2 text-muted-foreground overflow-x-auto">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
