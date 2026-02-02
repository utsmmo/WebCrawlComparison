import { useState, useMemo, useEffect } from "react";
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
import { Plus, Pencil, Trash2, Search, Filter, Globe, MapPin, Hotel } from "lucide-react";
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
  { id: "da-nang", name: "Đà Nẵng", location: "Đà Nẵng" },
  { id: "da-lat", name: "Đà Lạt", location: "Đà Lạt, Lâm Đồng" },
  { id: "nha-trang", name: "Nha Trang", location: "Nha Trang, Khánh Hòa" },
  { id: "phu-quoc", name: "Phú Quốc", location: "Phú Quốc, Kiên Giang" },
];

// Default competitors (sample data)
const DEFAULT_COMPETITORS: Competitor[] = [
  { id: "1", hotelId: "beach-front-thanh-pho-hoi-an", name: "Beachfront Hotel Hoi An", groupId: "hoi-an", isMyHotel: false, createdAt: "2026-01-01" },
  { id: "2", hotelId: "la-alba-villa", name: "La ALBA Beach Villa", groupId: "hoi-an", isMyHotel: false, createdAt: "2026-01-01" },
  { id: "3", hotelId: "thien-thanh", name: "Old Town Hotel", groupId: "hoi-an", isMyHotel: true, createdAt: "2026-01-01" },
  { id: "4", hotelId: "raon-danang-beach-danang", name: "Raon Danang Beach", groupId: "da-nang", isMyHotel: true, createdAt: "2026-01-01" },
  { id: "5", hotelId: "sala-danang-beach", name: "Sala Danang Beach Hotel", groupId: "da-nang", isMyHotel: false, createdAt: "2026-01-01" },
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

    if (editingCompetitor) {
      // Update existing
      const updated = competitors.map(c =>
        c.id === editingCompetitor.id
          ? { ...c, hotelId: hotelId.trim(), name: competitorName.trim(), groupId: selectedGroup, isMyHotel }
          : c
      );
      setCompetitors(updated);
      saveCompetitors(updated);
      toast.success(`Đã cập nhật "${competitorName}"!`);
    } else {
      // Add new
      const newCompetitor: Competitor = {
        id: Date.now().toString(),
        hotelId: hotelId.trim(),
        name: competitorName.trim(),
        groupId: selectedGroup,
        isMyHotel,
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updated = [...competitors, newCompetitor];
      setCompetitors(updated);
      saveCompetitors(updated);
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
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-display">
            Quản lý đối thủ
          </h1>
          <p className="text-gray-500 mt-1">Thêm, sửa, xóa các khách sạn đối thủ cần theo dõi giá</p>
        </div>
        <Button
          className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-none rounded-xl shadow-lg shadow-indigo-200 h-11 px-6"
          onClick={handleOpenAdd}
        >
          <Plus className="w-4 h-4" />
          <span className="font-bold">Thêm đối thủ</span>
        </Button>
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
                className="bg-gradient-to-r from-indigo-600 to-purple-600 border-none rounded-xl h-11 px-8 shadow-lg shadow-indigo-200"
              >
                {editingCompetitor ? "Cập nhật" : "Thêm mới"}
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
                className="mt-4 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl"
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
