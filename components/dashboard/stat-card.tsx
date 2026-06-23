import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconClassName?: string;
  trend?: string;
  href?: string;
}

export function StatCard({ label, value, icon: Icon, iconClassName, trend, href }: StatCardProps) {
  const card = (
    <Card
      className={cn(
        "min-w-0 transition-colors",
        href && "cursor-pointer hover:border-primary/40 hover:bg-accent/40"
      )}
    >
      <CardContent className="p-3 sm:p-5">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="break-words text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
            <p className="mt-2 break-words text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
            {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
          </div>
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10", iconClassName)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!href) return card;

  return (
    <Link href={href} aria-label={`View ${label.toLowerCase()}`} className="block">
      {card}
    </Link>
  );
}
