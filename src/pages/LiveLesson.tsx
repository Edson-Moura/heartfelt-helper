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

      // Get AI response
      const { data: chatData, error: chatError } = await supabase.functions.invoke('openai-chat', {
        body: {
          message: userText,
          conversationHistory: newHistory
        },
      });

      if (chatError) throw chatError;

      const aiReply = chatData.reply;
      setConversationHistory([...newHistory, { role: 'assistant', content: aiReply }]);

      // Speak the response
      await speakText(aiReply);

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

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    setIsGeneratingVideo(true);
    
    try {
      // Try to create D-ID video
      const { data: createData, error: createError } = await supabase.functions.invoke('did-avatar', {
        body: {
          text,
          action: 'create',
          agentId: 'v2_agt_de8FJ2DY'
        },
      });

      // If D-ID fails, fall back to audio-only with Nvidia TTS
      if (createError || !createData || !createData.id) {
        console.warn('D-ID unavailable, falling back to Nvidia TTS:', createError);
        
        const { data: ttsData, error: ttsError } = await supabase.functions.invoke('nvidia-tts', {
          body: { text },
        });

        if (ttsError) {
          console.error('Nvidia TTS failed:', ttsError);
          throw new Error('Serviços de áudio temporariamente indisponíveis');
        }
        
        setIsGeneratingVideo(false);
        
        // Check if we should use browser TTS or received audio
        if (ttsData.useBrowserTTS) {
          console.log('Using browser TTS fallback');
          
          // Use browser speech synthesis
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'en-US';
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          
          // Get male voice if available
          const voices = window.speechSynthesis.getVoices();
          const maleVoice = voices.find(v => 
            v.lang.startsWith('en') && 
            (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Google US English'))
          );
          
          if (maleVoice) {
            utterance.voice = maleVoice;
          }
          
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => {
            setIsSpeaking(false);
            toast({
              title: "Erro de áudio",
              description: "Não foi possível reproduzir o áudio.",
              variant: "destructive",
            });
          };
          
          window.speechSynthesis.speak(utterance);
          
          toast({
            title: "Modo áudio",
            description: "Avatar indisponível. Usando síntese de voz.",
          });
        } else if (ttsData.audioContent) {
          // Use provided audio
          const audio = new Audio(`data:audio/wav;base64,${ttsData.audioContent}`);
          audio.onended = () => setIsSpeaking(false);
          await audio.play();
          
          toast({
            title: "Modo áudio",
            description: "Avatar indisponível. Usando áudio Nvidia.",
          });
        } else {
          throw new Error('Resposta de áudio inválida');
        }
        
        return;
      }

      const streamId = createData.id;
      const sessionId = createData.session_id;
      console.log('D-ID stream created:', streamId, sessionId);

      const checkStatus = async () => {
        const { data: statusData, error: statusError } = await supabase.functions.invoke('did-avatar', {
          body: {
            action: 'status',
            streamId,
            sessionId,
            agentId: 'v2_agt_de8FJ2DY'
          },
        });

        if (statusError) throw statusError;

        console.log('D-ID status:', statusData.status);

        if (statusData.status === 'done') {
          setVideoUrl(statusData.result_url);
          setIsGeneratingVideo(false);
          // Video will play automatically and isSpeaking will be set to false when it ends
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        } else if (statusData.status === 'error') {
          throw new Error('D-ID generation failed');
        }
      };

      // Start polling
      pollIntervalRef.current = window.setInterval(checkStatus, 2000);
      
    } catch (error) {
      console.error('Error in speakText:', error);
      setIsSpeaking(false);
      setIsGeneratingVideo(false);
      
      // Try browser speech synthesis as last resort
      try {
        console.log('Attempting browser TTS as final fallback');
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        // Get male voice if available
        const voices = window.speechSynthesis.getVoices();
        const maleVoice = voices.find(v => 
          v.lang.startsWith('en') && 
          (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Google US English'))
        );
        
        if (maleVoice) {
          utterance.voice = maleVoice;
        }
        
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
        
        toast({
          title: "Modo áudio básico",
          description: "Usando síntese de voz do navegador.",
        });
        return;
      } catch (fallbackError) {
        console.error('Browser TTS also failed:', fallbackError);
      }
      
      toast({
        title: "Erro de áudio",
        description: "Não foi possível gerar resposta. Tente novamente.",
        variant: "destructive",
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
