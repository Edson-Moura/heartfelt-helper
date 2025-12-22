import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sword, Timer, Mic2, Trophy, Users } from "lucide-react";
import { BattleInvite } from "@/components/gamification/BattleInvite";

const Battles = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-pulse text-primary">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="container mx-auto px-4 py-8 grid gap-8 lg:grid-cols-[2fr,1fr]">
        <section className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-7 h-7 text-primary" />
              Batalhas 1v1 ⚔️
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Desafie outros alunos em tempo real e ganhe XP e gems extras. Três modos de
              batalha para testar seu inglês em situações intensas.
            </p>
          </header>

          <Tabs defaultValue="quick" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quick" className="flex items-center gap-2">
                <Sword className="w-4 h-4" />
                Quick Match
              </TabsTrigger>
              <TabsTrigger value="speed" className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Speed Challenge
              </TabsTrigger>
              <TabsTrigger value="pronunciation" className="flex items-center gap-2">
                <Mic2 className="w-4 h-4" />
                Pronunciation Duel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quick">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sword className="w-5 h-5 text-primary" />
                      Quick Match (5 minutos)
                    </span>
                    <span className="text-sm text-muted-foreground">Recompensa: 100 XP + 15 💎</span>
                  </CardTitle>
                  <CardDescription>
                    10 perguntas de múltipla escolha. Quem acerta mais rápido e com mais precisão vence.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border bg-card/80 p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Você (Nv 12)</span>
                      <span>Ana (Nv 13)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Progress value={40} className="h-2" />
                        <p className="mt-1 text-xs text-muted-foreground">4/10</p>
                      </div>
                      <div className="flex-1 text-right">
                        <Progress value={60} className="h-2" />
                        <p className="mt-1 text-xs text-muted-foreground">6/10</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">Pergunta 7/10</div>
                    <div className="font-medium text-foreground">
                      How do you say "cachorro"?
                    </div>
                    <div className="grid gap-2 mt-2">
                      {[
                        "Dog",
                        "Cat",
                        "Bird",
                        "Fish",
                      ].map((option, index) => (
                        <Button
                          key={option}
                          variant={index === 0 ? "default" : "outline"}
                          className="justify-between"
                          disabled
                        >
                          <span>{String.fromCharCode(65 + index)}) {option}</span>
                          {index === 0 && <span className="text-xs text-muted-foreground">Ana respondeu</span>}
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span>⏱️ 8s restantes</span>
                      <span>Vitórias recentes: em breve</span>
                    </div>
                  </div>

                  <Button size="lg" className="w-full" disabled>
                    Encontrar oponente (em breve)
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Matchmaking em tempo real será conectado em uma próxima etapa.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="speed">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-primary" />
                    Speed Challenge (3 minutos)
                  </CardTitle>
                  <CardDescription>
                    Traduza o máximo de frases possível contra o tempo. Ranking ao vivo para ver quem domina a maratona.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border bg-card/80 p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Seu ritmo</span>
                      <span className="text-muted-foreground">0:42 / 3:00</span>
                    </div>
                    <Progress value={25} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Traduções certas: 8</span>
                      <span>Recorde pessoal: 23</span>
                    </div>
                  </div>
                  <Button size="lg" className="w-full" disabled>
                    Iniciar Speed Challenge (em breve)
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pronunciation">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic2 className="w-5 h-5 text-primary" />
                    Pronunciation Duel
                  </CardTitle>
                  <CardDescription>
                    10 palavras para pronunciar. A IA avalia a qualidade e compara você com o oponente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border bg-card/80 p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Sua pontuação</span>
                      <span className="text-muted-foreground">82/100</span>
                    </div>
                    <Progress value={82} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Precisão média</span>
                      <span>Pronúncias perfeitas: 4/10</span>
                    </div>
                  </div>
                  <Button size="lg" className="w-full" disabled>
                    Começar duelo de pronúncia (em breve)
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        <aside className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Amigos e Convites
              </CardTitle>
              <CardDescription>
                Veja quem está online e envie convites para batalhas rápidas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BattleInvite />
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Recompensas das batalhas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Quick Match: 100 XP + 15 💎 por vitória</p>
              <p>• Speed Challenge: XP variável pelo desempenho</p>
              <p>• Pronunciation Duel: até 150 XP + progresso em conquistas de pronúncia</p>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
};

export default Battles;
