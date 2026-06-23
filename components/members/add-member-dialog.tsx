"use client";

import * as React from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDataStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { MemberRole } from "@/types";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

// Typed email is validated client-side with the same rule the server uses
// (z.string().email()) so a malformed address never even reaches the API.
const emailFormSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});
type EmailFormValues = z.infer<typeof emailFormSchema>;

export function AddMemberDialog({ open, onOpenChange, projectId }: AddMemberDialogProps) {
  const { members, users, addMember } = useDataStore();
  const [mode, setMode] = React.useState<"directory" | "email">("directory");

  // ----- "Pick from directory" mode -----
  const [userId, setUserId] = React.useState<string>("");
  const [directoryRole, setDirectoryRole] = React.useState<MemberRole>("MEMBER");
  const [submittingDirectory, setSubmittingDirectory] = React.useState(false);

  const existingUserIds = new Set(members.filter((m) => m.projectId === projectId).map((m) => m.userId));
  const availableUsers = users.filter((u) => !existingUserIds.has(u.id));

  // ----- "Invite by email" mode -----
  const [emailRole, setEmailRole] = React.useState<MemberRole>("MEMBER");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting: submittingEmail },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: "" },
  });

  React.useEffect(() => {
    if (open) {
      setMode("directory");
      setUserId(availableUsers[0]?.id ?? "");
      setDirectoryRole("MEMBER");
      setEmailRole("MEMBER");
      reset({ email: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleAddFromDirectory() {
    if (!userId) return;
    setSubmittingDirectory(true);
    try {
      await addMember(projectId, { userId }, directoryRole);
      const user = users.find((u) => u.id === userId);
      toast.success(`${user?.name ?? "Member"} added to the project`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add that member.");
    } finally {
      setSubmittingDirectory(false);
    }
  }

  async function handleInviteByEmail(values: EmailFormValues) {
    try {
      await addMember(projectId, { email: values.email }, emailRole);
      toast.success(`${values.email} added to the project`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add that person.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a team member</DialogTitle>
          <DialogDescription>Invite someone to collaborate on this project.</DialogDescription>
        </DialogHeader>

        {/* Mode switch */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setMode("directory")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors",
              mode === "directory" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="h-3.5 w-3.5" /> From directory
          </button>
          <button
            type="button"
            onClick={() => setMode("email")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors",
              mode === "email" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Mail className="h-3.5 w-3.5" /> Invite by email
          </button>
        </div>

        {mode === "directory" ? (
          availableUsers.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              Everyone registered in TaskFlow is already a member of this project. Try
              &ldquo;Invite by email&rdquo; if the person hasn&apos;t signed up yet.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Member</Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a person" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} &middot; {u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={directoryRole} onValueChange={(v) => setDirectoryRole(v as MemberRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin — full access</SelectItem>
                    <SelectItem value="MANAGER">Manager — can manage project</SelectItem>
                    <SelectItem value="MEMBER">Member — can update assigned tasks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )
        ) : (
          <form id="invite-by-email-form" onSubmit={handleSubmit(handleInviteByEmail)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="teammate@example.com"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              <p className="text-xs text-muted-foreground">
                They need an existing TaskFlow account (signed up via Clerk) for this to work.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={emailRole} onValueChange={(v) => setEmailRole(v as MemberRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin — full access</SelectItem>
                  <SelectItem value="MANAGER">Manager — can manage project</SelectItem>
                  <SelectItem value="MEMBER">Member — can update assigned tasks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {mode === "directory" ? (
            <Button onClick={handleAddFromDirectory} disabled={availableUsers.length === 0 || submittingDirectory}>
              Add member
            </Button>
          ) : (
            <Button type="submit" form="invite-by-email-form" disabled={submittingEmail}>
              Add member
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
