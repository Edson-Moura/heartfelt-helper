import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Brain, Target, Zap, Volume2, Trophy } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Frases Diárias Personalizadas",
    description: "Receba 5-10 frases úteis todos os dias, adaptadas ao seu nível e objetivos específicos.",
    badge: "IA Inteligente",
    gradient: "bg-primary"
  },
  {
    icon: Brain,
    title: "Prática com Chatbot IA",
    description: "Converse com nossa IA avançada e receba feedback instantâneo sobre gramática e pronúncia.",
    badge: "Feedback Instantâneo",
    gradient: "bg-secondary"
  },
  {
    icon: Target,
    title: "Aprendizado Direcionado",
    description: "Conteúdo específico para viagem, trabalho ou conversação diária baseado no seu objetivo.",
    badge: "Personalizado",
    gradient: "bg-teal"
  },
  {
    icon: Zap,
    title: "Repetição Espaçada",
    description: "Sistema científico que otimiza a memorização das frases no momento ideal para retenção.",
    badge: "Método Científico",
    gradient: "bg-green"
  },
  {
    icon: Volume2,
    title: "Áudio Nativo",
    description: "Ouça a pronúncia correta de cada frase com áudio de falantes nativos profissionais.",
    badge: "Pronúncia Perfeita",
    gradient: "bg-orange"
  },
  {
    icon: Trophy,
    title: "Gamificação e Streaks",
    description: "Mantenha a motivação com desafios diários, conquistas e sequências de estudo.",
    badge: "Motivação",
    gradient: "bg-accent"
  }
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-gradient-section-alt">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-5xl font-bold">
            Funcionalidades que{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent animate-glow">
              Aceleram
            </span>{" "}
            seu Aprendizado
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" style={{ animationDelay: '0.2s' }}>
            Nossa plataforma combina as melhores técnicas de aprendizado com tecnologia de IA 
            para garantir que você desenvolva fluência real em inglês.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-elevated transition-all duration-500 border-2 hover:border-primary/20 animate-fade-in hover:-translate-y-2"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 ${feature.gradient} rounded-xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-all duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant="secondary" className="text-xs group-hover:scale-110 transition-transform duration-200">
                    {feature.badge}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};