import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Target, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/new-hero-illustration.jpg";

export const HeroSection = () => {
  return (
    <section className="bg-gradient-subtle min-h-screen flex items-center py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight animate-fade-in">
                Domine a{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent animate-glow">
                  Fluência
                </span>{" "}
                em Inglês
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Aprenda frases úteis diariamente, pratique conversação com IA e 
                desenvolva confiança para falar inglês naturalmente.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Button variant="hero" size="lg" className="text-lg px-8 hover:scale-105 transition-all duration-300 hover:shadow-primary" asChild>
                <Link to="/auth">
                  <Play className="w-5 h-5" />
                  Começar Agora - Grátis
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 hover:scale-105 transition-all duration-300" asChild>
                <Link to="/demo">
                  Ver Demonstração
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-8 pt-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="text-center hover:scale-110 transition-transform duration-300">
                <div className="text-2xl font-bold text-primary animate-bounce-in">5.000+</div>
                <div className="text-sm text-muted-foreground">Estudantes Ativos</div>
              </div>
              <div className="text-center hover:scale-110 transition-transform duration-300">
                <div className="text-2xl font-bold text-secondary animate-bounce-in" style={{ animationDelay: '0.1s' }}>94%</div>
                <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
              </div>
              <div className="text-center hover:scale-110 transition-transform duration-300">
                <div className="text-2xl font-bold text-accent animate-bounce-in" style={{ animationDelay: '0.2s' }}>30 dias</div>
                <div className="text-sm text-muted-foreground">Fluência Média</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="relative rounded-3xl overflow-hidden shadow-elevated hover:shadow-primary transition-all duration-500 hover:scale-[1.02]">
              <img 
                src={heroImage} 
                alt="Ilustração de aprendizado de inglês online com pessoa acenando, certificação e ferramentas de estudo"
                className="w-full h-auto transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-hero/10"></div>
            </div>

            {/* Floating Cards */}
            <Card className="absolute -top-4 -left-4 p-4 bg-card/90 backdrop-blur-sm shadow-elevated border-2 border-primary/20 animate-float hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center animate-pulse">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold">Metas Diárias</div>
                  <div className="text-sm text-muted-foreground">5 frases/dia</div>
                </div>
              </div>
            </Card>

            <Card className="absolute -bottom-4 -right-4 p-4 bg-card/90 backdrop-blur-sm shadow-elevated border-2 border-secondary/20 animate-float hover:scale-105 transition-all duration-300" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-secondary rounded-full flex items-center justify-center animate-pulse" style={{ animationDelay: '0.5s' }}>
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold">Progresso</div>
                  <div className="text-sm text-muted-foreground">+25% esta semana</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};