import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AvatarIntroProps {
  message: string;
  onComplete?: () => void;
  autoPlay?: boolean;
  avatarEmoji?: string;
}

export const AvatarIntro = ({
  message,
  onComplete,
  autoPlay = true,
  avatarEmoji = '👨‍🏫',
}: AvatarIntroProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [messageComplete, setMessageComplete] = useState(false);

  useEffect(() => {
    if (!autoPlay) return;

    // Start speaking animation
    setIsSpeaking(true);

    // Typewriter effect for message
    let charIndex = 0;
    const typeInterval = setInterval(() => {
      if (charIndex <= message.length) {
        setDisplayedMessage(message.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setMessageComplete(true);
        
        // Stop speaking after message is done
        setTimeout(() => {
          setIsSpeaking(false);
          if (onComplete) {
            setTimeout(() => onComplete(), 500);
          }
        }, 800);
      }
    }, 40);

    return () => clearInterval(typeInterval);
  }, [message, autoPlay, onComplete]);

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Avatar with speaking animation */}
      <div className="relative">
        <motion.div
          animate={{
            scale: isSpeaking ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: 0.6,
            repeat: isSpeaking ? Infinity : 0,
            ease: "easeInOut",
          }}
          className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-6xl shadow-2xl"
        >
          {avatarEmoji}
        </motion.div>

        {/* Speaking indicator rings */}
        <AnimatePresence>
          {isSpeaking && (
            <>
              <motion.div
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute inset-0 rounded-full border-4 border-primary"
              />
              <motion.div
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.5,
                  ease: "easeOut",
                }}
                className="absolute inset-0 rounded-full border-4 border-primary"
              />
            </>
          )}
        </AnimatePresence>

        {/* Sound wave indicator */}
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -right-2 top-1/2 -translate-y-1/2"
          >
            <div className="flex items-center space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scaleY: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                  className="w-1 h-4 bg-primary rounded-full"
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Speech bubble */}
      <Card className="relative max-w-md p-6 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-lg">
        {/* Speech bubble pointer */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card rotate-45 border-l border-t border-border" />

        <div className="flex items-start space-x-3">
          <Volume2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-lg leading-relaxed">
              {displayedMessage}
              {!messageComplete && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block ml-1"
                >
                  |
                </motion.span>
              )}
            </p>
          </div>
        </div>

        {/* Alex label */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-3 pt-3 border-t border-border"
        >
          <p className="text-xs text-muted-foreground font-semibold flex items-center space-x-1">
            <span>{avatarEmoji}</span>
            <span>Alex - Seu Professor Virtual</span>
          </p>
        </motion.div>
      </Card>
    </div>
  );
};
