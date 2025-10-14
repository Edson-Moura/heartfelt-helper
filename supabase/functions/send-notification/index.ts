import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userId: string;
  type: 'email' | 'push' | 'both';
  category: 'lesson_reminder' | 'streak_reminder' | 'achievement' | 'daily_goal' | 'weekly_summary';
  title: string;
  body: string;
  metadata?: Record<string, any>;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Email functionality disabled

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      userId,
      type,
      category,
      title,
      body,
      metadata = {}
    }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification to user ${userId}: ${title}`);

    // Get user profile and notification preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, user_id')
      .eq('user_id', userId)
      .single();

    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      console.error('User profile not found');
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const results = [];

    // Email notifications disabled - not configured

    // Send push notification
    if ((type === 'push' || type === 'both') && preferences?.push_enabled) {
      try {
        // Get active push subscriptions for user
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);

        if (subscriptions && subscriptions.length > 0) {
          // Send push notification to all devices
          const pushResults = await Promise.allSettled(
            subscriptions.map(async (subscription) => {
              const response = await fetch('https://web-push-codelab.glitch.me/send-notification', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  subscription: {
                    endpoint: subscription.endpoint,
                    keys: {
                      p256dh: subscription.p256dh,
                      auth: subscription.auth,
                    }
                  },
                  payload: JSON.stringify({
                    title,
                    body,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    data: { category, userId, ...metadata }
                  }),
                  options: {
                    TTL: 24 * 60 * 60 // 24 hours
                  }
                }),
              });

              return response.ok;
            })
          );

          const successCount = pushResults.filter(result => 
            result.status === 'fulfilled' && result.value
          ).length;

          console.log(`Push notifications sent to ${successCount}/${subscriptions.length} devices`);

          // Log push notification
          await supabase.from('notification_logs').insert({
            user_id: userId,
            notification_type: 'push',
            category,
            title,
            body,
            success: successCount > 0,
            metadata: { devices_sent: successCount, total_devices: subscriptions.length, ...metadata }
          });

          results.push({ 
            type: 'push', 
            success: successCount > 0, 
            devicesSent: successCount, 
            totalDevices: subscriptions.length 
          });
        } else {
          console.log('No active push subscriptions found for user');
          results.push({ type: 'push', success: false, error: 'No active devices' });
        }
      } catch (error: any) {
        console.error('Error sending push notification:', error);
        
        // Log failed push notification
        await supabase.from('notification_logs').insert({
          user_id: userId,
          notification_type: 'push',
          category,
          title,
          body,
          success: false,
          error_message: error?.message || 'Unknown error',
          metadata
        });

        results.push({ type: 'push', success: false, error: error?.message || 'Unknown error' });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);