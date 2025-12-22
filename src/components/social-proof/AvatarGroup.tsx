import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface AvatarUser {
  id: string;
  name: string;
  avatar_url?: string;
}

interface AvatarGroupProps {
  users: AvatarUser[];
  max?: number;
  showCount?: boolean;
  className?: string;
}

export function AvatarGroup({
  users,
  max = 5,
  showCount = true,
  className,
}: AvatarGroupProps) {
  if (!users?.length) return null;

  const visibleUsers = users.slice(0, max);
  const remaining = Math.max(users.length - visibleUsers.length, 0);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex -space-x-2">
        {visibleUsers.map((user) => (
          <Avatar
            key={user.id}
            className="h-8 w-8 ring-2 ring-background border border-border bg-muted text-xs"
          >
            {user.avatar_url ? (
              <AvatarImage src={user.avatar_url} alt={user.name} />
            ) : (
              <AvatarFallback>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        ))}
      </div>

      {showCount && remaining > 0 && (
        <span className="text-xs font-medium text-muted-foreground">
          +{remaining}
        </span>
      )}
    </div>
  );
}
