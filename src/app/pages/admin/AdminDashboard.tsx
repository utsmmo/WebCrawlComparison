import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { mockGroups, mockCompetitors } from "@/app/lib/mockData";
import {
  MapPin,
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";

export function AdminDashboard() {
  // Memoized stats
  const stats = useMemo(() => ({
    totalGroups: mockGroups.length,
    totalCompetitors: mockCompetitors.length,
    crawlSuccessRate: 96.5,
    lastCrawlTime: "2 phút trước",
  }), []);

  const recentActivities = useMemo(() => [
    {
      id: "1",
      type: "success",
      message: "Crawl thành công 12 đối thủ tại Hội An",
      time: "2 phút trước",
    },
    {
      id: "2",
      type: "warning",
      message: "Giá Four Seasons tăng 15% trong 24h",
      time: "1 giờ trước",
    },
    {
      id: "3",
      type: "success",
      message: "Thêm 3 đối thủ mới tại Đà Lạt",
      time: "3 giờ trước",
    },
    {
      id: "4",
      type: "error",
      message: "Lỗi crawl InterContinental Danang",
      time: "5 giờ trước",
    },
  ], []);

  const topPriceChanges = useMemo(() => [
    { competitor: "Four Seasons Nam Hai", change: 15.2, type: "increase" },
    { competitor: "Hyatt Regency Danang", change: -10.0, type: "decrease" },
    { competitor: "Little Riverside", change: 8.2, type: "increase" },
    { competitor: "Anantara Hoi An", change: -5.8, type: "decrease" },
  ], []);

  // Memoized group data for the table
  const groupTableData = useMemo(() => {
    return mockGroups.map((group) => {
      const competitorsInGroup = mockCompetitors.filter(
        (c) => c.groupId === group.id
      );
      const highPriorityCount = competitorsInGroup.filter(
        (c) => c.priority === "high"
      ).length;

      return {
        ...group,
        competitorCount: competitorsInGroup.length,
        highPriorityCount
      };
    });
  }, []);

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-indigo-950 font-display">Hệ thống quản trị</h1>
          <p className="text-gray-500 mt-1">Quản lý hạ tầng crawl và cấu hình so sánh giá</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 rounded-xl">
            <Clock className="w-4 h-4" />
            Lịch sử
          </Button>
          <Button className="gap-2 premium-gradient border-none rounded-xl shadow-lg shadow-indigo-200">
            <RefreshCw className="w-4 h-4" />
            Chạy crawl ngay
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng số nhóm", value: stats.totalGroups, sub: "Điểm đến quản lý", icon: MapPin, color: "indigo" },
          { label: "Tổng số đối thủ", value: stats.totalCompetitors, sub: "Khách sạn theo dõi", icon: Users, color: "blue" },
          { label: "Tỉ lệ thành công", value: `${stats.crawlSuccessRate}%`, sub: "Trong 24h qua", icon: Activity, color: "green" },
          { label: "Crawl lần cuối", value: stats.lastCrawlTime, sub: "Trạng thái: OK", icon: Zap, color: "purple" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-md overflow-hidden group hover:shadow-xl transition-all">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</CardTitle>
                <div className={`p-2 rounded-lg transition-colors bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white`}>
                  <item.icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-indigo-950">{item.value}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{item.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2 shadow-lg border-none">
          <CardHeader className="border-b bg-gray-50/30">
            <CardTitle className="text-lg font-display">Nhật ký hoạt động</CardTitle>
            <CardDescription>Cập nhật tự động từ hệ thống bot crawl</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 relative">
                  <div className={`mt-1 p-2 rounded-full ${activity.type === "success" ? "bg-green-100 text-green-600" :
                    activity.type === "warning" ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"
                    }`}>
                    {activity.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 pb-4 border-b border-gray-50 last:border-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-semibold text-gray-800">{activity.message}</p>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{activity.time}</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-5">System</Badge>
                      {activity.type === "error" && <Button variant="link" className="p-0 h-auto text-xs text-red-600 font-bold">Thử lại</Button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-gray-500 text-sm font-bold h-11 hover:bg-gray-50">Xem tất cả nhật ký</Button>
          </CardContent>
        </Card>

        {/* Top Price Changes */}
        <Card className="shadow-lg border-none bg-indigo-950 text-white overflow-hidden">
          <div className="h-1.5 premium-gradient w-full" />
          <CardHeader>
            <CardTitle className="text-lg font-display">Cảnh báo biến động</CardTitle>
            <CardDescription className="text-indigo-300">Biến động giá mạnh nhất 24h qua</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {topPriceChanges.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.type === "increase" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                      {item.type === "increase" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <span className="text-sm font-medium">{item.competitor}</span>
                  </div>
                  <span className={`text-sm font-bold ${item.type === "increase" ? "text-red-400" : "text-green-400"}`}>
                    {item.type === "increase" ? "+" : ""}{item.change}%
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-indigo-900/50 rounded-2xl border border-white/10">
              <p className="text-xs leading-relaxed text-indigo-200">
                Hệ thống gợi ý điều chỉnh giá cho <span className="font-bold text-white underline">Hội An</span> dựa trên xu hướng tăng của 3 đối thủ lớn nhất.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groups Overview */}
      <Card className="shadow-lg border-none overflow-hidden">
        <CardHeader className="bg-gray-50/30 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-display">Cấu hình nhóm điểm đến</CardTitle>
            <CardDescription>Quản lý các cụm khách sạn đối thủ theo khu vực</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="rounded-lg h-9 font-bold text-xs uppercase tracking-widest">Thêm nhóm mới</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="pl-6 font-bold text-xs uppercase tracking-widest">Tên nhóm</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest">Địa điểm</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest">Số đối thủ</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest">Ưu tiên</TableHead>
                <TableHead className="text-right pr-6 font-bold text-xs uppercase tracking-widest">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupTableData.map((group) => (
                <TableRow key={group.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="pl-6 font-bold text-indigo-900">{group.name}</TableCell>
                  <TableCell className="text-sm text-gray-600">{group.location}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{group.competitorCount}</span>
                      <span className="text-xs text-gray-400 font-medium whitespace-nowrap">khách sạn</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-none px-2 py-0.5">
                      {group.highPriorityCount} priority
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-bold text-green-600">Hoạt động</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
