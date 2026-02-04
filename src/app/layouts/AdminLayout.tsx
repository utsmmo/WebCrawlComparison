import { useEffect, useState, useMemo } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { getCurrentUser, logout, User } from "@/app/lib/mockData";
import { Button } from "@/app/components/ui/button";
import { LayoutDashboard, LogOut, MapPin, Users, Hotel, ShieldCheck, Bell, Search, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { APP_CONFIG } from "@/app/constants/config";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/app/components/ui/sidebar";

function AdminSidebar({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const menuItems = useMemo(() => [
    { path: "/admin/dashboard", label: "Hệ thống", icon: LayoutDashboard },
    { path: "/admin/groups", label: "Quản lý nhóm", icon: MapPin },
    { path: "/admin/competitors", label: "Cấu hình đối thủ", icon: Users },
    { path: "/admin/settings", label: "Cài đặt", icon: Settings },
  ], []);

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-border">
        <Link to="/admin" className="flex items-center gap-3 group overflow-hidden">
          <div className="bg-primary p-2 rounded-lg shadow-sm shrink-0">
            <Hotel className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <h1 className="font-bold text-sm tracking-tight whitespace-nowrap">{APP_CONFIG.NAME}</h1>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">System Control</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.path)}
                tooltip={item.label}
                className={`
                  h-10 px-3 rounded-lg transition-colors
                  ${isActive(item.path)
                    ? "bg-secondary text-secondary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}
                `}
              >
                <Link to={item.path} className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground border border-border shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">{user?.name}</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Super Admin</p>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={onLogout}
            className="w-full justify-start gap-3 h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm group-data-[collapsible=icon]:hidden">Đăng xuất</span>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate("/");
      return;
    }
    if (currentUser.role !== "admin") {
      navigate("/member");
      return;
    }
    setUser(currentUser);
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar user={user} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="hidden lg:flex items-center bg-secondary/50 rounded-lg px-3 h-9 border border-border group-focus-within:border-primary transition-colors">
                <Search className="w-4 h-4 text-muted-foreground mr-2" />
                <input
                  placeholder="Kiểm tra dữ liệu nhanh..."
                  className="bg-transparent border-none text-xs font-medium text-foreground placeholder:text-muted-foreground focus:ring-0 w-48"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:text-foreground relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-card" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="max-w-7xl mx-auto w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
