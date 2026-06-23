import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { DataStoreProvider } from "@/lib/store";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <DataStoreProvider>
      <div className="flex h-dvh min-w-0 flex-col overflow-hidden bg-background md:flex-row">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="min-w-0 flex-1 overflow-y-auto px-3 py-4 pb-24 sm:px-5 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </DataStoreProvider>
  );
}
