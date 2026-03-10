/**
 * Shared layout for logged-in pages: sidebar nav, main content, footer.
 */
import { auth } from "@/auth";
import DashboardSidebar from "./DashboardSidebar";
import DashboardFooter from "./DashboardFooter";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      <DashboardSidebar isAdmin={isAdmin} userName={session?.user?.name ?? null} />
      <main className="flex-1 min-w-0 pl-56 flex flex-col">
        <div className="max-w-4xl w-full mx-auto px-4 py-6 flex-1">
          {children}
        </div>
        <div className="max-w-4xl w-full mx-auto px-4 pb-6">
          <DashboardFooter />
        </div>
      </main>
    </div>
  );
}
