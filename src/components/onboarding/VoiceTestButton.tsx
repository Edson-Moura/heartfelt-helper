import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Keyboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceTestButtonProps {
  expectedText?: string;
  onTranscript: (text: string) => void;
  placeholder?: string;
  autoTimeout?: number; // milliseconds before showing typing option
}

export const VoiceTestButton = ({
  expectedText,
  onTranscript,
  placeholder = 'Toque para falar...',
  autoTimeout = 10000,
}: VoiceTestButtonProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [showTypingOption, setShowTypingOption] = useState(false);
  const [isTypingMode, setIsTypingMode] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [timeoutReached, setTimeoutReached] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      stopRecording();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio analysis for volume visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // Start volume monitoring
      monitorVolume();

      // Setup MediaRecorder for actual recording
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await sendToTranscription(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Set timeout to show typing option
      timeoutRef.current = setTimeout(() => {
        setTimeoutReached(true);
        setShowTypingOption(true);
      }, autoTimeout);

      toast({
        title: "Gravando",
        description: "Fale naturalmente...",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Erro ao acessar microfone",
        description: "Verifique as permissões do navegador",
        variant: "destructive",
      });
      setShowTypingOption(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    setIsRecording(false);
    setVolumeLevel(0);
  };

  const monitorVolume = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const checkVolume = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalizedVolume = Math.min((average / 128) * 100, 100);
      
      setVolumeLevel(normalizedVolume);

      // Auto-stop on silence (3 seconds)
      if (normalizedVolume < 5) {
        if (!silenceTimeoutRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            stopRecording();
          }, 3000);
        }
      } else {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      }

      animationFrameRef.current = requestAnimationFrame(checkVolume);
    };

    checkVolume();
  };

  const sendToTranscription = async (audioBlob: Blob) => {
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        // Here you would call your transcription edge function
        // For now, simulating with a timeout
        setTranscript('Simulando transcrição...');
        
        setTimeout(() => {
          const mockTranscript = expectedText || 'Olá, meu nome é João';
          setTranscript(mockTranscript);
          onTranscript(mockTranscript);
        }, 1500);
      };
    } catch (error) {
      console.error('Error transcribing:', error);
      toast({
        title: "Erro na transcrição",
        description: "Tente novamente ou use o modo de digitação",
        variant: "destructive",
      });
      setShowTypingOption(true);
    }
  };

  const handleTypingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = formData.get('text') as string;
    if (text.trim()) {
      onTranscript(text);
    }
  };

  if (isTypingMode) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center space-x-2">
            <Keyboard className="h-5 w-5 text-primary" />
            <span>Modo de Digitação</span>
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsTypingMode(false)}
          >
            Voltar
          </Button>
        </div>
        <form onSubmit={handleTypingSubmit} className="space-y-3">
          <Input
            name="text"
            placeholder={placeholder}
            autoFocus
          />
          <Button type="submit" className="w-full">
            Enviar
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        animate={{
          scale: isRecording ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 1.5,
          repeat: isRecording ? Infinity : 0,
        }}
      >
        <Button
          size="lg"
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-full h-24 text-lg font-semibold relative overflow-hidden ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70'
          }`}
        >
          {/* Pulse animation when idle */}
          {!isRecording && (
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="absolute inset-0 bg-primary/30 rounded-lg"
            />
          )}

          <div className="relative z-10 flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
              {isRecording ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
              <span>
                {isRecording ? 'Toque para parar' : placeholder}
              </span>
            </div>

            {/* Volume indicator */}
            {isRecording && (
              <div className="w-full max-w-xs">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    animate={{ width: `${volumeLevel}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <p className="text-xs mt-1 opacity-80">
                  {volumeLevel > 20 ? 'Gravando... fale!' : 'Aguardando som...'}
                </p>
              </div>
            )}
          </div>
        </Button>
      </motion.div>

      {/* Transcript display */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-4 bg-primary/5">
              <p className="text-sm text-muted-foreground mb-1">Transcrição:</p>
              <p className="text-base">{transcript}</p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typing option */}
      <AnimatePresence>
        {showTypingOption && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Button
              variant="outline"
              onClick={() => setIsTypingMode(true)}
              className="w-full"
            >
              <Keyboard className="h-4 w-4 mr-2" />
              Prefiro digitar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
