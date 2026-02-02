import { useEffect, useState, useMemo } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { getCurrentUser, logout, User } from "@/app/lib/mockData";
import { Button } from "@/app/components/ui/button";
import { BarChart3, LogOut, Search, Hotel, User as UserIcon, Bell } from "lucide-react";
import { motion } from "motion/react";
import { APP_CONFIG } from "@/app/constants/config";

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

  const menuItems = useMemo(() => [
    { path: "/member/price-check", label: "Kiểm tra giá", icon: Search },
    { path: "/member/report", label: "Báo cáo chiến lược", icon: BarChart3 },
  ], []);

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/member" && location.pathname.startsWith(path)) ||
    (path === "/member" && location.pathname === "/member");

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <Link to="/member" className="flex items-center gap-3 group">
                <div className="premium-gradient p-2.5 rounded-2xl shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                  <Hotel className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl tracking-tight text-indigo-950 font-display">{APP_CONFIG.NAME}</h1>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-400">Portal Thành viên</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2 md:gap-6">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">System Online</span>
              </div>

              <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
                <Button variant="ghost" size="icon" className="rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </Button>

                <div className="flex items-center gap-3 bg-gray-50 p-1 pr-4 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-gray-100 group-hover:scale-95 transition-transform">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold text-indigo-950 truncate max-w-[100px]">{user?.name}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{user?.role}</p>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={handleLogout} title="Đăng xuất">
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b py-2 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {menuItems.map((nav) => (
              <Link key={nav.path} to={nav.path}>
                <Button
                  variant="ghost"
                  className={`
                    flex gap-2 rounded-xl h-11 px-6 font-bold text-sm transition-all duration-300 whitespace-nowrap
                    ${isActive(nav.path)
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
                      : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"}
                  `}
                >
                  <nav.icon className={`w-4 h-4 ${isActive(nav.path) ? "animate-pulse" : ""}`} />
                  {nav.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-gray-100 mt-12 text-gray-400 font-medium">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-60">
            <Hotel className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-widest">{APP_CONFIG.NAME} Platform © 2026</span>
          </div>
          <div className="flex gap-6 text-xs uppercase tracking-widest">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
