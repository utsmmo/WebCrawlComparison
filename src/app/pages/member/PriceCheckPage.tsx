import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  ArrowDown,
  ArrowUp,
  Zap,
  ArrowUpDown,
  Search,
  Hotel,
  Loader2,
  RefreshCw,
  Download,
  Building2,
  TrendingDown,
  TrendingUp,
  Coffee,
  Users,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReChartsTooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { APP_CONFIG, PRICE_TREND, API_CONFIG } from "@/app/constants/config";
import { formatCurrency } from "@/app/lib/utils";
import { crawlPrices, HotelReport, parsePrice, type CrawlSource } from "@/app/lib/api";

// ============================================================================
// Types
// ============================================================================

interface ProcessedHotel {
  hotelId: string;
  hotelName: string;
  status: string;
  priceOTA: number;
  priceCS: number;
  priceReception: number;
  roomType?: string;
  breakfast?: string;
  roomsLeft?: string;
  difference: number;
  differencePercent: number;
  trend: string;
  isMyHotel: boolean;
  crawledAt: string;
}

type SortField = 'name' | 'priceOTA' | 'priceCS' | 'difference';
type SortOrder = 'asc' | 'desc';

// ============================================================================
// Component
// ============================================================================

export function PriceCheckPage() {
  // State
  const [selectedRegion, setSelectedRegion] = useState<string>("myhotel");
  const [checkInDate, setCheckInDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    return dayAfter.toISOString().split('T')[0];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [hotelData, setHotelData] = useState<HotelReport[]>([]);
  const [sortField, setSortField] = useState<SortField>('priceOTA');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [crawlProgress, setCrawlProgress] = useState(0);

  // Reference price (My Hotel if found in results, else first hotel)
  const referencePrice = useMemo(() => {
    // Get my hotels from storage
    const storedCompetitorsRaw = localStorage.getItem("joyon_competitors");
    const myHotelsList: string[] = [];
    if (storedCompetitorsRaw) {
      try {
        const comps = JSON.parse(storedCompetitorsRaw);
        comps.forEach((c: any) => {
          if (c.isMyHotel) myHotelsList.push(c.hotelId);
        });
      } catch (e) {
        console.error("Failed to parse competitors for naming", e);
      }
    }

    const myHotelInResults = hotelData.find(h => myHotelsList.includes(h.hotelId) && h.status === 'ok');
    if (myHotelInResults) return parsePrice(myHotelInResults.priceOTA);

    const firstOk = hotelData.find(h => h.status === 'ok');
    return firstOk ? parsePrice(firstOk.priceOTA) : APP_CONFIG.DEFAULT_TARGET_PRICE;
  }, [hotelData]);

  // Process hotel data with calculations
  const processedHotels = useMemo((): ProcessedHotel[] => {
    // Get my hotels from storage
    const storedCompetitorsRaw = localStorage.getItem("joyon_competitors");
    const myHotelsList: string[] = [];
    if (storedCompetitorsRaw) {
      try {
        const comps = JSON.parse(storedCompetitorsRaw);
        comps.forEach((c: any) => {
          if (c.isMyHotel) myHotelsList.push(c.hotelId);
        });
      } catch (e) {
        console.error("Failed to parse competitors for pricing", e);
      }
    }


    return hotelData.map((hotel) => {
      const priceOTA = parsePrice(hotel.priceOTA);
      const priceCS = parsePrice(hotel.priceCS);
      const priceReception = parsePrice(hotel.priceReception);
      const isMyHotel = myHotelsList.includes(hotel.hotelId);

      const difference = referencePrice > 0 ? priceOTA - referencePrice : 0;
      const differencePercent = referencePrice > 0 ? (difference / referencePrice) * 100 : 0;

      return {
        hotelId: hotel.hotelId,
        hotelName: hotel.hotelName || hotel.hotelId,
        status: hotel.status,
        priceOTA,
        priceCS,
        priceReception,
        roomType: hotel.roomType,
        breakfast: hotel.breakfast,
        roomsLeft: hotel.roomsLeft,
        difference,
        differencePercent,
        trend: difference > 0 ? PRICE_TREND.UP : difference < 0 ? PRICE_TREND.DOWN : PRICE_TREND.STABLE,
        isMyHotel,
        crawledAt: new Date().toLocaleTimeString(APP_CONFIG.LOCALE),
      };
    });
  }, [hotelData]);

  // Sorted hotels
  const sortedHotels = useMemo(() => {
    return [...processedHotels].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case 'name':
          aVal = a.hotelName;
          bVal = b.hotelName;
          break;
        case 'priceOTA':
          aVal = a.priceOTA;
          bVal = b.priceOTA;
          break;
        case 'priceCS':
          aVal = a.priceCS;
          bVal = b.priceCS;
          break;
        case 'difference':
          aVal = a.differencePercent;
          bVal = b.differencePercent;
          break;
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal;
    });
  }, [processedHotels, sortField, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const okHotels = processedHotels.filter(h => h.status === 'ok');
    const prices = okHotels.map(h => h.priceOTA).filter(p => p > 0);

    return {
      total: processedHotels.length,
      ok: okHotels.length,
      soldOut: processedHotels.filter(h => h.status === 'sold_out').length,
      error: processedHotels.filter(h => h.status === 'error').length,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      cheaperCount: okHotels.filter(h => h.priceOTA < referencePrice).length,
    };
  }, [processedHotels, referencePrice]);

  // Chart data
  const chartData = useMemo(() => {
    return sortedHotels
      .filter(h => h.status === 'ok' && h.priceOTA > 0)
      .slice(0, 12) // Limit for readability
      .map(h => ({
        name: h.hotelName.length > 15 ? h.hotelName.substring(0, 15) + '...' : h.hotelName,
        fullName: h.hotelName,
        priceOTA: h.priceOTA,
        priceCS: h.priceCS,
        isMyHotel: h.isMyHotel,
      }));
  }, [sortedHotels]);

  // Handle crawl
  const handleCrawl = useCallback(async () => {
    setIsLoading(true);
    setCrawlProgress(0);
    toast.info("🔍 Đang crawl giá từ Booking.com...", { duration: 2000 });

    // Simulate progress
    const progressInterval = setInterval(() => {
      setCrawlProgress(prev => Math.min(prev + 10, 90));
    }, 300);

    try {
      const data = await crawlPrices(selectedRegion as CrawlSource, {
        checkin: checkInDate,
        checkout: checkOutDate,
      });

      setCrawlProgress(100);
      setHotelData(data);
      setHasChecked(true);

      const okCount = data.filter(h => h.status === 'ok').length;
      toast.success(`✅ Đã cập nhật giá ${okCount}/${data.length} khách sạn!`);
    } catch (error) {
      console.error("Crawl failed:", error);
      toast.error("❌ Lỗi khi crawl giá. Vui lòng thử lại.");
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
      setTimeout(() => setCrawlProgress(0), 500);
    }
  }, [selectedRegion, checkInDate, checkOutDate]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle export
  const handleExport = () => {
    if (processedHotels.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    // Create CSV content
    const headers = ['Khách sạn', 'Giá OTA', 'Giá CS', 'Giá Lễ Tân', 'Loại phòng', 'Ăn sáng', 'Còn phòng', 'Chênh lệch %'];
    const rows = processedHotels.map(h => [
      h.hotelName,
      h.priceOTA,
      h.priceCS,
      h.priceReception,
      h.roomType || '',
      h.breakfast || '',
      h.roomsLeft || '',
      h.differencePercent.toFixed(1) + '%',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price-report-${checkInDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("📊 Đã xuất báo cáo Excel!");
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Có phòng</Badge>;
      case 'sold_out':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Hết phòng</Badge>;
      case 'error':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Lỗi</Badge>;
      default:
        return <Badge variant="secondary">N/A</Badge>;
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-display">
              Kiểm tra giá đối thủ
            </h1>
            <p className="text-gray-500 mt-1">
              So sánh giá khách sạn với đối thủ cạnh tranh theo thời gian thực
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">API Online</span>
            </div>
          </div>
        </motion.div>

        {/* Filter Card - Glassmorphism */}
        <Card className="sticky top-20 z-10 backdrop-blur-xl bg-white/80 border-white/50 shadow-xl shadow-indigo-100/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="font-display">Bộ lọc tìm kiếm</CardTitle>
                <CardDescription>Chọn vùng và ngày để crawl giá</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Vùng / Nhóm
                </Label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="rounded-xl border-gray-100 bg-white/50 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {API_CONFIG.REGIONS.map((region) => (
                      <SelectItem key={region.slug} value={region.slug}>
                        <span className="flex items-center gap-2">
                          {region.slug === 'myhotel' && <Hotel className="w-4 h-4 text-indigo-500" />}
                          {region.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Ngày Check-in
                </Label>
                <Input
                  type="date"
                  className="rounded-xl border-gray-100 bg-white/50 h-11"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Ngày Check-out
                </Label>
                <Input
                  type="date"
                  className="rounded-xl border-gray-100 bg-white/50 h-11"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  &nbsp;
                </Label>
                <Button
                  className="w-full gap-2 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                  onClick={handleCrawl}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang crawl...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Crawl giá ngay
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <AnimatePresence>
              {crawlProgress > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <Progress value={crawlProgress} className="h-2" />
                  <p className="text-xs text-center text-gray-400 mt-1">
                    Đang crawl... {crawlProgress}%
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Actions */}
            {hasChecked && (
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2"
                  onClick={handleCrawl}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2"
                  onClick={handleExport}
                >
                  <Download className="w-4 h-4" />
                  Xuất CSV
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <AnimatePresence>
          {hasChecked && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                {
                  label: "Tổng khách sạn",
                  value: stats.total,
                  icon: Building2,
                  color: "indigo",
                  gradient: "from-indigo-500 to-purple-500",
                },
                {
                  label: "Giá thấp nhất",
                  value: formatCurrency(stats.minPrice),
                  icon: TrendingDown,
                  color: "emerald",
                  gradient: "from-emerald-500 to-teal-500",
                },
                {
                  label: "Giá cao nhất",
                  value: formatCurrency(stats.maxPrice),
                  icon: TrendingUp,
                  color: "rose",
                  gradient: "from-rose-500 to-pink-500",
                },
                {
                  label: "Rẻ hơn bạn",
                  value: `${stats.cheaperCount}/${stats.ok}`,
                  icon: ArrowDown,
                  color: "amber",
                  gradient: "from-amber-500 to-orange-500",
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                    <div className={`h-1 w-full bg-gradient-to-r ${stat.gradient}`} />
                    <CardContent className="pt-4 pb-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            {stat.label}
                          </p>
                          <p className={`text-2xl font-bold mt-1 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                            {stat.value}
                          </p>
                        </div>
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.gradient} opacity-90 group-hover:scale-110 transition-transform`}>
                          <stat.icon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chart */}
        <AnimatePresence>
          {hasChecked && chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-display">Biểu đồ so sánh giá</CardTitle>
                      <CardDescription>
                        Giá OTA (xanh) vs Giá CS (tím) • Đường tham chiếu là giá khách sạn đầu tiên
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-indigo-500" />
                        <span className="font-medium text-gray-600">Giá OTA</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-purple-400" />
                        <span className="font-medium text-gray-600">Giá CS</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 pb-4">
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <defs>
                          <linearGradient id="colorOTA" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                            <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8} />
                          </linearGradient>
                          <linearGradient id="colorCS" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#c084fc" stopOpacity={0.6} />
                          </linearGradient>
                          <linearGradient id="colorMyHotel" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                            <stop offset="100%" stopColor="#34d399" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="name"
                          angle={-35}
                          textAnchor="end"
                          interval={0}
                          height={80}
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                          width={50}
                        />
                        <ReChartsTooltip
                          cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                            padding: '12px 16px',
                          }}
                          formatter={(value: number, name: string) => [
                            formatCurrency(value),
                            name === 'priceOTA' ? 'Giá OTA' : 'Giá CS'
                          ]}
                          labelFormatter={(label) => {
                            const item = chartData.find(d => d.name === label);
                            return item?.fullName || label;
                          }}
                        />
                        <ReferenceLine y={referencePrice} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Giá tham chiếu', fill: '#f59e0b', fontSize: 10 }} />
                        <Bar dataKey="priceOTA" radius={[6, 6, 0, 0]} barSize={30}>
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-ota-${index}`}
                              fill={entry.isMyHotel ? "url(#colorMyHotel)" : "url(#colorOTA)"}
                            />
                          ))}
                        </Bar>
                        <Bar dataKey="priceCS" radius={[6, 6, 0, 0]} barSize={30} fill="url(#colorCS)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data Table */}
        <AnimatePresence>
          {hasChecked && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-display">Chi tiết giá khách sạn</CardTitle>
                    <CardDescription>
                      Cập nhật lúc {new Date().toLocaleTimeString(APP_CONFIG.LOCALE)} • {stats.ok} có phòng, {stats.soldOut} hết phòng
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    // Loading skeleton
                    <div className="p-6 space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="pl-6 w-[250px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 -ml-3 font-bold text-xs uppercase tracking-wider text-gray-600"
                              onClick={() => handleSort('name')}
                            >
                              Khách sạn
                              <ArrowUpDown className="w-3 h-3" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 -ml-3 font-bold text-xs uppercase tracking-wider text-gray-600"
                              onClick={() => handleSort('priceOTA')}
                            >
                              Giá OTA
                              <ArrowUpDown className="w-3 h-3" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 -ml-3 font-bold text-xs uppercase tracking-wider text-gray-600"
                              onClick={() => handleSort('priceCS')}
                            >
                              Giá CS
                              <ArrowUpDown className="w-3 h-3" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Loại phòng
                          </TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Chi tiết
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 -ml-3 font-bold text-xs uppercase tracking-wider text-gray-600"
                              onClick={() => handleSort('difference')}
                            >
                              Chênh lệch
                              <ArrowUpDown className="w-3 h-3" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-gray-400">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedHotels.map((hotel) => (
                          <TableRow
                            key={hotel.hotelId}
                            className={`
                              group transition-colors
                              ${hotel.isMyHotel
                                ? 'bg-gradient-to-r from-emerald-50/50 to-teal-50/50 hover:from-emerald-50 hover:to-teal-50'
                                : 'hover:bg-gray-50/80'}
                            `}
                          >
                            <TableCell className="pl-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`
                                  p-2 rounded-xl shadow-sm border
                                  ${hotel.isMyHotel
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-emerald-400'
                                    : 'bg-white border-gray-100 text-gray-400 group-hover:text-indigo-500'}
                                `}>
                                  <Hotel className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className={`font-semibold ${hotel.isMyHotel ? 'text-emerald-700' : 'text-gray-800'}`}>
                                    {hotel.hotelName}
                                    {hotel.isMyHotel && (
                                      <Badge className="ml-2 bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                                        CỦA TÔI
                                      </Badge>
                                    )}
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-medium">
                                    ID: {hotel.hotelId}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {hotel.status === 'ok' ? (
                                <span className="font-bold text-lg text-indigo-600">
                                  {formatCurrency(hotel.priceOTA)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {hotel.status === 'ok' && hotel.priceCS > 0 ? (
                                <span className="font-semibold text-purple-600">
                                  {formatCurrency(hotel.priceCS)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {hotel.roomType ? (
                                <span className="text-sm text-gray-600">{hotel.roomType}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                {hotel.breakfast && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg">
                                        <Coffee className="w-3 h-3" />
                                        <span>Sáng</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>{hotel.breakfast}</TooltipContent>
                                  </Tooltip>
                                )}
                                {hotel.roomsLeft && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg">
                                        <Users className="w-3 h-3" />
                                        <span>{hotel.roomsLeft}</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Còn {hotel.roomsLeft} phòng</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {hotel.isMyHotel ? (
                                <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-white font-bold text-[10px]">
                                  GỐC
                                </Badge>
                              ) : hotel.status === 'ok' ? (
                                <div className="flex items-center gap-2">
                                  <div className={`p-1 rounded-full ${hotel.difference < 0 ? 'bg-emerald-100' : hotel.difference > 0 ? 'bg-rose-100' : 'bg-gray-100'}`}>
                                    {hotel.difference < 0 ? (
                                      <ArrowDown className="w-3 h-3 text-emerald-600" />
                                    ) : hotel.difference > 0 ? (
                                      <ArrowUp className="w-3 h-3 text-rose-600" />
                                    ) : (
                                      <Minus className="w-3 h-3 text-gray-500" />
                                    )}
                                  </div>
                                  <span className={`font-bold text-sm ${hotel.difference < 0 ? 'text-emerald-600' : hotel.difference > 0 ? 'text-rose-600' : 'text-gray-500'}`}>
                                    {hotel.differencePercent > 0 ? '+' : ''}{hotel.differencePercent.toFixed(1)}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(hotel.status)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!hasChecked && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 mb-6">
              <Search className="w-12 h-12 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Bắt đầu crawl giá</h3>
            <p className="text-gray-500 max-w-md">
              Chọn vùng, ngày check-in/out và bấm "Crawl giá ngay" để xem giá đối thủ cạnh tranh.
            </p>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
}