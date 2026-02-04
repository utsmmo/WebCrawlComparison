import { useEffect, useState, useMemo } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { getCurrentUser, logout, User } from "@/app/lib/mockData";
import { Button } from "@/app/components/ui/button";
import { LogOut, Search, Hotel, User as UserIcon, Bell, BarChart3 } from "lucide-react";
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

function MemberSidebar({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const menuItems = useMemo(() => [
    { path: "/member/price-check", label: "Kiểm tra giá", icon: Search },
    { path: "/member/report", label: "Báo cáo chiến lược", icon: BarChart3 },
  ], []);

  return (
    <Sidebar collapsible="icon" className="border-r border-indigo-50/50 dark:border-white/5">
      <SidebarHeader className="h-20 flex items-center px-4 border-b border-indigo-50/50 dark:border-white/5">
        <Link to="/member" className="flex items-center gap-3 group overflow-hidden">
          <div className="premium-gradient p-2.5 rounded-xl shadow-lg shadow-indigo-200/50 shrink-0">
            <Hotel className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <h1 className="font-bold text-sm tracking-tight text-indigo-950 dark:text-white font-display whitespace-nowrap">{APP_CONFIG.NAME}</h1>
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-400">Portal Thành viên</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-6">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.path)}
                tooltip={item.label}
                className={`
                  h-11 px-3 rounded-xl transition-all duration-300
                  ${isActive(item.path)
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
                    : "text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white"
                  }
                `}
              >
                <Link to={item.path} className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${isActive(item.path) ? "animate-pulse" : ""}`} />
                  <span className="font-bold text-sm group-data-[collapsible=icon]:hidden">{item.label}</span>
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="active-pill"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-white group-data-[collapsible=icon]:hidden"
                    />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-indigo-50/50 dark:border-white/5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-white/5 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent">
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0 border border-gray-100 dark:border-white/5">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <p className="text-xs font-bold text-indigo-950 dark:text-white truncate max-w-[120px]">{user?.name}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={onLogout}
            className="w-full justify-start gap-3 h-11 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm group-data-[collapsible=icon]:hidden">Đăng xuất</span>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function MemberLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate("/");
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
      <div className="flex min-h-screen w-full bg-[#f8fafc] dark:bg-[#030213]">
        <MemberSidebar user={user} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-20 border-b border-indigo-50/50 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400" />
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">System Live</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-xl text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-white/5 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-indigo-950" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.995 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="max-w-7xl mx-auto w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>

            <footer className="max-w-7xl mx-auto w-full py-12 border-t border-indigo-50/50 dark:border-white/5 mt-12 text-gray-400 dark:text-gray-600 font-medium">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 opacity-60">
                  <Hotel className="w-4 h-4 text-indigo-600" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{APP_CONFIG.NAME} Platform © 2026</span>
                </div>
                <div className="flex gap-6 text-[10px] uppercase tracking-widest">
                  <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
