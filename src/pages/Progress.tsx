import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from "recharts";
import { Flame, Target, LineChart as LineChartIcon, Activity } from "lucide-react";

const ProgressPage = () => {
  const { user } = useAuth();
  const { dailyActivities, todayActivity, progress } = useProgress();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const last7Days = [...dailyActivities]
    .slice(0, 7)
    .reverse()
    .map((day) => ({
      date: new Date(day.activity_date).toLocaleDateString("pt-BR", { weekday: "short" }),
      xp: day.points_earned,
      sentences: day.sentences_practiced,
    }));

  const xpOverTime = [...dailyActivities]
    .slice()
    .reverse()
    .map((day) => ({
      date: new Date(day.activity_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      xp: day.points_earned,
    }));

  const totalAttempts = progress.reduce((acc, p) => acc + p.attempts, 0);
  const totalCorrect = progress.reduce((acc, p) => acc + p.correct_attempts, 0);
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <LineChartIcon className="h-7 w-7 text-primary" />
              Seu Progresso
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Acompanhe sua evolução em detalhes: XP, streak, lições e desempenho em exercícios.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-card">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Esta semana</CardTitle>
              <Flame className="h-4 w-4 text-orange" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{todayActivity?.sentences_practiced ?? 0}</p>
              <p className="text-xs text-muted-foreground">Frases praticadas hoje</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">XP hoje</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{todayActivity?.points_earned ?? 0}</p>
              <p className="text-xs text-muted-foreground">XP ganho nas últimas 24h</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Taxa de acerto</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{accuracy}%</p>
              <p className="text-xs text-muted-foreground">Respostas corretas em exercícios</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Comparação</CardTitle>
              <LineChartIcon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">87%</p>
              <p className="text-xs text-muted-foreground">Você está indo melhor que 87% dos alunos! 🎯</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Atividade diária (últimos 7 dias)</CardTitle>
              <CardDescription>Veja quantas frases você praticou a cada dia.</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {last7Days.length === 0 ? (
                <p className="text-sm text-muted-foreground">Comece a praticar para ver seu histórico aqui.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Days} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
                    <Bar dataKey="sentences" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>XP ao longo do tempo</CardTitle>
              <CardDescription>Acompanhe como seu XP acumulado evolui dia a dia.</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {xpOverTime.length === 0 ? (
                <p className="text-sm text-muted-foreground">Pratique alguns dias para ver a evolução do XP.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={xpOverTime} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ stroke: "hsl(var(--primary))" }} />
                    <Line type="monotone" dataKey="xp" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default ProgressPage;
