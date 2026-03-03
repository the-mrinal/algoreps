import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import ThemeProvider from "@/components/theme/ThemeProvider";
import UserProvider from "@/contexts/UserContext";
import { AttemptProvider } from "@/contexts/AttemptContext";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <ThemeProvider userId={user.id}>
      <UserProvider userId={user.id}>
        <AttemptProvider>
          <div className="min-h-screen flex bg-[var(--background)]">
            <Sidebar email={user.email ?? ""} />
            <main className="flex-1 p-6 md:p-8 pt-16 md:pt-8">{children}</main>
          </div>
        </AttemptProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
