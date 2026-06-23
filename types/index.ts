export type MemberRole = "ADMIN" | "MANAGER" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type ProjectStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type NotificationType = "INFO" | "WARNING" | "SUCCESS" | "ERROR";

export interface User {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  deadline?: Date | null;
  status: ProjectStatus;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  owner?: User;
  members?: Member[];
  tasks?: Task[];
  _count?: {
    tasks: number;
    members: number;
  };
}

export interface Member {
  id: string;
  projectId: string;
  userId: string;
  role: MemberRole;
  createdAt: Date;
  user?: User;
  project?: Project;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  deadline?: Date | null;
  projectId: string;
  assignedToId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  assignedTo?: User | null;
  comments?: Comment[];
  _count?: {
    comments: number;
  };
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  task?: Task;
}

export interface ActivityLog {
  id: string;
  userId: string;
  projectId?: string | null;
  taskId?: string | null;
  action: string;
  description: string;
  createdAt: Date;
  user?: User;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overallProgress: number;
}
