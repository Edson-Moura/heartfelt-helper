import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import confetti from "canvas-confetti";

interface CompletionCelebrationProps {
  level: string;
  goal: string;
  onContinue: () => void;
}

export const CompletionCelebration = ({
  level,
  goal,
  onContinue,
}: CompletionCelebrationProps) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Confetti explosion
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#8B5CF6", "#EC4899", "#F59E0B"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#8B5CF6", "#EC4899", "#F59E0B"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onContinue();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onContinue]);

  const levelLabels: { [key: string]: string } = {
    beginner: "Iniciante",
    intermediate: "Intermediário",
    advanced: "Avançado",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <Card className="p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative z-10"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Parabéns! 🎉
            </h1>
            <p className="text-xl text-muted-foreground">
              Você está pronto para começar!
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 py-6 relative z-10"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3 text-lg">
                <span className="text-primary text-2xl">✓</span>
                <span className="font-medium">Nível identificado:</span>
                <Badge variant="secondary" className="text-base px-4 py-1">
                  {levelLabels[level] || level}
                </Badge>
              </div>
              
              <div className="flex items-center justify-center gap-3 text-lg">
                <span className="text-primary text-2xl">✓</span>
                <span className="font-medium">Objetivo:</span>
                <span className="text-muted-foreground">{goal}</span>
              </div>
              
              <div className="flex items-center justify-center gap-3 text-lg">
                <span className="text-primary text-2xl">✓</span>
                <span className="font-medium">Primeira conversa completa!</span>
              </div>
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
              className="pt-4"
            >
              <Badge 
                variant="default" 
                className="text-lg px-6 py-2 bg-gradient-to-r from-primary to-primary/80"
              >
                🎯 Badge Desbloqueado: Jornada Iniciada
              </Badge>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="space-y-3 relative z-10"
          >
            <Button
              size="lg"
              onClick={onContinue}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg py-6"
            >
              Ir para Minha Primeira Lição 🚀
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Redirecionando automaticamente em {countdown}s...
            </p>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};
