import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface DIDAvatarProps {
  videoUrl?: string;
  isLoading?: boolean;
  isSpeaking?: boolean;
  onVideoEnded?: () => void;
}

export const DIDAvatar = ({ videoUrl, isLoading, isSpeaking, onVideoEnded }: DIDAvatarProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.src = videoUrl;
      videoRef.current.load();
      setIsVideoReady(false);
    }
  }, [videoUrl]);

  const handleCanPlay = () => {
    setIsVideoReady(true);
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error('Error playing video:', error);
      });
    }
  };

  const handleVideoEnded = () => {
    setIsVideoReady(false);
    onVideoEnded?.();
  };

  return (
    <Card className="relative w-full max-w-md aspect-video overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating avatar response...</p>
          </div>
        </div>
      )}
      
      {videoUrl ? (
        <>
          {!isVideoReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            onCanPlay={handleCanPlay}
            onEnded={handleVideoEnded}
            playsInline
            muted={false}
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/30" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {isSpeaking ? 'Avatar is speaking...' : 'Ready to start'}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
