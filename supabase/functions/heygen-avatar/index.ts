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
    const { text, avatarId = 'default' } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    const HEYGEN_API_KEY = Deno.env.get('HEYGEN_API_KEY');
    if (!HEYGEN_API_KEY) {
      throw new Error('HEYGEN_API_KEY not configured');
    }

    console.log('HeyGen avatar generation requested', { textLength: text.length, avatarId });

    // Create video generation request
    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type: 'avatar',
            avatar_id: avatarId,
            avatar_style: 'normal'
          },
          voice: {
            type: 'text',
            input_text: text,
            voice_id: 'en-US-JennyNeural'
          }
        }],
        dimension: {
          width: 1280,
          height: 720
        },
        aspect_ratio: '16:9'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HeyGen API error:', response.status, errorText);
      throw new Error(`HeyGen API error: ${response.status}`);
    }

    const data = await response.json();
    const videoId = data.data.video_id;

    console.log('HeyGen video generation started', { videoId });

    // Poll for video completion
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait

    while (!videoUrl && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
        headers: {
          'X-Api-Key': HEYGEN_API_KEY,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (statusData.data.status === 'completed') {
          videoUrl = statusData.data.video_url;
        } else if (statusData.data.status === 'failed') {
          throw new Error('HeyGen video generation failed');
        }
      }
      
      attempts++;
    }

    if (!videoUrl) {
      throw new Error('HeyGen video generation timeout');
    }

    console.log('HeyGen video ready', { videoUrl });

    return new Response(
      JSON.stringify({ 
        videoUrl,
        provider: 'heygen',
        duration: attempts 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('HeyGen avatar error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'heygen'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
