import { useState, useMemo, useEffect } from "react";
import { getCompetitorPrices, saveCompetitorConfig, CompetitorConfigPayload } from "@/app/lib/api";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Badge } from "@/app/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Filter, Globe, MapPin, Hotel, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";


// ============================================================================
// Types
// ============================================================================

export interface Competitor {
  id: string;
  hotelId: string;  // ID dùng để crawl (booking.com slug)
  name: string;     // Tên hiển thị
  groupId: string;  // Nhóm/Region
  isMyHotel: boolean; // Đánh dấu đây là khách sạn của mình
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  location: string;
}

// ============================================================================
// Storage
// ============================================================================

const COMPETITORS_KEY = "joyon_competitors";
const GROUPS_KEY = "joyon_groups";

// Default groups
const DEFAULT_GROUPS: Group[] = [
  { id: "hoi-an", name: "Hội An", location: "Hội An, Quảng Nam" },
  { id: "hoi-an-5-6", name: "Hội An 5,6", location: "Hội An, Quảng Nam" },
  { id: "da-nang", name: "Đà Nẵng", location: "Đà Nẵng" },
  { id: "da-lat", name: "Đà Lạt", location: "Đà Lạt, Lâm Đồng" },
  { id: "nha-trang", name: "Nha Trang", location: "Nha Trang, Khánh Hòa" },
  { id: "phu-quoc", name: "Phú Quốc", location: "Phú Quốc, Kiên Giang" },
];

// Default competitors (sample data)
const DEFAULT_COMPETITORS: Competitor[] = [
  // Old Data
  { id: "1", hotelId: "beach-front-thanh-pho-hoi-an", name: "Beachfront Hotel Hoi An", groupId: "hoi-an", isMyHotel: false, createdAt: "2026-01-01" },
  { id: "2", hotelId: "la-alba-villa", name: "La ALBA Beach Villa", groupId: "hoi-an", isMyHotel: false, createdAt: "2026-01-01" },
  { id: "3", hotelId: "thien-thanh", name: "Old Town Hotel", groupId: "hoi-an", isMyHotel: true, createdAt: "2026-01-01" },
  { id: "4", hotelId: "raon-danang-beach-danang", name: "Raon Danang Beach", groupId: "da-nang", isMyHotel: true, createdAt: "2026-01-01" },
  { id: "5", hotelId: "sala-danang-beach", name: "Sala Danang Beach Hotel", groupId: "da-nang", isMyHotel: false, createdAt: "2026-01-01" },

  // Hội An 5,6 Batch
  { id: "101", hotelId: "golf-hoi-an", name: "ÊMM Hotel Hoi An", groupId: "hoi-an-5-6", isMyHotel: false, createdAt: "2026-02-03" },
  { id: "102", hotelId: "dubai-villa-hoi-an", name: "Ancient Haven - Central Boutique Hotel", groupId: "hoi-an-5-6", isMyHotel: false, createdAt: "2026-02-03" },
  { id: "103", hotelId: "royal-riverside-hoian", name: "Royal Riverside Hoi An Hotel & Spa", groupId: "hoi-an-5-6", isMyHotel: false, createdAt: "2026-02-03" },
  { id: "104", hotelId: "central-boutique-villa", name: "Central Boutique Villa , in old Town", groupId: "hoi-an-5-6", isMyHotel: false, createdAt: "2026-02-03" },
  { id: "105", hotelId: "little-hoi-an-boutique-resort-spa", name: "Little Hoi An . A Boutique Hotel & Spa", groupId: "hoi-an-5-6", isMyHotel: false, createdAt: "2026-02-03" },
  { id: "106", hotelId: "aman-boutique", name: "DE VIVRE HOI AN - Aman Boutique Hotel", groupId: "hoi-an-5-6", isMyHotel: false, createdAt: "2026-02-03" },
  { id: "107", hotelId: "thuy-duong-3-boutique-amp-spa", name: "ANNAM HERITAGE Boutique Hotel & Spa", groupId: "hoi-an-5-6", isMyHotel: false, createdAt: "2026-02-03" },
  { id: "108", hotelId: "hoi-an-silk-boutique-and-spa", name: "Silkotel Hoi An", groupId: "hoi-an-5-6", isMyHotel: false, createdAt: "2026-02-03" },
  { id: "109", hotelId: "yzistel-hoi-an", name: "Yzistel Hoi An", groupId: "hoi-an-5-6", isMyHotel: false, createdAt: "2026-02-03" },
  { id: "110", hotelId: "hoianan", name: "Hoianan Boutique Hotel", groupId: "hoi-an-5-6", isMyHotel: false, createdAt: "2026-02-03" },
  { id: "111", hotelId: "thanh-binh-riverside", name: "Thanh Binh Riverside Hoi An", groupId: "hoi-an-5-6", isMyHotel: false, createdAt: "2026-02-03" },
  { id: "112", hotelId: "river-suites-hoi-an", name: "River Suites Hoi An", groupId: "hoi-an-5-6", isMyHotel: false, createdAt: "2026-02-03" },
  { id: "113", hotelId: "silk-eco-hotel-hoi-an", name: "Mulberry Collection Silk Eco", groupId: "hoi-an-5-6", isMyHotel: false, createdAt: "2026-02-03" },
  { id: "114", hotelId: "lion-king-thanh-pho-hoi-an", name: "Lion King Hotel", groupId: "hoi-an-5-6", isMyHotel: false, createdAt: "2026-02-03" },
  { id: "115", hotelId: "la-charm-hoi-an-amp-spa", name: "La Charm Hoi An Hotel & Spa", groupId: "hoi-an-5-6", isMyHotel: false, createdAt: "2026-02-03" },
  { id: "116", hotelId: "thien-thanh", name: "Old Town Hotel", groupId: "hoi-an-5-6", isMyHotel: false, createdAt: "2026-02-03" },
  { id: "117", hotelId: "thien-trung-hoi-an", name: "Sala Hoi An Hotel", groupId: "hoi-an-5-6", isMyHotel: false, createdAt: "2026-02-03" },
];

