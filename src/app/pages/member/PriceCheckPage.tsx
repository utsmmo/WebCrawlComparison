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
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
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
  originalPrice: number;
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

type SortField = 'name' | 'originalPrice' | 'difference';
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
  const [sortField, setSortField] = useState<SortField>('originalPrice');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [crawlProgress, setCrawlProgress] = useState(0);
  const [adults, setAdults] = useState<string>("2");
  const [guestFilter, setGuestFilter] = useState<string>("all");

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
    if (myHotelInResults) return parsePrice(myHotelInResults.originalPrice);

    const firstOk = hotelData.find(h => h.status === 'ok');
    return firstOk ? parsePrice(firstOk.originalPrice) : APP_CONFIG.DEFAULT_TARGET_PRICE;
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


    const result: ProcessedHotel[] = [];

    hotelData.forEach((hotel) => {
      const priceOTA = parsePrice(hotel.priceOTA);
      const originalPrice = parsePrice(hotel.originalPrice);
      const priceCS = parsePrice(hotel.priceCS);
      const priceReception = parsePrice(hotel.priceReception);
      const isMyHotel = myHotelsList.includes(hotel.hotelId);

      // Compare using Original Price
      const difference = referencePrice > 0 ? originalPrice - referencePrice : 0;
      const differencePercent = referencePrice > 0 ? (difference / referencePrice) * 100 : 0;

      // Extract guest count from roomType or use current adults state if known
      // Assuming the API returns roomType with guest info or we track it per response
      // For now, we'll use the "adults" state as a label if it wasn't "all"

      result.push({
        hotelId: hotel.hotelId,
        hotelName: hotel.hotelName || hotel.hotelId,
        status: hotel.status,
        priceOTA,
        originalPrice,
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
      });
    });

    return result;
  }, [hotelData]); // Removed referencePrice dependency since it is used inside logic but logically memoization depends on data + ref

  // Sorted hotels
  const sortedHotels = useMemo(() => {
    return [...processedHotels]
      .filter(h => {
        if (guestFilter === 'all') return true;
        const roomDesc = h.roomType || '';
        if (guestFilter === '2') return roomDesc.includes('(2 khách)');
        if (guestFilter === '4') return roomDesc.includes('(4 khách)');
        return true;
      })
      .sort((a, b) => {
        let aVal: number | string = 0;
        let bVal: number | string = 0;

        switch (sortField) {
          case 'name':
            aVal = a.hotelName;
            bVal = b.hotelName;
            break;
          case 'originalPrice':
            aVal = a.originalPrice;
            bVal = b.originalPrice;
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
  }, [processedHotels, sortField, sortOrder, guestFilter]);

  // Statistics
  const stats = useMemo(() => {
    const okHotels = processedHotels.filter(h => h.status === 'ok');
    const prices = okHotels.map(h => h.originalPrice).filter(p => p > 0);

    return {
      total: processedHotels.length,
      ok: okHotels.length,
      soldOut: processedHotels.filter(h => h.status === 'sold_out').length,
      error: processedHotels.filter(h => h.status === 'error').length,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      cheaperCount: okHotels.filter(h => h.originalPrice < referencePrice).length,
    };
  }, [processedHotels, referencePrice]);


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
      let finalData: HotelReport[] = [];

      // For "My Hotel" legacy endpoint, we might still want the split logic if it supports specific adult filtering
      // But for new Competitor API (Regions), it always returns the "lowest of all"
      // So we can assume efficient single call for regions.

      const isLegacySource = selectedRegion === 'myhotel' || selectedRegion === 'myhotel-today';

      if (isLegacySource && adults === "all") {
        // Run two crawls for both 2 and 4 adults (Legacy behavior)
        const [data2, data4] = await Promise.all([
          crawlPrices(selectedRegion as CrawlSource, { checkin: checkInDate, checkout: checkOutDate, adults: "2" }),
          crawlPrices(selectedRegion as CrawlSource, { checkin: checkInDate, checkout: checkOutDate, adults: "4" })
        ]);

        // Merge data, tagging them
        finalData = [
          ...data2.map(h => ({ ...h, roomType: h.roomType ? `(2 khách) ${h.roomType}` : '(2 khách)' })),
          ...data4.map(h => ({ ...h, roomType: h.roomType ? `(4 khách) ${h.roomType}` : '(4 khách)' }))
        ];
      } else {
        // Single call for specific adults OR for new Competitor API (which handles 'all' internally)
        finalData = await crawlPrices(selectedRegion as CrawlSource, {
          checkin: checkInDate,
          checkout: checkOutDate,
          adults: adults,
        });
      }

      setCrawlProgress(100);
      setHotelData(finalData);
      setHasChecked(true);

      const okCount = finalData.filter(h => h.status === 'ok').length;
      toast.success(`✅ Đã cập nhật giá ${okCount}/${finalData.length} loại phòng!`);
    } catch (error) {
      console.error("Crawl failed:", error);
      toast.error("❌ Lỗi khi crawl giá. Vui lòng thử lại.");
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
      setTimeout(() => setCrawlProgress(0), 500);
    }
  }, [selectedRegion, checkInDate, checkOutDate, adults]);

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
    const headers = ['Khách sạn', 'Giá gốc', 'Giá OTA', 'Giá Lễ Tân', 'Loại phòng', 'Ăn sáng', 'Còn phòng', 'Chênh lệch %'];
    const rows = processedHotels.map(h => [
      h.hotelName,
      h.originalPrice,
      h.priceOTA,
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
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Kiểm tra giá đối thủ
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            So sánh giá khách sạn với đối thủ cạnh tranh theo thời gian thực (Giá gốc)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">System Online</span>
          </div>
        </div>
      </motion.div>

      {/* Filter Card - Glassmorphism */}
      <Card className="sticky top-16 z-10 bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary shadow-sm">
              <Search className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Bộ lọc tìm kiếm</CardTitle>
              <CardDescription>Chọn vùng và ngày để crawl giá</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                Người lớn
              </Label>
              <Select value={adults} onValueChange={setAdults}>
                <SelectTrigger className="rounded-xl border-gray-100 bg-white/50 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Người lớn</SelectItem>
                  <SelectItem value="4">4 Người lớn</SelectItem>
                  <SelectItem value="all">Tất cả</SelectItem>
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
                className="w-full gap-2 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold shadow-sm"
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
                <Card className="overflow-hidden border border-border shadow-sm hover:shadow-md transition-all group">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          {stat.label}
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {stat.value}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <stat.icon className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
            <Card className="border-none shadow-xl bg-white overflow-hidden flex flex-col">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b px-4 py-4 md:px-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-lg md:text-xl">Chi tiết giá khách sạn</CardTitle>
                    {stats.ok > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {stats.ok} có phòng
                      </span>
                    )}
                  </div>
                  <CardDescription className="flex items-center text-xs md:text-sm">
                    <span className="mr-1">Cập nhật lúc:</span>
                    <span className="font-bold text-foreground">{new Date().toLocaleTimeString(APP_CONFIG.LOCALE)}</span>
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden relative">
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
                  <div className="overflow-x-auto">
                    {/* Desktop View: Table */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader className="bg-gray-50/50">
                          <TableRow className="hover:bg-transparent border-b border-gray-100">
                            <TableHead className="pl-6 w-[250px]">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 -ml-3 font-bold text-xs uppercase tracking-wider text-gray-600 hover:bg-transparent hover:text-gray-900"
                                onClick={() => handleSort('name')}
                              >
                                Khách sạn
                                <ArrowUpDown className="w-3 h-3" />
                              </Button>
                            </TableHead>
                            <TableHead className="whitespace-nowrap min-w-[120px]">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 -ml-3 font-bold text-xs uppercase tracking-wider text-gray-600 hover:bg-transparent hover:text-gray-900"
                                onClick={() => handleSort('originalPrice')}
                              >
                                Giá gốc
                                <ArrowUpDown className="w-3 h-3" />
                              </Button>
                            </TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap min-w-[150px]">
                              Loại phòng
                            </TableHead>
                            <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap min-w-[100px]">
                              Phòng trống
                            </TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap min-w-[150px]">
                              Ăn sáng
                            </TableHead>
                            <TableHead className="w-[100px]">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 -ml-3 font-bold text-xs uppercase tracking-wider text-gray-600 hover:bg-transparent hover:text-gray-900"
                                onClick={() => handleSort('difference')}
                              >
                                Chênh lệch
                                <ArrowUpDown className="w-3 h-3" />
                              </Button>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedHotels.map((hotel, idx) => (
                            <TableRow key={`${hotel.hotelId}-${idx}`} className="group hover:bg-blue-50/30 transition-colors border-b border-gray-50 last:border-0">
                              <TableCell className="pl-6">
                                <div className="flex items-center gap-3">
                                  <div className={`
                                    w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm
                                    ${hotel.isMyHotel ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}
                                  `}>
                                    <Hotel className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className={`font-semibold text-sm truncate ${hotel.isMyHotel ? 'text-blue-700' : 'text-gray-900'}`}>
                                      {hotel.hotelName}
                                    </span>
                                    {hotel.isMyHotel && (
                                      <span className="text-[10px] font-medium text-blue-600 uppercase tracking-wider">
                                        CỦA TÔI
                                      </span>
                                    )}
                                    <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                      ID: {hotel.hotelId}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {hotel.status === 'ok' ? (
                                  <span className="text-base font-display">
                                    {formatCurrency(hotel.originalPrice)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-sm text-foreground/90 truncate max-w-[180px]" title={hotel.roomType}>
                                    {hotel.roomType || '---'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    2 người lớn
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {hotel.roomsLeft ? (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                                    ${hotel.roomsLeft === '0' || hotel.status === 'sold_out'
                                      ? 'bg-red-50 text-red-700 border-red-100'
                                      : Number(hotel.roomsLeft) <= 3
                                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'}
                                  `}>
                                    {hotel.roomsLeft}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  {(() => {
                                    if (!hotel.breakfast || hotel.breakfast.toLowerCase().includes('không') || hotel.breakfast.toLowerCase() === 'no') {
                                      return (
                                        <div className="flex items-center gap-1 opacity-70">
                                          <Coffee className="w-3 h-3" />
                                          <span>Không</span>
                                        </div>
                                      );
                                    }
                                    const isIncluded = hotel.breakfast.toLowerCase().includes('bao gồm') ||
                                      hotel.breakfast.toLowerCase().includes('included') ||
                                      hotel.breakfast.toLowerCase() === 'yes';

                                    if (isIncluded) {
                                      return (
                                        <div className="flex items-center gap-1 text-emerald-600 font-medium">
                                          <Coffee className="w-3 h-3" />
                                          <span>Có ăn sáng</span>
                                        </div>
                                      );
                                    }
                                    return (
                                      <div className="flex items-center gap-1 text-amber-600">
                                        <Coffee className="w-3 h-3" />
                                        <span>+{hotel.breakfast}</span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </TableCell>
                              <TableCell>
                                {hotel.isMyHotel ? (
                                  <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-white font-bold text-[10px]">
                                    GỐC
                                  </Badge>
                                ) : hotel.status === 'ok' ? (
                                  <div className="flex items-center gap-2">
                                    {hotel.difference < 0 ? (
                                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-1.5 py-0.5 h-6">
                                        <ArrowDown className="w-3 h-3 mr-0.5" />
                                        {Math.abs(hotel.differencePercent).toFixed(0)}%
                                      </Badge>
                                    ) : hotel.difference > 0 ? (
                                      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none px-1.5 py-0.5 h-6">
                                        <ArrowUp className="w-3 h-3 mr-0.5" />
                                        {hotel.differencePercent.toFixed(0)}%
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="bg-gray-100 text-gray-500 px-1.5 py-0.5 h-6">
                                        <Minus className="w-3 h-3" /> 0%
                                      </Badge>
                                    )}
                                    <span className={`text-xs font-medium ${hotel.difference > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                      {hotel.difference > 0 ? '+' : ''}{formatCurrency(hotel.difference)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {sortedHotels.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                Không tìm thấy dữ liệu phù hợp
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile View: Vertical Cards */}
                    <div className="md:hidden">
                      {sortedHotels.map((hotel, idx) => (
                        <div key={`mobile-${hotel.hotelId}-${idx}`} className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                          {/* Header: Name & Status */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3">
                              <div className={`
                                w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                                ${hotel.isMyHotel ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}
                              `}>
                                <Hotel className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className={`font-bold text-sm leading-tight mb-1 ${hotel.isMyHotel ? 'text-blue-700' : 'text-gray-900'}`}>
                                  {hotel.hotelName}
                                </h3>
                                {hotel.isMyHotel && (
                                  <span className="inline-block text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                                    CỦA TÔI
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Status Badge */}
                            <div>
                              {hotel.isMyHotel ? (
                                <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-white font-bold text-[10px]">
                                  GỐC
                                </Badge>
                              ) : hotel.status === 'ok' ? (
                                hotel.difference < 0 ? (
                                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-2 py-1">
                                    <ArrowDown className="w-3 h-3 mr-1" />
                                    {Math.abs(hotel.differencePercent).toFixed(0)}%
                                  </Badge>
                                ) : hotel.difference > 0 ? (
                                  <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none px-2 py-1">
                                    <ArrowUp className="w-3 h-3 mr-1" />
                                    {hotel.differencePercent.toFixed(0)}%
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                                    0%
                                  </Badge>
                                )
                              ) : getStatusBadge(hotel.status)}
                            </div>
                          </div>

                          {/* Primary: Price */}
                          <div className="flex items-center justify-between mb-4 pl-[52px]">
                            {hotel.status === 'ok' ? (
                              <div>
                                <span className="text-xl font-display font-bold text-gray-900 block">
                                  {formatCurrency(hotel.originalPrice)}
                                </span>
                                {!hotel.isMyHotel && (
                                  <span className={`text-xs font-medium ${hotel.difference > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {hotel.difference > 0 ? '+' : ''}{formatCurrency(hotel.difference)} so với bạn
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Không có dữ liệu giá</span>
                            )}
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-3 pl-[52px] text-xs">
                            <div className="bg-gray-50 p-2 rounded-lg">
                              <span className="text-gray-400 block mb-1">Loại phòng</span>
                              <span className="font-medium text-gray-700 line-clamp-2" title={hotel.roomType}>
                                {hotel.roomType || '---'}
                              </span>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg space-y-2">
                              {/* Breakfast */}
                              <div className="flex items-center gap-2">
                                {(() => {
                                  if (!hotel.breakfast || hotel.breakfast.toLowerCase().includes('không') || hotel.breakfast.toLowerCase() === 'no') {
                                    return <><Coffee className="w-3 h-3 text-gray-400" /><span className="text-gray-500">Không ăn sáng</span></>;
                                  }
                                  const isIncluded = hotel.breakfast.toLowerCase().includes('bao gồm') ||
                                    hotel.breakfast.toLowerCase().includes('included') ||
                                    hotel.breakfast.toLowerCase() === 'yes';
                                  if (isIncluded) {
                                    return <><Coffee className="w-3 h-3 text-emerald-500" /><span className="text-emerald-700 font-medium">Có ăn sáng</span></>;
                                  }
                                  return <><Coffee className="w-3 h-3 text-amber-500" /><span className="text-amber-700">+{hotel.breakfast}</span></>;
                                })()}
                              </div>
                              {/* Rooms Left */}
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${Number(hotel.roomsLeft) > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className={Number(hotel.roomsLeft) > 0 ? 'text-green-700 font-medium' : 'text-red-600'}>
                                  {Number(hotel.roomsLeft) > 0 ? `Còn ${hotel.roomsLeft} phòng` : 'Hết phòng'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {sortedHotels.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                          Không tìm thấy dữ liệu phù hợp
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence >
    </div >
  );
}