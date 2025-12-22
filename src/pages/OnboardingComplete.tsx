import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SEOHelmet from "@/components/SEOHelmet";
import confetti from "canvas-confetti";
import { 
  BookOpen, 
  MessageCircle, 
  Target, 
  Trophy,
  Share2,
  Sparkles
} from "lucide-react";

export default function OnboardingComplete() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Confetti celebration
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981"],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Auto-redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/lessons");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const recommendedLessons = [
    {
      title: "Conversação Básica",
      description: "Aprenda frases essenciais do dia a dia",
      icon: MessageCircle,
      level: "Iniciante",
    },
    {
      title: "Pronúncia Perfeita",
      description: "Melhore sua pronúncia com IA",
      icon: Target,
      level: "Todos os níveis",
    },
    {
      title: "Vocabulário Prático",
      description: "300 palavras mais usadas em inglês",
      icon: BookOpen,
      level: "Iniciante",
    },
  ];

  return (
    <>
      <SEOHelmet 
        title="Onboarding Completo - MyEnglish"
        description="Parabéns! Você completou o onboarding e está pronto para começar sua jornada rumo à fluência."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Trophy className="h-5 w-5" />
              <span className="font-semibold">Missão Completa!</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Seu Plano Personalizado Está Pronto!
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Baseado no seu perfil e objetivos, preparamos uma jornada exclusiva para você alcançar a fluência.
            </p>
          </motion.div>

          {/* Próximas Lições Recomendadas */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>Suas Primeiras Lições</CardTitle>
                </div>
                <CardDescription>
                  Escolhemos essas lições especialmente para você começar com o pé direito
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-4">
                  {recommendedLessons.map((lesson, index) => (
                    <motion.div
                      key={lesson.title}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <lesson.icon className="h-5 w-5 text-primary" />
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {lesson.level}
                            </Badge>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-1">{lesson.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {lesson.description}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Convite para Referral */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-semibold">Convide Seus Amigos</h3>
                    </div>
                    <p className="text-muted-foreground">
                      Compartilhe o MyEnglish e ganhe <strong className="text-primary">7 dias grátis</strong> para cada amigo que se inscrever!
                    </p>
                  </div>
                  <Button variant="outline" className="whitespace-nowrap">
                    Convidar Amigos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Separator />

          {/* CTA Final */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="text-center space-y-4"
          >
            <Button
              size="lg"
              onClick={() => navigate("/lessons")}
              className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 hover:opacity-90 text-lg px-12 py-6"
            >
              Começar Agora 🚀
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Redirecionando automaticamente em <strong>{countdown}</strong> segundos...
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
