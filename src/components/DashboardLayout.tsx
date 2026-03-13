import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Search, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  user?: {
    name: string;
    email: string;
    phone: string;
    role: string;
    firm: string;
  };
}

export function DashboardLayout({ children, title, subtitle, actions, user }: DashboardLayoutProps) {
  const { signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar user={user} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cases, clients, or documents..."
                  className="pl-9 w-[320px] h-9 bg-secondary border-0 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
                <Bell className="h-[18px] w-[18px] text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
              </button>
              
              <Button variant="ghost" size="icon" onClick={() => signOut()} title="Sign Out">
                <LogOut className="h-[18px] w-[18px] text-muted-foreground" />
              </Button>

            </div>
          </header>

          <main className="flex-1 overflow-auto">
            {(title || actions) && (
              <div className="px-6 pt-6 pb-2 flex items-start justify-between">
                <div>
                  {title && <h1 className="text-2xl font-bold text-foreground">{title}</h1>}
                  {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-3">{actions}</div>}
              </div>
            )}
            <div className="p-6 pt-4">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
