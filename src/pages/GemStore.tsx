import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShoppingBag, Shield, Sparkles, Palette, Zap, Diamond } from "lucide-react";

const GemStore = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <ShoppingBag className="h-7 w-7 text-primary" />
              Loja de Recompensas
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Troque suas gems por power-ups, personalizações e boosters que aceleram sua jornada de inglês.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Pacotes de Gems</span>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-border/60 px-2 py-1 bg-card/60 flex items-center gap-1">
                <Diamond className="h-3 w-3 text-yellow-400" /> 100 gems · R$ 4,90
              </span>
              <span className="rounded-full border border-border/60 px-2 py-1 bg-card/60 flex items-center gap-1">
                <Diamond className="h-3 w-3 text-yellow-400" /> 250 gems · R$ 9,90
              </span>
              <span className="rounded-full border border-border/60 px-2 py-1 bg-card/60 flex items-center gap-1">
                <Diamond className="h-3 w-3 text-yellow-400" /> 500 gems · R$ 17,90
              </span>
              <span className="rounded-full border border-border/60 px-2 py-1 bg-card/60 flex items-center gap-1">
                <Diamond className="h-3 w-3 text-yellow-400" /> 1000 gems · R$ 29,90
              </span>
            </div>
          </div>
        </section>

        <Tabs defaultValue="powerups" className="space-y-6">
          <TabsList>
            <TabsTrigger value="powerups" className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Power-ups
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Palette className="h-4 w-4" /> Customização
            </TabsTrigger>
            <TabsTrigger value="boosters" className="flex items-center gap-2">
              <Zap className="h-4 w-4" /> Boosters
            </TabsTrigger>
          </TabsList>

          <TabsContent value="powerups" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="shadow-card hover:shadow-elevated transition-smooth hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Streak Freeze
                  </CardTitle>
                  <CardDescription>Mantenha sua sequência ativa mesmo perdendo um dia.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    <Diamond className="h-4 w-4 text-yellow-400" /> 50 gems
                  </span>
                  <Button variant="outline" size="sm" disabled>
                    Em breve
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-smooth hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    XP Boost 24h (2x XP)
                  </CardTitle>
                  <CardDescription>Ganhe o dobro de XP em todas as atividades por 24 horas.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    <Diamond className="h-4 w-4 text-yellow-400" /> 100 gems
                  </span>
                  <Button variant="outline" size="sm" disabled>
                    Em breve
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-smooth hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Hint Tokens x5
                  </CardTitle>
                  <CardDescription>Receba 5 dicas extras para exercícios mais difíceis.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    <Diamond className="h-4 w-4 text-yellow-400" /> 30 gems
                  </span>
                  <Button variant="outline" size="sm" disabled>
                    Em breve
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-smooth hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Skip Exercise
                  </CardTitle>
                  <CardDescription>Pule um exercício específico sem perder progresso.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    <Diamond className="h-4 w-4 text-yellow-400" /> 20 gems
                  </span>
                  <Button variant="outline" size="sm" disabled>
                    Em breve
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="shadow-card hover:shadow-elevated transition-smooth hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Avatares Especiais
                  </CardTitle>
                  <CardDescription>Desbloqueie avatares exclusivos para seu perfil.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    <Diamond className="h-4 w-4 text-yellow-400" /> 200 gems
                  </span>
                  <Button variant="outline" size="sm" disabled>
                    Em breve
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-smooth hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Badge Frames
                  </CardTitle>
                  <CardDescription>Emoldure suas melhores conquistas com estilos únicos.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    <Diamond className="h-4 w-4 text-yellow-400" /> 150 gems
                  </span>
                  <Button variant="outline" size="sm" disabled>
                    Em breve
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-smooth hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    Profile Themes
                  </CardTitle>
                  <CardDescription>Temas visuais especiais para o seu painel e perfil.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    <Diamond className="h-4 w-4 text-yellow-400" /> 100 gems
                  </span>
                  <Button variant="outline" size="sm" disabled>
                    Em breve
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-smooth hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Celebration Effects
                  </CardTitle>
                  <CardDescription>Novas animações de celebração ao completar metas.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    <Diamond className="h-4 w-4 text-yellow-400" /> 80 gems
                  </span>
                  <Button variant="outline" size="sm" disabled>
                    Em breve
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="boosters" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="shadow-card hover:shadow-elevated transition-smooth hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Lição extra grátis
                  </CardTitle>
                  <CardDescription>Desbloqueie uma lição extra além do limite diário.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    <Diamond className="h-4 w-4 text-yellow-400" /> 40 gems
                  </span>
                  <Button variant="outline" size="sm" disabled>
                    Em breve
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-smooth hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    1 dia Premium
                  </CardTitle>
                  <CardDescription>Teste os recursos Premium por um dia inteiro.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    <Diamond className="h-4 w-4 text-yellow-400" /> 300 gems
                  </span>
                  <Button variant="outline" size="sm" disabled>
                    Em breve
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-smooth hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Certificado customizado
                  </CardTitle>
                  <CardDescription>Baixe um certificado exclusivo com seu nome e nível.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    <Diamond className="h-4 w-4 text-yellow-400" /> 500 gems
                  </span>
                  <Button variant="outline" size="sm" disabled>
                    Em breve
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default GemStore;
