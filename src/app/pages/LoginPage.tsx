import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { mockUsers, setCurrentUser } from "@/app/lib/mockData";
import { toast } from "sonner";
import { Hotel, ShieldCheck, Mail, Lock } from "lucide-react";
import { motion } from "motion/react";
import { APP_CONFIG } from "@/app/constants/config";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const user = mockUsers.find((u) => u.email === email);

    if (!user) {
      toast.error("Email không tồn tại");
      return;
    }

    setCurrentUser(user);
    toast.success(`Đăng nhập thành công! Xin chào ${user.name}`);

    if (user.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/member");
    }
  };

  const handleQuickLogin = (role: "admin" | "member") => {
    const user = mockUsers.find((u) => u.role === role);
    if (user) {
      setCurrentUser(user);
      toast.success(`Đăng nhập nhanh với vai trò ${role}`);
      navigate(role === "admin" ? "/admin" : "/member");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030213] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-white/10 glass-card premium-shadow text-white bg-white/5 overflow-hidden">
          <div className="h-2 premium-gradient w-full" />
          <CardHeader className="text-center pt-8">
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="flex justify-center mb-6"
            >
              <div className="premium-gradient p-4 rounded-2xl shadow-lg rotate-3 hover:rotate-0 transition-transform duration-300">
                <Hotel className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <CardTitle className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              {APP_CONFIG.NAME}
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm mt-2">
              Hệ thống theo dõi giá khách sạn thông minh
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 ml-1">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10 h-11 bg-white/5 border-white/10 text-white focus:ring-indigo-500/50 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 ml-1">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 bg-white/5 border-white/10 text-white focus:ring-indigo-500/50 rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full premium-gradient border-none hover:opacity-90 mt-2 h-11 text-base shadow-lg shadow-indigo-600/20 rounded-xl">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Đăng nhập
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs text-gray-400 text-center mb-4 uppercase tracking-widest font-semibold">Demo Quick Login</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleQuickLogin("admin")}
                  type="button"
                  className="bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 h-10 rounded-xl"
                >
                  Admin
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickLogin("member")}
                  type="button"
                  className="bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 h-10 rounded-xl"
                >
                  Member
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
