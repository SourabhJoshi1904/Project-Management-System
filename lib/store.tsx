"use client";

import * as React from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import type {
  Project,
  Task,
  Member,
  Notification,
  ActivityLog,
  Comment,
  User,
  TaskStatus,
  TaskPriority,
  ProjectStatus,
  MemberRole,
} from "@/types";

interface StoreData {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  tasks: Task[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
}

interface DataStoreContextValue {
  // raw data
  currentUser: User | null;
  currentUserId: string;
  users: User[];
  projects: Project[];
  tasks: Task[];
  members: Member[];
  notifications: Notification[];
  activityLogs: ActivityLog[];

  // lookups
  getUserById: (id?: string | null) => User | undefined;
  getMyRole: (projectId: string) => MemberRole | null;

  // data lifecycle
  refresh: () => Promise<void>;

  // projects
  addProject: (data: { title: string; description?: string; deadline?: Date | null }) => Promise<Project>;
  updateProject: (
    id: string,
    data: Partial<{ title: string; description: string; deadline: Date | null; status: ProjectStatus }>
  ) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // tasks
  addTask: (data: {
    title: string;
    description?: string;
    priority: TaskPriority;
    deadline?: Date | null;
    projectId: string;
    assignedToId?: string | null;
  }) => Promise<Task>;
  updateTask: (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      priority: TaskPriority;
      status: TaskStatus;
      deadline: Date | null;
      assignedToId: string | null;
    }>
  ) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, status: TaskStatus) => void;

  // members
  addMember: (projectId: string, target: { userId: string } | { email: string }, role: MemberRole) => Promise<void>;
  updateMemberRole: (memberId: string, role: MemberRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;

  // notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // comments
  getTaskComments: (taskId: string) => Promise<Comment[]>;
  addComment: (taskId: string, message: string) => Promise<Comment>;
}

const DataStoreContext = React.createContext<DataStoreContextValue | null>(null);

