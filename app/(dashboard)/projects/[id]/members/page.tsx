"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, Mail, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddMemberDialog } from "@/components/members/add-member-dialog";
import { useDataStore } from "@/lib/store";
import { getRoleColor } from "@/lib/utils";
import { toast } from "sonner";
import type { Member, MemberRole } from "@/types";

const roleDescriptions: Record<MemberRole, string> = {
  ADMIN: "Can do everything — manage members, tasks, and project settings.",
  MANAGER: "Can manage the project and its tasks.",
  MEMBER: "Can update tasks assigned to them.",
};

export default function ProjectMembersPage() {
  const params = useParams<{ id: string }>();
  const { members, tasks, projects, getUserById, getMyRole, updateMemberRole, removeMember } = useDataStore();

  const [addOpen, setAddOpen] = React.useState(false);
  const [removeTarget, setRemoveTarget] = React.useState<Member | null>(null);
  const [busyMemberId, setBusyMemberId] = React.useState<string | null>(null);

  const projectId = params.id;
  const project = projects.find((p) => p.id === projectId);
  const projectMembers = members.filter((m) => m.projectId === projectId);
  // Per spec: only Admins can manage the team (add, remove, change roles).
  const canManageMembers = getMyRole(projectId) === "ADMIN";

  function tasksAssigned(userId: string) {
    return tasks.filter((t) => t.projectId === projectId && t.assignedToId === userId).length;
  }

  async function handleRoleChange(member: Member, role: MemberRole) {
    setBusyMemberId(member.id);
    try {
      await updateMemberRole(member.id, role);
      toast.success("Role updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update that member's role.");
    } finally {
      setBusyMemberId(null);
    }
  }

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    setBusyMemberId(removeTarget.id);
    try {
      await removeMember(removeTarget.id);
      toast.success("Member removed");
      setRemoveTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove that member.");
    } finally {
      setBusyMemberId(null);
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {projectMembers.length} member{projectMembers.length !== 1 ? "s" : ""} on this project
        </p>
        {canManageMembers && (
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add member
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projectMembers.map((member) => {
          const user = member.user ?? getUserById(member.userId);
          if (!user) return null;
          const isOwner = project?.ownerId === member.userId;
          const canEditThisMember = canManageMembers && !isOwner;
          return (
            <Card key={member.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-medium">
                        {user.name}
                        {isOwner && <Crown className="h-3.5 w-3.5 text-yellow-500" />}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> {user.email}
                      </p>
                    </div>
                  </div>
                  {canEditThisMember && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      disabled={busyMemberId === member.id}
                      onClick={() => setRemoveTarget(member)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  {canEditThisMember ? (
                    <Select
                      value={member.role}
                      onValueChange={(v) => handleRoleChange(member, v as MemberRole)}
                      disabled={busyMemberId === member.id}
                    >
                      <SelectTrigger className="h-8 w-[130px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="MEMBER">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getRoleColor(member.role)} variant="outline">
                      {member.role}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {tasksAssigned(user.id)} task{tasksAssigned(user.id) !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">{roleDescriptions[member.role]}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AddMemberDialog open={addOpen} onOpenChange={setAddOpen} projectId={projectId} />

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget && (removeTarget.user?.name ?? getUserById(removeTarget.userId)?.name)} will lose
              access to this project. Tasks already assigned to them will remain assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