function loadCompetitors(): Competitor[] {
  try {
    const data = localStorage.getItem(COMPETITORS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load competitors:", e);
  }
  // Initialize with defaults
  localStorage.setItem(COMPETITORS_KEY, JSON.stringify(DEFAULT_COMPETITORS));
  return DEFAULT_COMPETITORS;
}

function saveCompetitors(competitors: Competitor[]) {
  localStorage.setItem(COMPETITORS_KEY, JSON.stringify(competitors));
  window.dispatchEvent(new Event('local-storage-update'));
}

function loadGroups(): Group[] {
  try {
    const data = localStorage.getItem(GROUPS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load groups:", e);
  }
  localStorage.setItem(GROUPS_KEY, JSON.stringify(DEFAULT_GROUPS));
  return DEFAULT_GROUPS;
}

// ============================================================================
// Component
// ============================================================================

export function CompetitorManagement() {
  // Data state
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Competitor | null>(null);

  // Form state
  const [hotelId, setHotelId] = useState("");
  const [competitorName, setCompetitorName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [isMyHotel, setIsMyHotel] = useState(false);

  // Filter state
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Load data on mount
  useEffect(() => {
    setCompetitors(loadCompetitors());
    setGroups(loadGroups());
  }, []);

  // Helper to auto-save to server
  const autoSaveConfig = async (currentCompetitors: Competitor[], currentGroups: Group[]) => {
    try {
      setIsSaving(true);
      // Transform local state to API payload
      const payload: CompetitorConfigPayload[] = currentGroups.map(group => {
        const groupCompetitors = currentCompetitors.filter(c => c.groupId === group.id);

        return {
          Id: group.id,
          Group: group.name,
          MyHotels: groupCompetitors
            .filter(c => c.isMyHotel)
            .map(c => ({ Id: c.hotelId, Name: c.name })),
          Competitors: groupCompetitors
            .filter(c => !c.isMyHotel)
            .map(c => ({ Id: c.hotelId, Name: c.name }))
        };
      });

      await saveCompetitorConfig(payload);
      toast.success("Đã đồng bộ cấu hình lên server!");
    } catch (error) {
      console.error("Auto-save failed:", error);
      toast.error("Lỗi đồng bộ server: " + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setHotelId("");
    setCompetitorName("");
    setSelectedGroup("");
    setIsMyHotel(false);
    setEditingCompetitor(null);
  };

  // Open dialog for adding
  const handleOpenAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for editing
  const handleOpenEdit = (competitor: Competitor) => {
    setEditingCompetitor(competitor);
    setHotelId(competitor.hotelId);
    setCompetitorName(competitor.name);
    setSelectedGroup(competitor.groupId);
    setIsMyHotel(competitor.isMyHotel);
    setIsDialogOpen(true);
  };

  // Handle form submit (add or edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hotelId.trim() || !competitorName.trim() || !selectedGroup) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    // Check for duplicate hotelId
    const trimmedHotelId = hotelId.trim();
    const duplicateExists = competitors.some(c =>
      c.hotelId === trimmedHotelId &&
      c.groupId === selectedGroup &&
      (!editingCompetitor || c.id !== editingCompetitor.id)
    );

    if (duplicateExists) {
      toast.error(`Hotel ID "${trimmedHotelId}" đã tồn tại trong nhóm này!`);
      return;
    }

    if (editingCompetitor) {
      // Update existing
      const updated = competitors.map(c =>
        c.id === editingCompetitor.id
          ? { ...c, hotelId: trimmedHotelId, name: competitorName.trim(), groupId: selectedGroup, isMyHotel }
          : c
      );
      setCompetitors(updated);
      saveCompetitors(updated);
      autoSaveConfig(updated, groups); // Auto-save
      toast.success(`Đã cập nhật "${competitorName}"!`);
    } else {
      // Add new
      const newCompetitor: Competitor = {
        id: Date.now().toString(),
        hotelId: trimmedHotelId,
        name: competitorName.trim(),
        groupId: selectedGroup,
        isMyHotel,
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updated = [...competitors, newCompetitor];
      setCompetitors(updated);
      saveCompetitors(updated);
      autoSaveConfig(updated, groups); // Auto-save
      toast.success(`Đã thêm "${competitorName}"!`);
    }

    resetForm();
    setIsDialogOpen(false);
  };

  // Handle delete
  const handleDelete = () => {
    if (!deleteTarget) return;

    const updated = competitors.filter(c => c.id !== deleteTarget.id);
    setCompetitors(updated);
    saveCompetitors(updated);
    autoSaveConfig(updated, groups); // Auto-save
    toast.success(`Đã xóa "${deleteTarget.name}"!`);
    setDeleteTarget(null);
  };

  // Filtered competitors
  const filteredCompetitors = useMemo(() => {
    return competitors.filter((c) => {
      const matchesGroup = filterGroup === "all" || c.groupId === filterGroup;
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.hotelId.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [competitors, filterGroup, searchTerm]);

  // Get group name by ID
  const getGroupName = (groupId: string) => {
    return groups.find(g => g.id === groupId)?.name || groupId;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">
            Quản lý đối thủ
          </h1>
          <p className="text-muted-foreground mt-1">Thêm, sửa, xóa các khách sạn đối thủ cần theo dõi giá</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl h-11 px-4"
            onClick={() => {
              if (confirm("Bạn có chắc muốn reset dữ liệu về mặc định? Dữ liệu hiện tại sẽ bị mất.")) {
                localStorage.setItem("joyon_competitors", JSON.stringify(DEFAULT_COMPETITORS));
                localStorage.setItem("joyon_groups", JSON.stringify(DEFAULT_GROUPS));
                window.dispatchEvent(new Event('local-storage-update'));
                window.location.reload();
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
            <span className="font-bold">Reset Mặc định</span>
          </Button>
          <Button
            className="gap-2 h-11 px-6 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
            onClick={handleOpenAdd}
          >
            <Plus className="w-4 h-4" />
            <span className="font-bold">Thêm đối thủ</span>
          </Button>
        </div>
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="rounded-3xl border-none shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display">
              {editingCompetitor ? "Sửa đối thủ" : "Thêm đối thủ mới"}
            </DialogTitle>
            <DialogDescription>
              {editingCompetitor ? "Cập nhật thông tin khách sạn" : "Nhập ID và tên khách sạn từ Booking.com"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                Hotel ID (Booking.com slug) *
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Ví dụ: raon-danang-beach-danang"
                  className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white"
                  value={hotelId}
                  onChange={(e) => setHotelId(e.target.value)}
                  required
                />
              </div>
              <p className="text-[10px] text-gray-400">
                Lấy từ URL: booking.com/hotel/vn/<strong>raon-danang-beach-danang</strong>.html
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                Tên hiển thị *
              </Label>
              <div className="relative">
                <Hotel className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Ví dụ: Raon Danang Beach Hotel"
                  className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white"
                  value={competitorName}
                  onChange={(e) => setCompetitorName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                Nhóm / Vùng *
              </Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup} required>
                <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-gray-100">
                  <SelectValue placeholder="Chọn nhóm..." />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <span className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {group.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is-my-hotel"
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={isMyHotel}
                onChange={(e) => setIsMyHotel(e.target.checked)}
              />
              <Label htmlFor="is-my-hotel" className="text-sm font-semibold text-gray-700 cursor-pointer">
                Đánh dấu là "Khách sạn của tôi"
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl h-11 px-6 font-bold"
                onClick={() => setIsDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 border-none rounded-xl h-11 px-8 shadow-sm transition-all"
                disabled={isSaving}
              >
                {isSaving ? "Đang lưu..." : (editingCompetitor ? "Cập nhật" : "Thêm mới")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa <strong>{deleteTarget?.name}</strong>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 rounded-xl"
              onClick={handleDelete}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Control Bar */}
      <Card className="border-none shadow-md overflow-hidden bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên hoặc hotel ID..."
                className="pl-10 h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                <Filter className="w-4 h-4 text-gray-400" />
                <Select value={filterGroup} onValueChange={setFilterGroup}>
                  <SelectTrigger className="border-none shadow-none bg-transparent h-7 w-36 p-0 text-sm font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả vùng</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="px-4 py-2 bg-indigo-50 rounded-xl flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  {filteredCompetitors.length} đối thủ
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitors Table */}
      <Card className="shadow-lg border-none overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50 border-b border-gray-100">
              <TableRow>
                <TableHead className="pl-6 text-[10px] uppercase tracking-widest font-extrabold text-gray-400">
                  Hotel ID
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400">
                  Tên khách sạn
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400">
                  Vùng
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400">
                  Ngày thêm
                </TableHead>
                <TableHead className="text-right pr-6 text-[10px] uppercase tracking-widest font-extrabold text-gray-400">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredCompetitors.map((competitor, i) => (
                  <motion.tr
                    key={competitor.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.02 }}
                    className="group border-gray-50 hover:bg-gray-50/40 transition-colors"
                  >
                    <TableCell className="pl-6 py-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-indigo-600">
                        {competitor.hotelId}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${competitor.isMyHotel ? 'bg-indigo-100' : 'bg-gray-50'} group-hover:bg-indigo-50 transition-colors`}>
                          <Hotel className={`w-4 h-4 ${competitor.isMyHotel ? 'text-indigo-600' : 'text-gray-400'} group-hover:text-indigo-600`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 flex items-center gap-2">
                            {competitor.name}
                            {competitor.isMyHotel && (
                              <Badge className="bg-indigo-600 text-[8px] h-4 px-1 uppercase">My Hotel</Badge>
                            )}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none font-semibold">
                        <MapPin className="w-3 h-3 mr-1" />
                        {getGroupName(competitor.groupId)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-400">
                      {competitor.createdAt}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-emerald-600 hover:bg-emerald-50"
                          title="Cập nhật / Kiểm tra giá ngay"
                          onClick={async () => {
                            try {
                              toast.info(`Đang kiểm tra giá cho "${competitor.name}"...`);
                              const now = new Date();
                              const checkin = now.toISOString().split('T')[0];
                              // simple check for next day
                              now.setDate(now.getDate() + 1);
                              const checkout = now.toISOString().split('T')[0];

                              const prices = await getCompetitorPrices(competitor.groupId, checkin, checkout);
                              const match = prices.find(p => p.hotelId === competitor.hotelId);

                              if (match) {
                                toast.success(`Giá hiện tại: ${match.originalLowPrice || 'N/A'}`);
                              } else {
                                toast.warning("Không tìm thấy giá cho khách sạn này trong báo cáo vùng.");
                              }
                            } catch (e) {
                              toast.error("Lỗi khi kiểm tra giá: " + (e as Error).message);
                            }
                          }}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                          onClick={() => handleOpenEdit(competitor)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteTarget(competitor)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>

          {filteredCompetitors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="bg-gray-100 p-6 rounded-3xl mb-4">
                <Search className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Chưa có đối thủ nào</h3>
              <p className="text-sm text-gray-500 max-w-xs mt-1">
                Bấm "Thêm đối thủ" để bắt đầu theo dõi giá khách sạn.
              </p>
              <Button
                className="mt-4 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all"
                onClick={handleOpenAdd}
              >
                <Plus className="w-4 h-4" />
                Thêm đối thủ đầu tiên
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
