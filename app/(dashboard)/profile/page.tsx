"use client";

import { useUser } from "@clerk/nextjs";
import { FolderKanban, CheckSquare, CircleCheck, Mail, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { useDataStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { user } = useUser();
  const { projects, tasks, currentUser, currentUserId, members } = useDataStore();

  const displayName = user?.fullName || currentUser?.name || "You";
  const displayEmail = user?.primaryEmailAddress?.emailAddress || currentUser?.email || "";
  const imageUrl = user?.imageUrl;
  const joined = user?.createdAt
    ? new Date(user.createdAt)
    : currentUser
    ? new Date(currentUser.createdAt)
    : new Date();

  const ownedProjects = projects.filter((p) => p.ownerId === currentUserId);
  const assignedTasks = tasks.filter((t) => t.assignedToId === currentUserId);
  const completedTasks = assignedTasks.filter((t) => t.status === "COMPLETED");
  const adminProjectCount = members.filter((m) => m.userId === currentUserId && m.role === "ADMIN").length;

  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account details and activity summary.</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            {imageUrl && <AvatarImage src={imageUrl} alt={displayName} />}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{displayName}</h2>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> {displayEmail}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" /> Joined {formatDate(joined)}
            </p>
          </div>
          {adminProjectCount > 0 && (
            <Badge variant="purple" className="ml-auto">
              Admin on {adminProjectCount} project{adminProjectCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard
          label="Owned Projects"
          value={ownedProjects.length}
          icon={FolderKanban}
          iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
        />
        <StatCard
          label="Assigned Tasks"
          value={assignedTasks.length}
          icon={CheckSquare}
          iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
        />
        <StatCard
          label="Completed Tasks"
          value={completedTasks.length}
          icon={CircleCheck}
          iconClassName="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Account details such as your name, email, and password are managed through Clerk. Once
            Clerk is configured for this project, click your avatar in the top-right corner to open
            the account management menu (update profile, change password, enable email verification,
            etc.).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
