"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getInitials } from "@/lib/utils";
import type { Member } from "@/types";

interface TeamAvatarStackProps {
  members: Member[];
  max?: number;
  size?: "sm" | "md";
}

/**
 * Renders a row of overlapping avatars for a project's team — the visual
 * equivalent of:
 *   Project A
 *    ├─ Sourabh
 *    ├─ Deepu
 *    └─ Amit
 * Hovering (or focusing, for keyboard users) any avatar shows that
 * person's full name and role in a tooltip. Members beyond `max` are
 * collapsed into a "+N" circle that lists the rest on hover.
 */
export function TeamAvatarStack({ members, max = 4, size = "sm" }: TeamAvatarStackProps) {
  const withUsers = members.filter((m) => m.user);
  const visible = withUsers.slice(0, max);
  const overflow = withUsers.slice(max);

  const dims = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const text = size === "sm" ? "text-[10px]" : "text-xs";

  if (withUsers.length === 0) {
    return <span className="text-xs text-muted-foreground">No members yet</span>;
  }

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((m) => (
        <Tooltip key={m.id}>
          <TooltipTrigger asChild>
            <Avatar className={`${dims} border-2 border-background ring-0 cursor-default`}>
              {m.user?.image && <AvatarImage src={m.user.image} alt={m.user.name} />}
              <AvatarFallback className={text}>{getInitials(m.user?.name)}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{m.user?.name}</p>
            <p className="text-[10px] opacity-80">{m.role}</p>
          </TooltipContent>
        </Tooltip>
      ))}
      {overflow.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className={`${dims} border-2 border-background bg-muted cursor-default`}>
              <AvatarFallback className={text}>+{overflow.length}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-0.5">
              {overflow.map((m) => (
                <p key={m.id}>
                  {m.user?.name} <span className="opacity-70">({m.role})</span>
                </p>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
