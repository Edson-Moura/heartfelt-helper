import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Circle, CircleDot, Sword } from "lucide-react";

const mockFriends = [
  {
    id: 1,
    name: "Ana Paula",
    level: 13,
    status: "online" as const,
  },
  {
    id: 2,
    name: "João Silva",
    level: 9,
    status: "online" as const,
  },
  {
    id: 3,
    name: "Marcos Santos",
    level: 15,
    status: "offline" as const,
  },
  {
    id: 4,
    name: "Carla Lima",
    level: 7,
    status: "offline" as const,
  },
];

export const BattleInvite = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Amigos online</span>
        <Badge variant="secondary">em breve: sistema real de amigos</Badge>
      </div>
      <ScrollArea className="h-72 pr-2">
        <div className="space-y-2">
          {mockFriends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center justify-between rounded-lg border bg-card/80 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {friend.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {friend.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Nível {friend.level}</span>
                    <span
                      className={cn(
                        "flex items-center gap-1",
                        friend.status === "online" ? "text-green" : "text-muted-foreground"
                      )}
                    >
                      {friend.status === "online" ? (
                        <CircleDot className="w-3 h-3" />
                      ) : (
                        <Circle className="w-3 h-3" />
                      )}
                      {friend.status === "online" ? "online" : "offline"}
                    </span>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline" disabled={friend.status !== "online"}>
                <Sword className="w-4 h-4 mr-1" />
                Desafiar
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      <p className="text-xs text-muted-foreground">
        Em breve você poderá adicionar amigos reais, enviar convites em tempo real e ver o
        histórico de batalhas diretamente aqui.
      </p>
    </div>
  );
};
