import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Label } from "@/app/components/ui/label";
import { mockGroups } from "@/app/lib/mockData";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { TrendingUp, Award, BarChart3, Calendar, MapPin, Info } from "lucide-react";
import { APP_CONFIG } from "@/app/constants/config";
import { formatCurrency } from "@/app/lib/utils";

export function ReportPage() {
  const [selectedGroup, setSelectedGroup] = useState("1");
  const [timeRange, setTimeRange] = useState("7");
  const [groups, setGroups] = useState(mockGroups);

  useEffect(() => {
    const loadReportGroups = () => {
      try {
        const data = localStorage.getItem("joyon_groups");
        if (data) {
          const parsed = JSON.parse(data);
          setGroups(parsed);
          // Only auto-select if "1" (mock id) is currently selected to avoid overriding user intention
          if (parsed.length > 0 && selectedGroup === "1") {
            setSelectedGroup(parsed[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to load groups:", e);
      }
    };

    loadReportGroups();

    // Listen to changes across tabs
    window.addEventListener('storage', loadReportGroups);
    // Listen to changes in the same window (custom event)
    window.addEventListener('local-storage-update', loadReportGroups);

    return () => {
      window.removeEventListener('storage', loadReportGroups);
      window.removeEventListener('local-storage-update', loadReportGroups);
    };
  }, [selectedGroup]);

  // Memoized mock data
  const priceHistoryData = useMemo(() => [
    { date: "26/01", yourPrice: 4000000, minCompetitor: 4500000, avgCompetitor: 5200000 },
    { date: "27/01", yourPrice: 4000000, minCompetitor: 4300000, avgCompetitor: 5100000 },
    { date: "28/01", yourPrice: 4200000, minCompetitor: 4200000, avgCompetitor: 4900000 },
    { date: "29/01", yourPrice: 4200000, minCompetitor: 4100000, avgCompetitor: 4800000 },
    { date: "30/01", yourPrice: 4000000, minCompetitor: 3900000, avgCompetitor: 4700000 },
    { date: "31/01", yourPrice: 4000000, minCompetitor: 4200000, avgCompetitor: 4900000 },
    { date: "01/02", yourPrice: 4000000, minCompetitor: 4500000, avgCompetitor: 5200000 },
  ], []);

  const competitorComparisonData = useMemo(() => [
    { name: "Anantara", price: 4500000, change: -5.8 },
    { name: "Four Seasons", price: 12000000, change: 0 },
    { name: "Little Riverside", price: 2100000, change: 8.2 },
    { name: "InterContinental", price: 5800000, change: -2.1 },
    { name: "Hyatt Regency", price: 4200000, change: -10.0 },
  ], []);

  const formatYAxis = (value: number) => {
    return (value / 1000000).toFixed(1) + "M";
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-indigo-950 font-display">Báo cáo chiến lược</h1>
          <p className="text-gray-500 mt-1">Phân tích chuyên sâu hiệu quả giá và vị thế cạnh tranh</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-xl">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-900">{groups.find(g => g.id === selectedGroup)?.name || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-xl">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">{timeRange} ngày qua</span>
          </div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="overflow-hidden border-none shadow-xl bg-white group hover:shadow-2xl transition-all duration-300">
            <div className="h-1.5 premium-gradient w-full" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tỉ lệ cạnh tranh</CardTitle>
                <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-4xl font-bold text-indigo-950">68%</p>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+5.2%</span>
              </div>
              <CardDescription className="mt-3 text-gray-400 font-medium">Bạn đang có mức giá cạnh tranh hơn 68% đối thủ trong khu vực</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="overflow-hidden border-none shadow-xl bg-white group hover:shadow-2xl transition-all duration-300">
            <div className="h-1.5 bg-green-500 w-full" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Giá tối ưu đề xuất</CardTitle>
                <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-3xl font-bold text-indigo-950">4,300,000 <span className="text-sm font-normal text-gray-400">VND</span></p>
              </div>
              <CardDescription className="mt-3 text-gray-400 font-medium">Mức giá khuyến nghị để tối ưu hóa tỉ lệ lấp đầy phòng</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="overflow-hidden border-none shadow-xl bg-white group hover:shadow-2xl transition-all duration-300">
            <div className="h-1.5 bg-orange-500 w-full" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cơ hội tăng giá</CardTitle>
                <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-orange-600">
                <p className="text-4xl font-bold">+7.5%</p>
              </div>
              <CardDescription className="mt-3 text-gray-400 font-medium">Có thể tăng giá vào các ngày cuối tuần mà vẫn giữ được lợi thế</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Filters - Sidebar styling in desktop */}
        <Card className="lg:col-span-3 shadow-lg border-indigo-50/50 glass-card h-fit">
          <CardHeader>
            <CardTitle className="text-lg font-display">Tùy chỉnh báo cáo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="report-group" className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Điểm đến</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger id="report-group" className="bg-white/50 border-gray-100 rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-range" className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Khoảng thời gian</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger id="time-range" className="bg-white/50 border-gray-100 rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 ngày qua</SelectItem>
                  <SelectItem value="14">14 ngày qua</SelectItem>
                  <SelectItem value="30">30 ngày qua</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-8 p-5 premium-gradient rounded-2xl text-white shadow-lg shadow-indigo-200">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 opacity-80" />
                <h4 className="text-xs font-bold uppercase tracking-wider">AI Insight</h4>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                AI nhận thấy nhu cầu tại <span className="font-bold underline">{groups.find(g => g.id === selectedGroup)?.name || "khu vực này"}</span> đang tăng trưởng mạnh.
                Dự báo giá đối thủ sẽ tăng thêm 12% trong 48h tới.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-9 space-y-6">
          {/* Price History Chart */}
          <Card className="shadow-xl border-none overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/30 border-b border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-display">Biến động giá thị trường</CardTitle>
                  <CardDescription>Theo dõi sự thay đổi giá theo thời gian thực</CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-indigo-600" />
                    <span>JoyON Price</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Min Competitor</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 px-6">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistoryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={formatYAxis}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '16px',
                        border: 'none',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        padding: '12px'
                      }}
                      formatter={(value: number) => [formatCurrency(value), ""]}
                    />
                    <Line
                      type="monotone"
                      dataKey="yourPrice"
                      stroke="#4f46e5"
                      strokeWidth={5}
                      name="Giá của bạn"
                      dot={{ r: 6, fill: "#4f46e5", strokeWidth: 3, stroke: "#fff" }}
                      activeDot={{ r: 10, strokeWidth: 0, fill: '#4f46e5' }}
                      animationDuration={1500}
                    />
                    <Line
                      type="monotone"
                      dataKey="minCompetitor"
                      stroke="#10b981"
                      strokeWidth={3}
                      name="Giá thấp nhất đối thủ"
                      dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6 }}
                      animationDuration={2000}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgCompetitor"
                      stroke="#cbd5e1"
                      strokeWidth={2}
                      name="Giá TB đối thủ"
                      dot={false}
                      strokeDasharray="8 8"
                      animationDuration={2500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Competitor Comparison */}
          <Card className="shadow-xl border-none overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/30 border-b border-gray-100 px-6 py-4">
              <CardTitle className="text-lg font-display">Phân tích giá đối thủ</CardTitle>
              <CardDescription>So sánh giá hiện tại giữa các đối thủ trong danh sách theo dõi</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 px-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={competitorComparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value: number) => [formatCurrency(value), "Giá phòng"]}
                    />
                    <Bar dataKey="price" radius={[8, 8, 0, 0]} barSize={40}>
                      {competitorComparisonData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? "#4f46e5" : "#e2e8f0"}
                          className="hover:fill-indigo-400 transition-colors duration-300"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
