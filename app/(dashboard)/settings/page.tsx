"use client";

import * as React from "react";
import { toast } from "sonner";
import { Moon, Sun, RotateCcw, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { useDataStore } from "@/lib/store";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { refresh } = useDataStore();

  const [notifTaskAssigned, setNotifTaskAssigned] = React.useState(true);
  const [notifDeadline, setNotifDeadline] = React.useState(true);
  const [notifProjectUpdates, setNotifProjectUpdates] = React.useState(false);
  const [emailDigest, setEmailDigest] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refresh();
      toast.success("Workspace data refreshed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't refresh your data.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your appearance and notification preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Choose how TaskFlow looks on your device.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <div>
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted-foreground">Toggle between light and dark themes.</p>
            </div>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </CardTitle>
          <CardDescription>Choose what you want to be notified about.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Task assigned</p>
              <p className="text-xs text-muted-foreground">When a task is assigned to you.</p>
            </div>
            <Switch checked={notifTaskAssigned} onCheckedChange={setNotifTaskAssigned} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Deadline reminders</p>
              <p className="text-xs text-muted-foreground">When a task deadline is approaching.</p>
            </div>
            <Switch checked={notifDeadline} onCheckedChange={setNotifDeadline} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Project updates</p>
              <p className="text-xs text-muted-foreground">When a project you&apos;re part of is updated.</p>
            </div>
            <Switch checked={notifProjectUpdates} onCheckedChange={setNotifProjectUpdates} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Weekly email digest</p>
              <p className="text-xs text-muted-foreground">A summary of your week, every Monday.</p>
            </div>
            <Switch checked={emailDigest} onCheckedChange={setEmailDigest} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace Data</CardTitle>
          <CardDescription>
            Your projects, tasks, and members are stored in MongoDB. If something looks out of date
            (e.g. after a teammate makes a change), refresh to pull the latest from the server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="gap-2">
            <RotateCcw className="h-4 w-4" /> {refreshing ? "Refreshing..." : "Refresh workspace data"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
