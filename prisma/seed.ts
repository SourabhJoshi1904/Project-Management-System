import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed script for MongoDB. Unlike the old Postgres version, we can't hardcode
 * ids like "user-1" anymore — MongoDB ids must be valid 24-character
 * ObjectId hex strings, generated automatically when a document is created.
 * So instead of upserting by a fixed id, we upsert by a unique business key
 * (clerkId for users, title+ownerId for projects, etc.) and keep the
 * generated ids in local variables to wire up relations below.
 */
async function main() {
  console.log("Seeding MongoDB database...");

  // ----- Users -----
  // NOTE: clerkId values below are placeholders. After you sign up through
  // the app with Clerk, find your real Clerk user id in the Clerk dashboard
  // (Users → your user → "User ID") and replace "demo_clerk_1" with it, then
  // re-run `npm run db:seed` — that links all this demo data to your real
  // account instead of a fake placeholder user.
  const userDefs = [
    { clerkId: "demo_clerk_1", name: "You (Demo Admin)", email: "you@taskflow.dev" },
    { clerkId: "demo_clerk_2", name: "Rahul Sharma", email: "rahul@taskflow.dev" },
    { clerkId: "demo_clerk_3", name: "Amit Verma", email: "amit@taskflow.dev" },
    { clerkId: "demo_clerk_4", name: "Priya Singh", email: "priya@taskflow.dev" },
  ];
  const users = new Map<string, { id: string }>();
  for (const u of userDefs) {
    const user = await prisma.user.upsert({
      where: { clerkId: u.clerkId },
      update: { name: u.name, email: u.email },
      create: u,
    });
    users.set(u.clerkId, user);
  }
  const [you, rahul, amit, priya] = userDefs.map((u) => users.get(u.clerkId)!.id);
  console.log(`Created/updated ${userDefs.length} users`);

  // ----- Projects -----
  // Projects don't have a natural unique key in the schema, so for a
  // re-runnable seed we delete any previous demo projects (matched by
  // title + owner) before recreating them.
  const projectDefs = [
    {
      title: "Weather App",
      description: "Real-time weather forecast system with location search and 7-day outlook.",
      deadline: new Date("2026-06-30"),
      status: "ACTIVE" as const,
      ownerId: you,
    },
    {
      title: "TaskFlow Marketing Site",
      description: "Landing page, pricing, and blog for the TaskFlow product launch.",
      deadline: new Date("2026-07-15"),
      status: "ACTIVE" as const,
      ownerId: you,
    },
    {
      title: "Mobile App Revamp",
      description: "Redesign the companion mobile app with a new design system.",
      deadline: new Date("2026-08-31"),
      status: "ACTIVE" as const,
      ownerId: rahul,
    },
    {
      title: "Internal Analytics Dashboard",
      description: "Company-wide dashboard for tracking KPIs across teams.",
      deadline: new Date("2026-04-30"),
      status: "COMPLETED" as const,
      ownerId: you,
    },
  ];

  await prisma.project.deleteMany({
    where: { title: { in: projectDefs.map((p) => p.title) }, ownerId: { in: [you, rahul] } },
  });
  const projects: Record<string, string> = {};
  for (const p of projectDefs) {
    const created = await prisma.project.create({ data: p });
    projects[p.title] = created.id;
  }
  console.log(`Created ${projectDefs.length} projects`);

  const weatherId = projects["Weather App"];
  const marketingId = projects["TaskFlow Marketing Site"];
  const mobileId = projects["Mobile App Revamp"];
  const analyticsId = projects["Internal Analytics Dashboard"];

  // ----- Members -----
  const memberDefs: { projectId: string; userId: string; role: "ADMIN" | "MANAGER" | "MEMBER" }[] = [
    { projectId: weatherId, userId: you, role: "ADMIN" },
    { projectId: weatherId, userId: rahul, role: "MANAGER" },
    { projectId: weatherId, userId: amit, role: "MEMBER" },
    { projectId: weatherId, userId: priya, role: "MEMBER" },
    { projectId: marketingId, userId: you, role: "ADMIN" },
    { projectId: marketingId, userId: amit, role: "MANAGER" },
    { projectId: marketingId, userId: priya, role: "MEMBER" },
    { projectId: mobileId, userId: rahul, role: "ADMIN" },
    { projectId: mobileId, userId: you, role: "MANAGER" },
    { projectId: mobileId, userId: priya, role: "MEMBER" },
    { projectId: analyticsId, userId: you, role: "ADMIN" },
    { projectId: analyticsId, userId: amit, role: "MANAGER" },
  ];
  for (const m of memberDefs) {
    await prisma.member.upsert({
      where: { projectId_userId: { projectId: m.projectId, userId: m.userId } },
      update: { role: m.role },
      create: m,
    });
  }
  console.log(`Created ${memberDefs.length} memberships`);

  // ----- Tasks -----
  const taskDefs: {
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    status: "TODO" | "IN_PROGRESS" | "COMPLETED";
    deadline: Date;
    projectId: string;
    assignedToId: string | null;
  }[] = [
    { title: "Setup Next.js project", description: "Initialize repo, configure ESLint and Tailwind.", priority: "MEDIUM", status: "COMPLETED", deadline: new Date("2026-01-20"), projectId: weatherId, assignedToId: you },
    { title: "Design UI Wireframes", description: "Create wireframes for home, search, and forecast screens.", priority: "MEDIUM", status: "COMPLETED", deadline: new Date("2026-01-25"), projectId: weatherId, assignedToId: priya },
    { title: "Integrate weather API", description: "Connect to OpenWeather API and handle responses.", priority: "HIGH", status: "COMPLETED", deadline: new Date("2026-02-10"), projectId: weatherId, assignedToId: rahul },
    { title: "Create Login Page", description: "Build the login form with email and password fields.", priority: "HIGH", status: "IN_PROGRESS", deadline: new Date("2026-06-20"), projectId: weatherId, assignedToId: rahul },
    { title: "Build 7-day forecast view", description: "Show a scrollable 7-day forecast with icons.", priority: "MEDIUM", status: "IN_PROGRESS", deadline: new Date("2026-06-25"), projectId: weatherId, assignedToId: amit },
    { title: "Add location search", description: "Autocomplete city search with geolocation fallback.", priority: "MEDIUM", status: "TODO", deadline: new Date("2026-06-28"), projectId: weatherId, assignedToId: priya },
    { title: "Dark mode theming", description: "Apply dark theme across all screens.", priority: "LOW", status: "TODO", deadline: new Date("2026-06-29"), projectId: weatherId, assignedToId: you },
    { title: "Write unit tests for API layer", description: "Cover edge cases for failed API responses.", priority: "LOW", status: "TODO", deadline: new Date("2026-06-30"), projectId: weatherId, assignedToId: null },
    { title: "Define brand palette", description: "Pick colors, type, and logo direction.", priority: "MEDIUM", status: "COMPLETED", deadline: new Date("2026-02-20"), projectId: marketingId, assignedToId: priya },
    { title: "Build landing page hero", description: "Implement hero section with CTA.", priority: "HIGH", status: "COMPLETED", deadline: new Date("2026-03-05"), projectId: marketingId, assignedToId: you },
    { title: "Pricing page", description: "Three-tier pricing table with annual/monthly toggle.", priority: "HIGH", status: "IN_PROGRESS", deadline: new Date("2026-06-18"), projectId: marketingId, assignedToId: amit },
    { title: "Blog setup with MDX", description: "Configure MDX-based blog with categories.", priority: "MEDIUM", status: "TODO", deadline: new Date("2026-06-30"), projectId: marketingId, assignedToId: priya },
    { title: "SEO + Open Graph tags", description: "Add metadata, sitemap, robots.txt.", priority: "LOW", status: "TODO", deadline: new Date("2026-07-10"), projectId: marketingId, assignedToId: you },
    { title: "Audit current design system", description: "List inconsistencies across screens.", priority: "MEDIUM", status: "COMPLETED", deadline: new Date("2026-03-15"), projectId: mobileId, assignedToId: rahul },
    { title: "New component library", description: "Build reusable components in Figma + code.", priority: "HIGH", status: "IN_PROGRESS", deadline: new Date("2026-06-22"), projectId: mobileId, assignedToId: priya },
    { title: "Onboarding flow redesign", description: "Three-step onboarding with progress indicator.", priority: "HIGH", status: "TODO", deadline: new Date("2026-06-26"), projectId: mobileId, assignedToId: you },
    { title: "Push notification settings", description: "Allow users to toggle notification categories.", priority: "MEDIUM", status: "TODO", deadline: new Date("2026-07-05"), projectId: mobileId, assignedToId: rahul },
    { title: "Data pipeline setup", description: "ETL jobs from product DB to analytics warehouse.", priority: "HIGH", status: "COMPLETED", deadline: new Date("2026-01-15"), projectId: analyticsId, assignedToId: amit },
    { title: "Build KPI charts", description: "Revenue, signups, and retention charts.", priority: "HIGH", status: "COMPLETED", deadline: new Date("2026-02-28"), projectId: analyticsId, assignedToId: you },
    { title: "Access control for dashboard", description: "Role-based view restrictions.", priority: "MEDIUM", status: "COMPLETED", deadline: new Date("2026-04-15"), projectId: analyticsId, assignedToId: amit },
  ];

  await prisma.task.deleteMany({ where: { projectId: { in: [weatherId, marketingId, mobileId, analyticsId] } } });
  const tasks: { id: string; title: string; projectId: string; assignedToId: string | null }[] = [];
  for (const t of taskDefs) {
    const created = await prisma.task.create({ data: t });
    tasks.push({ id: created.id, title: created.title, projectId: created.projectId, assignedToId: created.assignedToId });
  }
  console.log(`Created ${taskDefs.length} tasks`);

  // ----- Comments -----
  const loginTask = tasks.find((t) => t.title === "Create Login Page")!;
  const pricingTask = tasks.find((t) => t.title === "Pricing page")!;
  const commentDefs = [
    { taskId: loginTask.id, userId: rahul, message: "Started on the markup, using shadcn form components." },
    { taskId: loginTask.id, userId: you, message: "Sounds good, make sure to add Zod validation for email format." },
    { taskId: pricingTask.id, userId: amit, message: "Toggle for annual/monthly is working, polishing styles now." },
  ];
  for (const c of commentDefs) {
    await prisma.comment.create({ data: c });
  }
  console.log(`Created ${commentDefs.length} comments`);

  // ----- A little activity history + a couple of unread notifications -----
  await prisma.activityLog.create({
    data: { userId: rahul, projectId: weatherId, taskId: loginTask.id, action: "TASK_CREATED", description: "Rahul Sharma created task 'Create Login Page'" },
  });
  await prisma.activityLog.create({
    data: { userId: amit, projectId: marketingId, taskId: pricingTask.id, action: "TASK_UPDATED", description: "Amit Verma moved 'Pricing page' to In Progress" },
  });
  await prisma.notification.create({
    data: { userId: you, title: "Task Assigned", message: "Rahul Sharma assigned you 'Onboarding flow redesign'.", type: "INFO" },
  });
  await prisma.notification.create({
    data: { userId: you, title: "Deadline Tomorrow", message: "'Dark mode theming' is due soon.", type: "WARNING" },
  });

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
