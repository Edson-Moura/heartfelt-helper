import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DIDAvatar } from '@/components/DIDAvatar';
import { Mic, MicOff, ArrowLeft, Activity, Gauge } from 'lucide-react';
import { cacheService } from '@/services/CacheService';
import { healthCheckService } from '@/services/HealthCheckService';
import { resourcePreloader } from '@/services/ResourcePreloader';
import { fallbackStrategy } from '@/services/FallbackStrategy';
import { requestQueue } from '@/services/RequestQueue';
import { useAdaptiveQuality } from '@/hooks/useAdaptiveQuality';
import { useFreemiumLimits } from '@/hooks/useFreemiumLimits';
import { UpgradeModal } from '@/components/UpgradeModal';
import { logger } from '@/lib/logger';
import { Badge } from '@/components/ui/badge';

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
  const [preloadStats, setPreloadStats] = useState(resourcePreloader.getStats());
  const [conversationStartTime, setConversationStartTime] = useState<number | null>(null);
  const [conversationMinutes, setConversationMinutes] = useState(0);
  
  const { 
    planType,
    limits,
    showUpgradeModal,
    closeUpgradeModal,
    upgradeTrigger,
    triggerUpgrade,
    recordConversationMinutes,
    getConversationMinutesPercentage
  } = useFreemiumLimits();
  
  // 🎯 Adaptive Quality
  const { 
    quality, 
    settings, 
    recordLatency, 
    getRecommendation,
    networkInfo 
  } = useAdaptiveQuality();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Start with greeting
    handleGreeting();
    
    // Start conversation timer
    setConversationStartTime(Date.now());
    
    // Inicia ResourcePreloader
    resourcePreloader.start();
    
    // Cleanup cache periodically
    const cleanupInterval = setInterval(() => {
      cacheService.cleanup();
      setCacheStats(cacheService.getStats());
      setPreloadStats(resourcePreloader.getStats());
    }, 30 * 60 * 1000); // 30 minutos
    
    return () => {
      clearInterval(cleanupInterval);
      healthCheckService.stopPeriodicChecks();
      resourcePreloader.stop();
    };
  }, []);

  // Monitor conversation time for free users
  useEffect(() => {
    if (planType !== 'free' || !conversationStartTime) return;

    const interval = setInterval(() => {
      const elapsedMinutes = Math.floor((Date.now() - conversationStartTime) / 60000);
      setConversationMinutes(elapsedMinutes);

      // Check limit
      if (limits && elapsedMinutes >= limits.limits.dailyConversationMinutes) {
        clearInterval(interval);
        
        // Stop any ongoing recording/speaking
        if (isRecording) {
          stopRecording();
        }
        
        // Show upgrade modal
        triggerUpgrade(
          'conversation_limit',
          `Você praticou ${elapsedMinutes} minutos hoje! Continue sem limites com Premium.`
        );
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [planType, conversationStartTime, limits, isRecording]);

  // Record conversation time when leaving page
  useEffect(() => {
    return () => {
      if (conversationStartTime && planType === 'free') {
        const minutes = Math.floor((Date.now() - conversationStartTime) / 60000);
        if (minutes > 0) {
          recordConversationMinutes(minutes);
        }
      }
    };
  }, [conversationStartTime, planType]);

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
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'apikey': SUPABASE_ANON_KEY,
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
      logger.info('Avatar: Generation started', { 
        textLength: text.length,
        quality: quality,
        useVideo: settings.useVideo 
      }, 'LiveLesson');

      // 🎯 CACHE CHECK: Verifica se temos resposta cacheada
      const cached = cacheService.get(text);
      if (cached) {
        logger.info('Avatar: Cache hit', undefined, 'LiveLesson');
        
        if (cached.videoUrl && settings.useVideo) {
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

      // 🎯 FALLBACK STRATEGY: Usa fallback inteligente com FallbackStrategy
      const result = await requestQueue.enqueue<any>(
        async () => {
          return await fallbackStrategy.executeWithFallback<string>(
            'avatar',
            new Map([
              ['did', async () => {
                if (!settings.useVideo) throw new Error('Video disabled by quality settings');
                
                const { data: createData, error: createError } = await supabase.functions.invoke('did-avatar', {
                  body: { text, action: 'create' }
                });
                
                if (createError || !createData?.id) throw createError || new Error('No stream ID');
                
                const streamId = createData.id;
                logger.debug('D-ID: Talk created', { streamId }, 'LiveLesson');

                // Poll status
                return new Promise((resolve, reject) => {
                  const checkStatus = async () => {
                    const { data: statusData, error: statusError } = await supabase.functions.invoke('did-avatar', {
                      body: { action: 'status', streamId }
                    });

                    if (statusError) {
                      clearInterval(pollIntervalRef.current!);
                      reject(statusError);
                      return;
                    }

                    if (statusData.status === 'done') {
                      clearInterval(pollIntervalRef.current!);
                      pollIntervalRef.current = null;
                      resolve(statusData.result_url);
                    } else if (statusData.status === 'error' || statusData.status === 'failed') {
                      clearInterval(pollIntervalRef.current!);
                      pollIntervalRef.current = null;
                      reject(new Error('D-ID generation failed'));
                    }
                  };

                  pollIntervalRef.current = window.setInterval(checkStatus, 2000);
                  setTimeout(() => {
                    if (pollIntervalRef.current) {
                      clearInterval(pollIntervalRef.current);
                      pollIntervalRef.current = null;
                      reject(new Error('D-ID timeout'));
                    }
                  }, settings.maxLatencyMs);
                });
              }],
              ['heygen', async () => {
                if (!settings.useVideo) throw new Error('Video disabled by quality settings');
                
                const { data, error } = await supabase.functions.invoke('heygen-avatar', {
                  body: { text }
                });
                
                if (error) throw error;
                if (!data?.videoUrl) throw new Error('No video URL');
                return data.videoUrl;
              }],
              ['elevenlabs', async () => {
                const modelToUse = settings.useHighQualityAudio ? 'eleven_turbo_v2_5' : 'eleven_turbo_v2';
                
                const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
                  body: { text, voice: 'Sarah', model: modelToUse }
                });
                
                if (error) throw error;
                if (!data?.audioContent) throw new Error('No audio content');
                return `data:audio/mpeg;base64,${data.audioContent}`;
              }],
              ['nvidia', async () => {
                const { data, error } = await supabase.functions.invoke('nvidia-tts', {
                  body: { text }
                });
                
                if (error) throw error;
                if (!data?.audioContent) throw new Error('No audio content');
                return `data:audio/wav;base64,${data.audioContent}`;
              }],
              ['azure', async () => {
                const { data, error } = await supabase.functions.invoke('azure-tts', {
                  body: { text }
                });
                
                if (error) throw error;
                if (!data?.audioContent) throw new Error('No audio content');
                return `data:audio/wav;base64,${data.audioContent}`;
              }],
              ['browser', async () => {
                return new Promise((resolve) => {
                  const utterance = new SpeechSynthesisUtterance(text);
                  utterance.lang = 'en-US';
                  utterance.rate = 0.9;
                  utterance.pitch = 1.0;
                  const voices = window.speechSynthesis.getVoices();
                  const maleVoice = voices.find(v => v.lang.startsWith('en'));
                  if (maleVoice) utterance.voice = maleVoice;
                  utterance.onend = () => resolve('browser-tts');
                  utterance.onerror = () => resolve('browser-tts');
                  window.speechSynthesis.speak(utterance);
                });
              }]
            ])
          );
        },
        { priority: 'high', timeout: settings.maxLatencyMs }
      );

      const totalLatency = Date.now() - startTime;
      recordLatency(totalLatency);

      logger.info('Avatar/TTS completed', {
        provider: result.provider,
        latency: result.latency,
        fallbackUsed: result.fallbackUsed,
        fallbackLevel: result.fallbackLevel,
        quality: quality
      }, 'LiveLesson');

      setIsGeneratingVideo(false);

      // Processar resultado baseado no provider
      if (result.provider === 'did' || result.provider === 'heygen') {
        setVideoUrl(result.result as string);
        cacheService.set(text, result.result as string);
        toast({
          title: '✅ Vídeo gerado',
          description: `Provider: ${result.provider} ${result.fallbackUsed ? '(fallback)' : ''}`,
        });
      } else if (result.provider === 'browser') {
        setIsSpeaking(false);
        toast({
          title: 'Modo áudio básico',
          description: 'Usando síntese de voz do navegador',
        });
      } else {
        // Audio providers (elevenlabs, nvidia, azure)
        const audio = new Audio(result.result as string);
        audio.onended = () => setIsSpeaking(false);
        await audio.play();
        cacheService.set(text, undefined, result.result as string);
        toast({
          title: '🎵 Áudio gerado',
          description: `Provider: ${result.provider} ${result.fallbackUsed ? '(fallback)' : ''}`,
        });
      }

      setCacheStats(cacheService.getStats());

    } catch (error) {
      logger.error('Avatar/TTS: All methods failed', {
        error: error instanceof Error ? error.message : 'Unknown'
      }, 'LiveLesson');
      setIsGeneratingVideo(false);
      setIsSpeaking(false);
      toast({
        title: 'Erro de geração',
        description: 'Não foi possível gerar resposta. Tente novamente.',
        variant: 'destructive'
      });
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
    <>
      <UpgradeModal 
        open={showUpgradeModal}
        onClose={closeUpgradeModal}
        trigger={upgradeTrigger}
        context={{
          current: conversationMinutes,
          limit: limits?.limits.dailyConversationMinutes || 5,
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="container max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          {planType === 'free' && limits && (
            <Badge variant="secondary" className="text-xs">
              ⏱️ {conversationMinutes}/{limits.limits.dailyConversationMinutes} min hoje
            </Badge>
          )}
        </div>

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

            {/* System Stats */}
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">System Status</span>
              </div>
              
              {/* Cache Stats */}
              <div className="mb-3 pb-3 border-b border-primary/10">
                <p className="text-xs font-medium text-muted-foreground mb-2">Cache</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Hit Rate:</span>
                    <span className="ml-1 font-semibold text-primary">{cacheStats.hitRate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Saved:</span>
                    <span className="ml-1 font-semibold text-green-600">${cacheStats.savedCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Preload Stats */}
              <div className="mb-3 pb-3 border-b border-primary/10">
                <p className="text-xs font-medium text-muted-foreground mb-2">Preload</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Preloaded:</span>
                    <span className="ml-1 font-semibold text-primary">{preloadStats.totalPreloaded}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Success:</span>
                    <span className="ml-1 font-semibold text-green-600">
                      {preloadStats.totalPreloaded > 0 
                        ? Math.round((preloadStats.successCount / preloadStats.totalPreloaded) * 100) 
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Quality Monitor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">Adaptive Quality</p>
                  <Badge 
                    variant={quality === 'high' ? 'default' : quality === 'medium' ? 'secondary' : 'outline'}
                    className="text-xs px-2 py-0.5"
                  >
                    {quality.toUpperCase()}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Video:</span>
                    <span className="ml-1 font-semibold">{settings.useVideo ? 'ON' : 'OFF'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Network:</span>
                    <span className="ml-1 font-semibold">{networkInfo.effectiveType || '4g'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
    </>
  );
}
