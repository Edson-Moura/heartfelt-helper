import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DIDAvatar } from '@/components/DIDAvatar';
import { Mic, MicOff, ArrowLeft, Activity } from 'lucide-react';
import { cacheService } from '@/services/CacheService';
import { healthCheckService } from '@/services/HealthCheckService';
import { logger } from '@/lib/logger';

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
  const [cacheStats, setCacheStats] = useState(cacheService.getStats());
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Start with greeting
    handleGreeting();
    
    // Cleanup cache periodically
    const cleanupInterval = setInterval(() => {
      cacheService.cleanup();
      setCacheStats(cacheService.getStats());
    }, 30 * 60 * 1000); // 30 minutos
    
    return () => {
      clearInterval(cleanupInterval);
      healthCheckService.stopPeriodicChecks();
    };
  }, []);

  const handleGreeting = async () => {
    try {
      logger.info('LiveLesson: Greeting started', undefined, 'LiveLesson');
      const greeting = "Hello! I'm Alex, your English tutor. What would you like to talk about today?";
      setConversationHistory([{ role: 'assistant', content: greeting }]);
      await speakText(greeting);
    } catch (error) {
      logger.error('LiveLesson: Greeting failed', { 
        error: error instanceof Error ? error.message : 'Unknown' 
      }, 'LiveLesson');
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
        logger.debug('Audio recording stopped', { 
          blobSize: audioBlob.size,
          blobType: audioBlob.type 
        }, 'LiveLesson');
        
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
      logger.error('Recording start failed', { 
        error: error instanceof Error ? error.message : 'Unknown' 
      }, 'LiveLesson');
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
    const startTime = Date.now();
    setIsProcessing(true);
    
    try {
      logger.info('Audio processing started', { 
        blobSize: audioBlob.size 
      }, 'LiveLesson');
      
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

      logger.debug('Audio converted to base64', { 
        base64Length: base64Audio.length 
      }, 'LiveLesson');

      // Speech to Text
      const sttStart = Date.now();
      const { data: sttData, error: sttError } = await supabase.functions.invoke('deepgram-stt', {
        body: { audio: base64Audio },
      });

      if (sttError) {
        logger.error('STT failed', { error: sttError.message }, 'LiveLesson');
        healthCheckService.reportFailure('deepgram', sttError.message);
        throw sttError;
      }

      const sttDuration = Date.now() - sttStart;
      const userText = sttData.transcript;
      logger.info('STT completed', { 
        duration: sttDuration,
        textLength: userText?.length || 0 
      }, 'LiveLesson');
      healthCheckService.reportSuccess('deepgram', sttDuration);
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

      const totalDuration = Date.now() - startTime;
      logger.info('Audio processing completed', { 
        totalDuration,
        cacheStats: cacheService.getStats() 
      }, 'LiveLesson');

    } catch (error) {
      logger.error('Audio processing failed', { 
        error: error instanceof Error ? error.message : 'Unknown' 
      }, 'LiveLesson');
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
    const aiStart = Date.now();
    try {
      logger.info('AI streaming started', undefined, 'LiveLesson');
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
                logger.info('AI: Early avatar generation triggered', { 
                  wordCount,
                  textLength: accumulatedText.length 
                }, 'LiveLesson');
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
        logger.debug('AI: Avatar generation with complete text', { 
          textLength: accumulatedText.length 
        }, 'LiveLesson');
        await speakText(accumulatedText);
      }

      // Final update with complete text
      setConversationHistory([...history, { role: 'assistant', content: accumulatedText }]);

      const aiDuration = Date.now() - aiStart;
      logger.info('AI streaming completed', { 
        duration: aiDuration,
        responseLength: accumulatedText.length 
      }, 'LiveLesson');
      healthCheckService.reportSuccess('openai', aiDuration);

    } catch (error) {
      logger.error('AI streaming failed', { 
        error: error instanceof Error ? error.message : 'Unknown' 
      }, 'LiveLesson');
      healthCheckService.reportFailure('openai', error instanceof Error ? error.message : 'Unknown');
      throw error;
    }
  };

  const speakText = async (text: string) => {
    const startTime = Date.now();
    setIsSpeaking(true);
    setIsGeneratingVideo(true);

    try {
      logger.info('Avatar: Generation started', { textLength: text.length }, 'LiveLesson');

      // 🎯 CACHE CHECK: Verifica se temos resposta cacheada
      const cached = cacheService.get(text);
      if (cached) {
        logger.info('Avatar: Cache hit', undefined, 'LiveLesson');
        
        if (cached.videoUrl) {
          setVideoUrl(cached.videoUrl);
          setIsGeneratingVideo(false);
          toast({
            title: '⚡ Resposta instantânea',
            description: 'Usando resposta cacheada',
          });
          return;
        } else if (cached.audioUrl) {
          const audio = new Audio(cached.audioUrl);
          audio.onended = () => setIsSpeaking(false);
          await audio.play();
          setIsGeneratingVideo(false);
          return;
        }
      }

      // 1) Tentar gerar o vídeo do avatar D-ID primeiro
      const { data: createData, error: createError } = await supabase.functions.invoke('did-avatar', {
        body: {
          text,
          action: 'create',
        },
      });

      if (!createError && createData?.id) {
        const streamId = createData.id;
        logger.debug('D-ID: Talk created', { streamId }, 'LiveLesson');

        const checkStatus = async () => {
          const { data: statusData, error: statusError } = await supabase.functions.invoke('did-avatar', {
            body: { action: 'status', streamId },
          });

          if (statusError) {
            logger.error('D-ID: Status check failed', { error: statusError.message }, 'LiveLesson');
            throw statusError;
          }

          logger.debug('D-ID: Status update', { status: statusData.status }, 'LiveLesson');

          if (statusData.status === 'done') {
            const totalLatency = Date.now() - startTime;
            setVideoUrl(statusData.result_url);
            setIsGeneratingVideo(false);
            
            // ✅ Reporta sucesso e cacheia
            logger.info('D-ID: Generation completed', { 
              latency: totalLatency,
              videoUrl: statusData.result_url.substring(0, 50) + '...' 
            }, 'LiveLesson');
            healthCheckService.reportSuccess('did', totalLatency);
            cacheService.set(text, statusData.result_url);
            setCacheStats(cacheService.getStats());
            
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          } else if (statusData.status === 'error' || statusData.status === 'failed') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            
            // ❌ Reporta falha
            logger.warn('D-ID: Generation failed', { status: statusData.status }, 'LiveLesson');
            healthCheckService.reportFailure('did', 'Generation failed');
            throw new Error('D-ID generation failed');
          }
        };

        // Start polling every 2s
        pollIntervalRef.current = window.setInterval(checkStatus, 2000);
        return; // Já iniciamos o fluxo do avatar
      }

      logger.warn('D-ID: Unavailable, using TTS fallback', { 
        error: createError?.message 
      }, 'LiveLesson');
      
      // ❌ Reporta falha do D-ID
      healthCheckService.reportFailure('did', createError?.message || 'Unknown error');

      // 2) Fallback: ElevenLabs TTS (áudio somente)
      const ttsStart = Date.now();
      const { data: ttsData, error: ttsError } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text, voice: 'Sarah', model: 'eleven_turbo_v2_5' },
      });

      if (ttsError) {
        logger.error('TTS: ElevenLabs failed', { error: ttsError.message }, 'LiveLesson');
        healthCheckService.reportFailure('elevenlabs', ttsError?.message || 'Unknown error');
        toast({ title: 'ElevenLabs indisponível', description: 'Verifique a API key do ElevenLabs (401). Usando fallback.', variant: 'destructive' });
        throw new Error('Falha ao gerar áudio');
      }

      setIsGeneratingVideo(false);

      if (ttsData?.audioContent) {
        const audioUrl = `data:audio/mpeg;base64,${ttsData.audioContent}`;
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsSpeaking(false);
        await audio.play();
        
        // ✅ Reporta sucesso e cacheia
        const ttsDuration = Date.now() - ttsStart;
        logger.info('TTS: ElevenLabs completed', { 
          duration: ttsDuration 
        }, 'LiveLesson');
        healthCheckService.reportSuccess('elevenlabs', ttsDuration);
        cacheService.set(text, undefined, audioUrl);
        setCacheStats(cacheService.getStats());
        
        toast({ title: 'Modo áudio', description: 'Avatar indisponível. Reproduzindo áudio.' });
        return;
      }

      throw new Error('Resposta de áudio inválida');

    } catch (error) {
      logger.error('Avatar: All methods failed, using browser TTS', { 
        error: error instanceof Error ? error.message : 'Unknown' 
      }, 'LiveLesson');
      setIsGeneratingVideo(false);

      // 3) Último recurso: TTS do navegador
      try {
        logger.debug('TTS: Browser fallback', undefined, 'LiveLesson');
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
        logger.error('TTS: Browser fallback failed', { 
          error: fallbackError instanceof Error ? fallbackError.message : 'Unknown' 
        }, 'LiveLesson');
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

            {/* Cache Stats Badge */}
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">System Status</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Cache Hit Rate:</span>
                  <span className="ml-1 font-semibold text-primary">{cacheStats.hitRate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Saved:</span>
                  <span className="ml-1 font-semibold text-green-600">${cacheStats.savedCost.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Hits:</span>
                  <span className="ml-1 font-semibold">{cacheStats.hits}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cached:</span>
                  <span className="ml-1 font-semibold">{cacheStats.size}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
