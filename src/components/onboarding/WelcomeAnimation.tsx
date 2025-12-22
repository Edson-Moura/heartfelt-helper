import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface WelcomeAnimationProps {
  onComplete: () => void;
}

export const WelcomeAnimation = ({ onComplete }: WelcomeAnimationProps) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const welcomeText = 'Bem-vindo ao MyEnglish!';
  const subtitle = 'Vamos começar sua jornada de aprendizado';

  useEffect(() => {
    if (skipped) return;

    const timers: NodeJS.Timeout[] = [];

    // Phase 0: Logo fade in (1s)
    if (currentPhase === 0) {
      timers.push(setTimeout(() => setCurrentPhase(1), 1000));
    }

    // Phase 1: Typewriter effect (2s)
    if (currentPhase === 1) {
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        if (charIndex <= welcomeText.length) {
          setDisplayText(welcomeText.slice(0, charIndex));
          charIndex++;
        } else {
          clearInterval(typeInterval);
          setCurrentPhase(2);
        }
      }, 80);
      timers.push(typeInterval as unknown as NodeJS.Timeout);
    }

    // Phase 2: Subtitle fade in + confetti (1s)
    if (currentPhase === 2) {
      setShowConfetti(true);
      timers.push(setTimeout(() => setCurrentPhase(3), 1500));
    }

    // Phase 3: Complete
    if (currentPhase === 3) {
      timers.push(setTimeout(() => onComplete(), 800));
    }

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [currentPhase, skipped, onComplete]);

  const handleSkip = () => {
    setSkipped(true);
    onComplete();
  };

  if (skipped || currentPhase === 3) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center"
      >
        {/* Skip button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Pular
        </Button>

        <div className="text-center space-y-8">
          {/* Logo */}
          {currentPhase >= 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex justify-center"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/30">
                <span className="text-5xl">📚</span>
              </div>
            </motion.div>
          )}

          {/* Typewriter Text */}
          {currentPhase >= 1 && (
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {displayText}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block ml-1"
                >
                  |
                </motion.span>
              </h1>

              {/* Subtitle */}
              {currentPhase >= 2 && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-xl text-muted-foreground"
                >
                  {subtitle}
                </motion.p>
              )}
            </div>
          )}

          {/* Confetti */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: Math.random() * window.innerWidth,
                    y: -20,
                    rotate: 0,
                    opacity: 1,
                  }}
                  animate={{
                    y: window.innerHeight + 100,
                    rotate: Math.random() * 720 - 360,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    ease: "easeIn",
                    delay: Math.random() * 0.5,
                  }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: [
                      '#FF6B6B',
                      '#4ECDC4',
                      '#45B7D1',
                      '#FFA07A',
                      '#98D8C8',
                      '#FFD93D',
                    ][Math.floor(Math.random() * 6)],
                  }}
                />
              ))}
            </div>
          )}

          {/* Loading dots */}
          {currentPhase >= 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center space-x-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-2 h-2 rounded-full bg-primary"
                />
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