async function loadAll(): Promise<StoreData> {
  const [currentUser, users, projects, tasks, notifications, activityLogs] = await Promise.all([
    apiFetch<User>("/api/me"),
    apiFetch<User[]>("/api/users"),
    apiFetch<Project[]>("/api/projects"),
    apiFetch<Task[]>("/api/tasks"),
    apiFetch<Notification[]>("/api/notifications"),
    apiFetch<ActivityLog[]>("/api/activity"),
  ]);
  return { currentUser, users, projects, tasks, notifications, activityLogs };
}

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<StoreData>({
    currentUser: null,
    users: [],
    projects: [],
    tasks: [],
    notifications: [],
    activityLogs: [],
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    const fresh = await loadAll();
    setData(fresh);
    setError(null);
  }, []);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const fresh = await loadAll();
        if (active) {
          setData(fresh);
          setError(null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load your workspace.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Re-fetch just the bits a given mutation could have changed, rather than
  // a single big "refresh everything", so the UI updates promptly without
  // unnecessary round-trips.
  const refreshProjects = React.useCallback(async () => {
    const projects = await apiFetch<Project[]>("/api/projects");
    setData((prev) => ({ ...prev, projects }));
  }, []);

  const refreshTasks = React.useCallback(async () => {
    const tasks = await apiFetch<Task[]>("/api/tasks");
    setData((prev) => ({ ...prev, tasks }));
  }, []);

  const members = React.useMemo<Member[]>(
    () => data.projects.flatMap((p) => (p.members ?? []).map((m) => ({ ...m, project: undefined }))),
    [data.projects]
  );

  const getUserById = React.useCallback(
    (id?: string | null) => (id ? data.users.find((u) => u.id === id) : undefined),
    [data.users]
  );

  const getMyRole = React.useCallback(
    (projectId: string): MemberRole | null => {
      if (!data.currentUser) return null;
      const member = members.find((m) => m.projectId === projectId && m.userId === data.currentUser!.id);
      return member?.role ?? null;
    },
    [members, data.currentUser]
  );

  // ----- Projects -----
  const addProject = React.useCallback<DataStoreContextValue["addProject"]>(
    async (input) => {
      const created = await apiFetch<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          description: input.description ?? "",
          deadline: input.deadline ? input.deadline.toISOString() : "",
        }),
      });
      await refreshProjects();
      return created;
    },
    [refreshProjects]
  );

  const updateProject = React.useCallback<DataStoreContextValue["updateProject"]>(
    async (id, patch) => {
      await apiFetch(`/api/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...patch,
          deadline:
            patch.deadline !== undefined ? (patch.deadline ? patch.deadline.toISOString() : null) : undefined,
        }),
      });
      await refreshProjects();
    },
    [refreshProjects]
  );

  const deleteProject = React.useCallback<DataStoreContextValue["deleteProject"]>(
    async (id) => {
      await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
      setData((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== id) }));
      await refreshTasks();
    },
    [refreshTasks]
  );

  // ----- Tasks -----
  const addTask = React.useCallback<DataStoreContextValue["addTask"]>(
    async (input) => {
      const created = await apiFetch<Task>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          description: input.description ?? "",
          priority: input.priority,
          deadline: input.deadline ? input.deadline.toISOString() : "",
          projectId: input.projectId,
          assignedToId: input.assignedToId ?? null,
        }),
      });
      await refreshTasks();
      return created;
    },
    [refreshTasks]
  );

  const updateTask = React.useCallback<DataStoreContextValue["updateTask"]>(
    async (id, patch) => {
      await apiFetch(`/api/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...patch,
          deadline:
            patch.deadline !== undefined ? (patch.deadline ? patch.deadline.toISOString() : null) : undefined,
        }),
      });
      await refreshTasks();
    },
    [refreshTasks]
  );

  const deleteTask = React.useCallback<DataStoreContextValue["deleteTask"]>(async (id) => {
    await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
    setData((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
  }, []);

  // Drag-and-drop needs to feel instant, and nothing else awaits this call,
  // so we update local state immediately (optimistic) and quietly revert +
  // toast if the server rejects it (e.g. a Member dragging a card that
  // isn't assigned to them).
  const moveTask = React.useCallback<DataStoreContextValue["moveTask"]>((id, status) => {
    let previous: Task | undefined;
    setData((prev) => {
      previous = prev.tasks.find((t) => t.id === id);
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date() } : t)),
      };
    });

    apiFetch(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify({ status }) }).catch((err) => {
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id && previous ? previous : t)),
      }));
      import("sonner").then(({ toast }) =>
        toast.error(err instanceof Error ? err.message : "Couldn't move that task.")
      );
    });
  }, []);

  // ----- Members -----
  const addMember = React.useCallback<DataStoreContextValue["addMember"]>(
    async (projectId, target, role) => {
      await apiFetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ ...target, role }),
      });
      await refreshProjects();
    },
    [refreshProjects]
  );

  const updateMemberRole = React.useCallback<DataStoreContextValue["updateMemberRole"]>(
    async (memberId, role) => {
      const member = members.find((m) => m.id === memberId);
      if (!member) throw new Error("Member not found.");
      await apiFetch(`/api/projects/${member.projectId}/members/${memberId}`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
      await refreshProjects();
    },
    [members, refreshProjects]
  );

  const removeMember = React.useCallback<DataStoreContextValue["removeMember"]>(
    async (memberId) => {
      const member = members.find((m) => m.id === memberId);
      if (!member) throw new Error("Member not found.");
      await apiFetch(`/api/projects/${member.projectId}/members/${memberId}`, { method: "DELETE" });
      await refreshProjects();
    },
    [members, refreshProjects]
  );

  // ----- Notifications -----
  // Self-contained (optimistic + internal error toast) since the header
  // dropdown calls these directly without awaiting or wrapping in try/catch.
  const markNotificationRead = React.useCallback<DataStoreContextValue["markNotificationRead"]>((id) => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    apiFetch(`/api/notifications/${id}`, { method: "PUT" }).catch(() => {
      import("sonner").then(({ toast }) => toast.error("Couldn't update that notification."));
    });
  }, []);

  const markAllNotificationsRead = React.useCallback<DataStoreContextValue["markAllNotificationsRead"]>(() => {
    setData((prev) => ({ ...prev, notifications: prev.notifications.map((n) => ({ ...n, read: true })) }));
    apiFetch(`/api/notifications/read-all`, { method: "PUT" }).catch(() => {
      import("sonner").then(({ toast }) => toast.error("Couldn't mark notifications as read."));
    });
  }, []);

  // ----- Comments -----
  const getTaskComments = React.useCallback<DataStoreContextValue["getTaskComments"]>(async (taskId) => {
    return apiFetch<Comment[]>(`/api/tasks/${taskId}/comments`);
  }, []);

  const addComment = React.useCallback<DataStoreContextValue["addComment"]>(async (taskId, message) => {
    return apiFetch<Comment>(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }, []);

  const value: DataStoreContextValue = {
    currentUser: data.currentUser,
    currentUserId: data.currentUser?.id ?? "",
    users: data.users,
    projects: data.projects,
    tasks: data.tasks,
    members,
    notifications: data.notifications,
    activityLogs: data.activityLogs,
    getUserById,
    getMyRole,
    refresh,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    addMember,
    updateMemberRole,
    removeMember,
    markNotificationRead,
    markAllNotificationsRead,
    getTaskComments,
    addComment,
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background px-6">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-medium">Couldn&apos;t load your workspace</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              refresh()
                .catch((err) => setError(err instanceof Error ? err.message : "Failed to load your workspace."))
                .finally(() => setLoading(false));
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>;
}

export function useDataStore(): DataStoreContextValue {
  const ctx = React.useContext(DataStoreContext);
  if (!ctx) throw new Error("useDataStore must be used within a DataStoreProvider");
  return ctx;
}

export function getProjectStats(projectId: string, tasks: Task[], members: Member[]) {
  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const total = projectTasks.length;
  const completed = projectTasks.filter((t) => t.status === "COMPLETED").length;
  const inProgress = projectTasks.filter((t) => t.status === "IN_PROGRESS").length;
  const todo = projectTasks.filter((t) => t.status === "TODO").length;
  const overdue = projectTasks.filter(
    (t) => t.status !== "COMPLETED" && t.deadline && new Date(t.deadline) < new Date()
  ).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  const memberCount = members.filter((m) => m.projectId === projectId).length;
  return { total, completed, inProgress, todo, overdue, progress, memberCount };
}
