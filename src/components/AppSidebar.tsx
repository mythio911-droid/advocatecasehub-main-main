import {
  LayoutDashboard, Briefcase, ListChecks, Users, FileText, Calendar, Settings, Shield, Scale, Bell
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const baseMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Cases", url: "/cases", icon: Briefcase },
  { title: "Cause List", url: "/cause-list", icon: ListChecks },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

export function AppSidebar({ user }: { user?: { name: string; email: string; phone: string; role: string; firm: string } }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { userProfile } = useAuth();

  const menuItems = [...baseMenuItems];
  if (userProfile?.role === "admin") {
    menuItems.push({ title: "Team", url: "/team", icon: Shield });
  }
  menuItems.push({ title: "Settings", url: "/settings", icon: Settings });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Scale className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-slide-in">
              <h2 className="text-sm font-bold text-foreground leading-none">AdvocateCaseOS</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Legal Management</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && user && (
          <div className="flex items-center gap-3 animate-slide-in">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {user.name?.split(" ").map((n) => n[0]).join("").toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground leading-none">{user.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{user.email}</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
