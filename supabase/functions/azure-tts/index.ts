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
    const { text, voice = 'en-US-JennyNeural', rate = '1.0', pitch = '0' } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    const AZURE_TTS_KEY = Deno.env.get('AZURE_TTS_KEY');
    const AZURE_TTS_REGION = Deno.env.get('AZURE_TTS_REGION') || 'eastus';

    if (!AZURE_TTS_KEY) {
      throw new Error('AZURE_TTS_KEY not configured');
    }

    console.log('Azure TTS requested', { textLength: text.length, voice });

    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${voice}">
          <prosody rate="${rate}" pitch="${pitch}Hz">
            ${text}
          </prosody>
        </voice>
      </speak>
    `;

    const response = await fetch(
      `https://${AZURE_TTS_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_TTS_KEY,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
        },
        body: ssml,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure TTS API error:', response.status, errorText);
      throw new Error(`Azure TTS API error: ${response.status}`);
    }

    const audioArrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioArrayBuffer))
    );

    console.log('Azure TTS audio generated', { size: audioArrayBuffer.byteLength });

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        provider: 'azure',
        format: 'mp3'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Azure TTS error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'azure'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
