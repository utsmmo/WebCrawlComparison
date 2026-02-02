import { useEffect, useState, useMemo } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { getCurrentUser, logout, User } from "@/app/lib/mockData";
import { Button } from "@/app/components/ui/button";
import { LayoutDashboard, LogOut, MapPin, Users, Hotel, ShieldCheck, Bell, Search, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { APP_CONFIG } from "@/app/constants/config";

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

  const menuItems = useMemo(() => [
    { path: "/admin/dashboard", label: "Hệ thống", icon: LayoutDashboard },
    { path: "/admin/groups", label: "Quản lý nhóm", icon: MapPin },
    { path: "/admin/competitors", label: "Cấu hình đối thủ", icon: Users },
    { path: "/admin/settings", label: "Cài đặt", icon: Settings },
  ], []);

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/admin" && location.pathname.startsWith(path)) ||
    (path === "/admin" && location.pathname === "/admin");

  return (
    <div className="min-h-screen bg-[#f1f3f9]">
      {/* Header */}
      <header className="bg-indigo-950 text-white sticky top-0 z-50 shadow-2xl shadow-indigo-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="flex items-center gap-3">
                <div className="premium-gradient p-2.5 rounded-2xl shadow-lg rotate-6">
                  <Hotel className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl tracking-tight font-display">{APP_CONFIG.NAME} System</h1>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-300">Trung tâm Điều hành Admin</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-2xl px-3 py-1.5 focus-within:bg-white/10 transition-colors">
                <Search className="w-4 h-4 text-white/40 mr-2" />
                <input
                  placeholder="Tìm kiếm lệnh..."
                  className="bg-transparent border-none text-xs font-bold text-white placeholder:text-white/20 focus:ring-0 w-32"
                />
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/40 font-bold ml-2">⌘K</span>
              </div>

              <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                <Button variant="ghost" size="icon" className="rounded-xl text-indigo-200 hover:text-white hover:bg-white/5 relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-400 rounded-full border-2 border-indigo-950" />
                </Button>

                <div className="flex items-center gap-3 bg-white/5 p-1 pr-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 border border-indigo-500/30 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold text-white truncate max-w-[100px]">{user?.name}</p>
                    <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider">Quản trị viên Hệ thống</p>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="rounded-xl text-indigo-200 hover:text-red-400 hover:bg-red-400/10" onClick={handleLogout}>
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b sticky top-20 z-40 py-2 shadow-sm mb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {menuItems.map((nav) => (
              <Link key={nav.path} to={nav.path}>
                <Button
                  variant="ghost"
                  className={`
                    flex gap-2 rounded-xl h-11 px-6 font-bold text-sm transition-all whitespace-nowrap
                    ${isActive(nav.path)
                      ? "bg-indigo-950 text-white shadow-xl shadow-indigo-900/20 hover:bg-indigo-900"
                      : "text-gray-500 hover:bg-gray-100 hover:text-indigo-950"}
                  `}
                >
                  <nav.icon className="w-4 h-4" />
                  {nav.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-200 mt-12 text-gray-400 font-bold">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-950 rounded-lg">
              <Hotel className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-indigo-950">{APP_CONFIG.NAME} Admin © 2026</span>
          </div>
          <div className="flex gap-8 text-[10px] uppercase tracking-widest text-gray-500 font-extrabold">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> DB Status: 100%</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Bot Nodes: 4/4</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Latency: 42ms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
