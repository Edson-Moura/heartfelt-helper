import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { text, action, agentId, streamId, sessionId } = body || {};
    const DID_API_KEY = Deno.env.get('DID_API_KEY');

    console.log('DID Avatar request:', { action, hasText: !!text, streamId, sessionId });

    if (!DID_API_KEY) {
      console.error('DID_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'DID service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build Authorization header for D-ID. Support multiple secret formats safely.
    // Accepted secret formats:
    // 1) Raw API key that should be used as the Basic payload directly (already base64-encoded)
    // 2) "username:password" → must be base64-encoded as-is
    // 3) Raw API key (non-base64) → encode as `${key}:`
    const key = DID_API_KEY.trim();
    let authValue: string;
    if (key.toLowerCase().startsWith('basic ')) {
      // Full header value provided
      authValue = key.slice(6).trim();
    } else if (key.includes(':')) {
      // username:password provided
      authValue = btoa(key);
    } else if (/^[A-Za-z0-9+/=]+$/.test(key)) {
      // Looks base64 already → use as-is
      authValue = key;
    } else {
      // Fallback: encode `${key}:`
      authValue = btoa(`${key}:`);
    }

    const headers = {
      'Authorization': `Basic ${authValue}`,
      'Content-Type': 'application/json',
    } as const;

    // Create async talk using /talks (not Agents streaming)
    if (action === 'create') {
      const sourceUrl = (body && (body as any).sourceUrl) || 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/image.jpeg';

      console.log('Creating D-ID talk via /talks with source:', sourceUrl);
      console.log('Using API key (first 10 chars):', authValue.substring(0, 10));

      const requestBody = {
        script: {
          type: 'text',
          input: text,
          provider: {
            type: 'microsoft',
            voice_id: 'en-US-JennyNeural'
          }
        },
        config: {
          fluent: true,
          pad_audio: 0,
          stitch: true,
          result_format: 'mp4'
        },
        source_url: sourceUrl
      };

      console.log('Request body:', JSON.stringify(requestBody));

      const response = await fetch('https://api.d-id.com/talks', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('D-ID API error (create /talks):', response.status, errorText);
        
        let errorMessage = 'Failed to generate avatar video';
        if (response.status === 401 || response.status === 403) {
          errorMessage = 'D-ID authentication failed. Please check API key configuration.';
        } else if (response.status === 500) {
          errorMessage = 'D-ID service is temporarily unavailable. Please try again.';
        }
        
        return new Response(JSON.stringify({ 
          error: errorMessage, 
          status: response.status, 
          details: errorText 
        }), {
          status: response.status >= 500 ? 503 : response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const data = await response.json();
      console.log('D-ID talk created:', data);

      // normalize shape for frontend compatibility (expects id and session_id)
      return new Response(JSON.stringify({ ...data, session_id: data.session_id ?? null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get talk status for /talks
    if (action === 'status') {
      const response = await fetch(
        `https://api.d-id.com/talks/${streamId}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Basic ${authValue}` },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('D-ID status error (/talks):', response.status, errorText);
        return new Response(JSON.stringify({ error: 'D-ID status error', status: response.status, details: errorText }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const data = await response.json();
      const mappedStatus = data.status === 'completed' ? 'done' : data.status;
      const normalized = { ...data, status: mappedStatus };
      console.log('D-ID status (/talks):', normalized.status);

      return new Response(JSON.stringify(normalized), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('D-ID API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
