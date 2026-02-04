import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { toast } from "sonner";
import { Hotel, ShieldCheck, User as UserIcon, Lock } from "lucide-react";
import { motion } from "motion/react";
import { APP_CONFIG } from "@/app/constants/config";
import { mockUsers, setCurrentUser } from "@/app/lib/mockData";

// ====================================================================================
// Component
// ====================================================================================

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const user = mockUsers.find(
        (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
      );

      if (!user) {
        toast.error("Sai tên đăng nhập hoặc mật khẩu!");
        setIsLoading(false);
        return;
      }

      setCurrentUser(user);
      toast.success(`Đăng nhập thành công! Xin chào ${user.name}`);

      // Use window.location for reliable redirect
      if (user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/member";
      }

      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md p-4"
      >
        <Card className="border-border shadow-sm bg-card overflow-hidden">
          <CardHeader className="text-center pt-10 pb-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center mb-6"
            >
              <div className="bg-primary p-3.5 rounded-xl shadow-sm">
                <Hotel className="w-8 h-8 text-primary-foreground" />
              </div>
            </motion.div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              {APP_CONFIG.NAME}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm mt-1">
              Hệ thống theo dõi giá khách sạn thông minh
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="ml-0.5">Tên đăng nhập</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Nhập tên đăng nhập"
                    className="pl-10 h-10 bg-background border-border text-foreground focus:ring-ring rounded-lg"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="ml-0.5">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-10 bg-background border-border text-foreground focus:ring-ring rounded-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2 h-10 text-sm font-semibold rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang đăng nhập...
                  </span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Đăng nhập
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center uppercase tracking-[0.15em] font-medium">
                Liên hệ Admin nếu quên mật khẩu
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
