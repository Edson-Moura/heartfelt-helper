import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import SEOHelmet from '@/components/SEOHelmet';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy,
  Flame,
  Users,
  Globe2,
  CalendarRange,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  name: string;
  level: number;
  country: string;
  totalXP: number;
  currentStreak: number;
  weeklyLessons: number;
  battlesWon: number;
  averageScore: number;
  weeklyRankChange?: number; // positive = up, negative = down
  isFriend?: boolean;
  isCurrentUser?: boolean;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: '1',
    name: 'Ana Silva',
    level: 15,
    country: 'Brasil',
    totalXP: 2450,
    currentStreak: 45,
    weeklyLessons: 18,
    battlesWon: 12,
    averageScore: 94,
    weeklyRankChange: 1,
  },
  {
    id: '2',
    name: 'Pedro Souza',
    level: 14,
    country: 'Brasil',
    totalXP: 2380,
    currentStreak: 30,
    weeklyLessons: 16,
    battlesWon: 9,
    averageScore: 92,
    weeklyRankChange: -1,
    isFriend: true,
  },
  {
    id: '3',
    name: 'Maria Costa',
    level: 13,
    country: 'Portugal',
    totalXP: 2150,
    currentStreak: 22,
    weeklyLessons: 14,
    battlesWon: 7,
    averageScore: 90,
    weeklyRankChange: 0,
    isFriend: true,
  },
  {
    id: 'current',
    name: 'Você',
    level: 12,
    country: 'Brasil',
    totalXP: 1200,
    currentStreak: 14,
    weeklyLessons: 9,
    battlesWon: 3,
    averageScore: 88,
    weeklyRankChange: 2,
    isFriend: true,
    isCurrentUser: true,
  },
  {
    id: '5',
    name: 'João Pereira',
    level: 11,
    country: 'Brasil',
    totalXP: 1100,
    currentStreak: 7,
    weeklyLessons: 7,
    battlesWon: 2,
    averageScore: 85,
  },
];

type LeaderboardScope = 'global' | 'friends' | 'country' | 'weekly';
type LeaderboardMetric = 'xp' | 'streak' | 'lessons' | 'battles' | 'score';

const getLeagueFromLevel = (level: number): { label: string; variant: 'outline' | 'default' } => {
  if (level <= 10) return { label: 'Bronze', variant: 'outline' };
  if (level <= 25) return { label: 'Prata', variant: 'outline' };
  if (level <= 50) return { label: 'Ouro', variant: 'default' };
  if (level <= 100) return { label: 'Platina', variant: 'default' };
  return { label: 'Diamante', variant: 'default' };
};

const getMetricLabel = (metric: LeaderboardMetric): string => {
  switch (metric) {
    case 'xp':
      return 'Total de XP';
    case 'streak':
      return 'Streak atual';
    case 'lessons':
      return 'Lições esta semana';
    case 'battles':
      return 'Batalhas vencidas';
    case 'score':
      return 'Pontuação média';
  }
};

const getMetricValue = (entry: LeaderboardEntry, metric: LeaderboardMetric): number => {
  switch (metric) {
    case 'xp':
      return entry.totalXP;
    case 'streak':
      return entry.currentStreak;
    case 'lessons':
      return entry.weeklyLessons;
    case 'battles':
      return entry.battlesWon;
    case 'score':
      return entry.averageScore;
  }
};

const Leaderboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  const [scope, setScope] = useState<LeaderboardScope>('weekly');
  const [metric, setMetric] = useState<LeaderboardMetric>('xp');

  const userCountry = profile ? 'Brasil' : 'Brasil';

  const filteredEntries = useMemo(() => {
    let base = [...MOCK_LEADERBOARD];

    if (scope === 'friends') {
      base = base.filter((e) => e.isFriend || e.isCurrentUser);
    } else if (scope === 'country') {
      base = base.filter((e) => e.country === userCountry);
    } else if (scope === 'weekly') {
      // Para o ranking semanal mantemos todos mas focamos em XP da semana (aprox. pelo totalXP aqui)
    }

    return base
      .slice()
      .sort((a, b) => getMetricValue(b, metric) - getMetricValue(a, metric));
  }, [scope, metric, userCountry]);

  const currentUserIndex = filteredEntries.findIndex((e) => e.isCurrentUser);
  const currentUserPosition = currentUserIndex >= 0 ? currentUserIndex + 1 : undefined;

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-pulse text-primary">Carregando ranking...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SEOHelmet
      title="Ranking de Inglês - Leaderboard Gamificada | MyEnglishOne"
      description="Veja seu ranking global, entre amigos e por país em XP, streak e batalhas vencidas. Suba de liga toda semana e conquiste recompensas."
      keywords="ranking inglês, leaderboard, XP, streak, batalhas, MyEnglishOne"
    >
      <div className="min-h-screen bg-gradient-subtle">
        <Header />

        <main className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Trophy className="w-7 h-7 text-primary" />
                Rankings e Ligas 🏆
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Acompanhe sua posição no ranking semanal, global, entre amigos e por país. Suba de liga,
                conquiste gems e badges exclusivos.
              </p>
            </div>

            {currentUserPosition && (
              <Card className="shadow-card min-w-[260px]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    Sua posição esta semana
                    <Flame className="w-4 h-4 text-orange" />
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Continue praticando hoje para proteger sua colocação!
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold">#{currentUserPosition}</span>
                    <span className="text-sm text-muted-foreground">no ranking</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{profile?.display_name || 'Você'}</span>
                    <span>Nível {profile?.current_level ?? 12}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Tipo de ranking
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs value={scope} onValueChange={(v) => setScope(v as LeaderboardScope)}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="global" className="flex items-center gap-1 text-xs">
                      <Globe2 className="w-3 h-3" />
                      Global
                    </TabsTrigger>
                    <TabsTrigger value="friends" className="flex items-center gap-1 text-xs">
                      <Users className="w-3 h-3" />
                      Amigos
                    </TabsTrigger>
                    <TabsTrigger value="country" className="flex items-center gap-1 text-xs">
                      <Globe2 className="w-3 h-3" />
                      País
                    </TabsTrigger>
                    <TabsTrigger value="weekly" className="flex items-center gap-1 text-xs">
                      <CalendarRange className="w-3 h-3" />
                      Semanal
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Métrica ranqueada</CardTitle>
                <CardDescription className="text-xs">
                  Escolha o critério usado para ordenar o ranking.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs value={metric} onValueChange={(v) => setMetric(v as LeaderboardMetric)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-2">
                    <TabsTrigger value="xp" className="text-xs">XP</TabsTrigger>
                    <TabsTrigger value="streak" className="text-xs">Streak</TabsTrigger>
                    <TabsTrigger value="lessons" className="text-xs">Lições</TabsTrigger>
                  </TabsList>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="battles" className="text-xs">Batalhas</TabsTrigger>
                    <TabsTrigger value="score" className="text-xs">Pontuação</TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="mt-2 text-xs text-muted-foreground">
                  Ordenando por: <span className="font-semibold">{getMetricLabel(metric)}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de ranking */}
          <Card className="shadow-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  {scope === 'weekly' && 'Ranking Semanal'}
                  {scope === 'global' && 'Ranking Global'}
                  {scope === 'friends' && 'Ranking entre Amigos'}
                  {scope === 'country' && `Ranking - ${userCountry}`}
                </CardTitle>
                <CardDescription>
                  Os rankings semanais reiniciam toda segunda-feira. Mantenha sua streak e XP em alta para subir.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {filteredEntries.map((entry, index) => {
                  const position = index + 1;
                  const isTop3 = position <= 3;
                  const league = getLeagueFromLevel(entry.level);
                  const metricValue = getMetricValue(entry, metric);
                  const metricLabel = getMetricLabel(metric);

                  const isCurrentUser = entry.isCurrentUser;

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between gap-4 rounded-lg border px-3 py-2 text-sm bg-card/60 ${
                        isCurrentUser
                          ? 'border-primary bg-primary/5 shadow-card'
                          : 'border-border/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 text-center font-semibold">
                          {position === 1 && <span className="text-lg">🥇</span>}
                          {position === 2 && <span className="text-lg">🥈</span>}
                          {position === 3 && <span className="text-lg">🥉</span>}
                          {!isTop3 && <span>#{position}</span>}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`font-medium truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                              {entry.name}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                                Você
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            <span>Nv {entry.level}</span>
                            <span>• Streak {entry.currentStreak}🔥</span>
                            <span>• {entry.country}</span>
                            <span>• {metricLabel}: {metricValue}</span>
                          </div>
                          <Progress
                            value={Math.min(100, (metricValue / (filteredEntries[0]?.totalXP || 1)) * 100)}
                            className="h-1.5 mt-1 max-w-xs"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 text-[11px]">
                        <Badge variant={league.variant} className="px-2 py-0 h-5 text-[11px]">
                          {league.label}
                        </Badge>
                        {typeof entry.weeklyRankChange === 'number' && entry.weeklyRankChange !== 0 && (
                          <span
                            className={`inline-flex items-center gap-0.5 ${
                              entry.weeklyRankChange < 0
                                ? 'text-red-500'
                                : 'text-green-500'
                            }`}
                          >
                            {entry.weeklyRankChange > 0 ? (
                              <>
                                <ChevronUp className="w-3 h-3" />+{entry.weeklyRankChange}
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" />
                                {entry.weeklyRankChange}
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <h3 className="font-semibold mb-1">Recompensas Semanais</h3>
                  <ul className="space-y-0.5">
                    <li>#1: 500 gems + badge "Campeão"</li>
                    <li>#2-3: 250 gems + badge "Pódio"</li>
                    <li>#4-10: 100 gems + badge "Top 10"</li>
                    <li>#11-50: 50 gems de participação</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Ligas</h3>
                  <ul className="space-y-0.5">
                    <li>Bronze: níveis 1-10</li>
                    <li>Prata: níveis 11-25</li>
                    <li>Ouro: níveis 26-50</li>
                    <li>Platina: níveis 51-100</li>
                    <li>Diamante: top 100 geral</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </SEOHelmet>
  );
};

export default Leaderboard;
