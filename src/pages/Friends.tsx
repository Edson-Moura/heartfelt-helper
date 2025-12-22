import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge as UiBadge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";

interface FriendActivity {
  id: string;
  friendName: string;
  type: "lesson" | "streak" | "level" | "battle";
  message: string;
  timeAgo: string;
}

interface FriendProfileSummary {
  id: string;
  name: string;
  avatarUrl?: string | null;
  level: number;
  xp: number;
  streak: number;
  topBadges: string[];
  stats: {
    lessonsCompleted: number;
    battlesWon: number;
    totalXP: number;
  };
}

const MOCK_ACTIVITIES: FriendActivity[] = [
  {
    id: "1",
    friendName: "Ana",
    type: "lesson",
    message: "Ana completou lição 15! 🎉",
    timeAgo: "há 5 minutos",
  },
  {
    id: "2",
    friendName: "Pedro",
    type: "streak",
    message: "Pedro alcançou streak de 30 dias! 🔥",
    timeAgo: "há 1 hora",
  },
  {
    id: "3",
    friendName: "Maria",
    type: "level",
    message: "Maria subiu para Nível 14! ⬆️",
    timeAgo: "há 2 horas",
  },
  {
    id: "4",
    friendName: "João",
    type: "battle",
    message: "João te desafiou para batalha!",
    timeAgo: "há 3 horas",
  },
];

const MOCK_FRIENDS: FriendProfileSummary[] = [
  {
    id: "ana",
    name: "Ana Silva",
    level: 15,
    xp: 2450,
    streak: 45,
    topBadges: ["Primeira Lição", "Streak 30 dias", "Top 10"],
    stats: {
      lessonsCompleted: 120,
      battlesWon: 34,
      totalXP: 2450,
    },
  },
  {
    id: "pedro",
    name: "Pedro Souza",
    level: 14,
    xp: 2380,
    streak: 30,
    topBadges: ["10 Lições", "Primeira Batalha", "Semana Perfeita"],
    stats: {
      lessonsCompleted: 98,
      battlesWon: 20,
      totalXP: 2380,
    },
  },
  {
    id: "maria",
    name: "Maria Costa",
    level: 13,
    xp: 2150,
    streak: 22,
    topBadges: ["Nível B1", "Dedicação", "Top 10"],
    stats: {
      lessonsCompleted: 87,
      battlesWon: 18,
      totalXP: 2150,
    },
  },
];

const Friends = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [search, setSearch] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<FriendProfileSummary | null>(
    MOCK_FRIENDS[0] ?? null,
  );

  const handleAddFriend = () => {
    // Futuro: integrar com backend de amigos
    // Por enquanto apenas limpa o campo
    setSearch("");
  };

  const handleAcceptBattle = () => {
    navigate("/battles");
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Amigos
          </h1>
          <p className="text-sm text-muted-foreground">
            Conecte-se com amigos, acompanhe o progresso e desafie para
            batalhas.
          </p>
        </div>
        {profile && (
          <Card className="min-w-[260px]">
            <CardContent className="flex items-center gap-3 py-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback>
                  {profile.display_name?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold leading-tight">
                  {profile.display_name ?? "Você"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Nível {profile.current_level ?? 1} • Streak {profile.streak_count ?? 0} 🔥
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </header>

      <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adicionar amigo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 md:flex-row">
              <Input
                placeholder="Username ou e-mail"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button onClick={handleAddFriend} className="md:min-w-[140px]">
                Adicionar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Seus amigos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_FRIENDS.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => setSelectedFriend(friend)}
                  className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition hover:bg-accent ${selectedFriend?.id === friend.id ? "border-primary bg-accent" : "border-border"}`}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      {friend.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">
                      {friend.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Nível {friend.level} • Streak {friend.streak} 🔥
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary">
                    {friend.stats.totalXP.toLocaleString()} XP
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="feed">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="feed">Feed de atividades</TabsTrigger>
              <TabsTrigger value="perfil">Perfil do amigo</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Atividade recente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {MOCK_ACTIVITIES.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-md bg-muted/60 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {item.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.timeAgo}
                        </p>
                      </div>
                      {item.type === "battle" && (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button size="sm" onClick={handleAcceptBattle}>
                            Aceitar
                          </Button>
                          <Button size="sm" variant="outline">
                            Recusar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="perfil" className="mt-4">
              {selectedFriend ? (
                <Card>
                  <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {selectedFriend.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {selectedFriend.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Nível {selectedFriend.level} • {selectedFriend.xp.toLocaleString()} XP • Streak {selectedFriend.streak} 🔥
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigate("/chat")}
                      >
                        Chat privado
                      </Button>
                      <Button size="sm" onClick={() => navigate("/battles")}
                      >
                        Desafiar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Top badges
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedFriend.topBadges.map((badge) => (
                          <UiBadge key={badge} variant="secondary" className="text-xs px-2 py-1">
                            {badge}
                          </UiBadge>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-lg border bg-card p-3">
                        <p className="text-xs text-muted-foreground">Lições completadas</p>
                        <p className="text-xl font-bold">
                          {selectedFriend.stats.lessonsCompleted}
                        </p>
                      </div>
                      <div className="rounded-lg border bg-card p-3">
                        <p className="text-xs text-muted-foreground">Batalhas vencidas</p>
                        <p className="text-xl font-bold">
                          {selectedFriend.stats.battlesWon}
                        </p>
                      </div>
                      <div className="rounded-lg border bg-card p-3">
                        <p className="text-xs text-muted-foreground">XP total</p>
                        <p className="text-xl font-bold">
                          {selectedFriend.stats.totalXP.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Selecione um amigo na lista para ver o perfil público.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  );
};

export default Friends;
