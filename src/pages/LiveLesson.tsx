import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DIDAvatar } from '@/components/DIDAvatar';
import { Mic, MicOff, ArrowLeft } from 'lucide-react';

export default function LiveLesson() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  const [transcript, setTranscript] = useState('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Start with greeting
    handleGreeting();
  }, []);

  const handleGreeting = async () => {
    try {
      const greeting = "Hello! I'm Alex, your English tutor. What would you like to talk about today?";
      setConversationHistory([{ role: 'assistant', content: greeting }]);
      await speakText(greeting);
    } catch (error) {
      console.error('Error with greeting:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Try to use audio/webm with opus codec for better compatibility
      const options: MediaRecorderOptions = { mimeType: 'audio/webm;codecs=opus' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        console.log('Audio blob size:', audioBlob.size, 'type:', audioBlob.type);
        
        if (audioBlob.size < 1000) {
          toast({
            title: "Áudio muito curto",
            description: "Por favor, fale por mais tempo",
            variant: "destructive",
          });
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording",
        description: "Speak now...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      console.log('Processing audio blob:', audioBlob.size, 'bytes');
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      console.log('Converted to base64, length:', base64Audio.length);

      // Speech to Text
      const { data: sttData, error: sttError } = await supabase.functions.invoke('deepgram-stt', {
        body: { audio: base64Audio },
      });

      console.log('STT response:', sttData, sttError);

      if (sttError) throw sttError;

      const userText = sttData.transcript;
      if (!userText || userText.trim() === '') {
        toast({
          title: "Não entendi",
          description: "Tente falar mais alto ou claro",
          variant: "destructive",
        });
        return;
      }

      setTranscript(userText);
      const newHistory = [...conversationHistory, { role: 'user', content: userText }];
      setConversationHistory(newHistory);

      // Get AI response with streaming
      await processStreamingResponse(userText, newHistory);

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process audio",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processStreamingResponse = async (userText: string, history: Array<{role: string, content: string}>) => {
    try {
      const SUPABASE_URL = 'https://yttjiuxjuanyzszlrdwj.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0dGppdXhqdWFueXpzemxyZHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjMzNDQsImV4cCI6MjA3MTg5OTM0NH0.-bGqgv1WY54Yaeit8TVk6HAfit1M3iLvDYy2IzcVKwU';

      const response = await fetch(`${SUPABASE_URL}/functions/v1/openai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userText,
          conversationHistory: history,
          stream: true
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let avatarGenerationStarted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              accumulatedText += content;
              
              // Update conversation with accumulated text
              setConversationHistory([...history, { role: 'assistant', content: accumulatedText }]);

              // Start avatar generation after ~20 words (reduces perceived latency)
              const wordCount = accumulatedText.split(' ').length;
              if (!avatarGenerationStarted && wordCount >= 20) {
                avatarGenerationStarted = true;
                console.log('Starting early avatar generation with partial text:', accumulatedText);
                speakText(accumulatedText);
              }
            }
          } catch (e) {
            // Skip invalid JSON chunks
          }
        }
      }

      // If we haven't started avatar generation yet (short response), do it now
      if (!avatarGenerationStarted && accumulatedText) {
        console.log('Starting avatar generation with complete text:', accumulatedText);
        await speakText(accumulatedText);
      }

      // Final update with complete text
      setConversationHistory([...history, { role: 'assistant', content: accumulatedText }]);

    } catch (error) {
      console.error('Error in streaming response:', error);
      throw error;
    }
  };

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    setIsGeneratingVideo(true);

    try {
      console.log('Starting speakText with:', text);

      // 1) Tentar gerar o vídeo do avatar D-ID primeiro
      const { data: createData, error: createError } = await supabase.functions.invoke('did-avatar', {
        body: {
          text,
          action: 'create',
        },
      });

      if (!createError && createData?.id) {
        const streamId = createData.id;
        console.log('D-ID talk created:', streamId);

        const checkStatus = async () => {
          const { data: statusData, error: statusError } = await supabase.functions.invoke('did-avatar', {
            body: { action: 'status', streamId },
          });

          if (statusError) {
            console.error('D-ID status error:', statusError);
            throw statusError;
          }

          console.log('D-ID status:', statusData.status);

          if (statusData.status === 'done') {
            setVideoUrl(statusData.result_url);
            setIsGeneratingVideo(false);
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          } else if (statusData.status === 'error' || statusData.status === 'failed') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            throw new Error('D-ID generation failed');
          }
        };

        // Start polling every 2s
        pollIntervalRef.current = window.setInterval(checkStatus, 2000);
        return; // Já iniciamos o fluxo do avatar
      }

      console.warn('D-ID unavailable, falling back to ElevenLabs TTS:', createError);

      // 2) Fallback: ElevenLabs TTS (áudio somente)
      const { data: ttsData, error: ttsError } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text, voice: 'Sarah', model: 'eleven_turbo_v2_5' },
      });

      if (ttsError) {
        console.error('ElevenLabs TTS error:', ttsError);
        toast({ title: 'ElevenLabs indisponível', description: 'Verifique a API key do ElevenLabs (401). Usando fallback.', variant: 'destructive' });
        throw new Error('Falha ao gerar áudio');
      }

      setIsGeneratingVideo(false);

      if (ttsData?.audioContent) {
        const audio = new Audio(`data:audio/mpeg;base64,${ttsData.audioContent}`);
        audio.onended = () => setIsSpeaking(false);
        await audio.play();
        toast({ title: 'Modo áudio', description: 'Avatar indisponível. Reproduzindo áudio.' });
        return;
      }

      throw new Error('Resposta de áudio inválida');

    } catch (error) {
      console.error('Error in speakText:', error);
      setIsGeneratingVideo(false);

      // 3) Último recurso: TTS do navegador
      try {
        console.log('Attempting browser TTS as final fallback');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        const voices = window.speechSynthesis.getVoices();
        const maleVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Google US English')));
        if (maleVoice) utterance.voice = maleVoice;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        toast({ title: 'Modo áudio básico', description: 'Usando síntese de voz do navegador.' });
      } catch (fallbackError) {
        console.error('Browser TTS also failed:', fallbackError);
        setIsSpeaking(false);
        toast({ title: 'Erro de áudio', description: 'Não foi possível gerar resposta. Tente novamente.', variant: 'destructive' });
      }
    }
  };
      
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="container max-w-4xl mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="p-8">
          <div className="flex flex-col items-center gap-8">
            <DIDAvatar 
              videoUrl={videoUrl}
              isLoading={isGeneratingVideo}
              isSpeaking={isSpeaking}
              onVideoEnded={() => setIsSpeaking(false)}
            />

            <div className="w-full space-y-4">
              {transcript && (
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-1">You said:</p>
                  <p className="text-foreground">{transcript}</p>
                </div>
              )}

              {conversationHistory.length > 0 && (
                <div className="bg-secondary/10 p-4 rounded-lg max-h-48 overflow-y-auto">
                  <p className="text-sm font-medium mb-2">Conversation:</p>
                  {conversationHistory.slice(-4).map((msg, idx) => (
                    <p key={idx} className="text-sm mb-2">
                      <span className="font-semibold">
                        {msg.role === 'user' ? 'You: ' : 'Alex: '}
                      </span>
                      {msg.content}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <Button
              size="lg"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || isSpeaking}
              className="w-full max-w-xs"
            >
              {isRecording ? (
                <>
                  <MicOff className="mr-2 h-5 w-5" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-5 w-5" />
                  {isProcessing ? 'Processing...' : isSpeaking ? 'Alex is speaking...' : 'Start Recording'}
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
