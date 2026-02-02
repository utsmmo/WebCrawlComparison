import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
import { Plus, Pencil, Trash2, MapPin, Globe, Building2, Hotel } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

// ============================================================================
// Types
// ============================================================================

interface Group {
  id: string;
  name: string;
  location: string;
  createdAt?: string;
}

interface Competitor {
  id: string;
  hotelId: string;
  name: string;
  groupId: string;
  isMyHotel: boolean;
  createdAt: string;
}

// ============================================================================
// Storage
// ============================================================================

const GROUPS_KEY = "joyon_groups";
const COMPETITORS_KEY = "joyon_competitors";

const DEFAULT_GROUPS: Group[] = [
  { id: "hoi-an", name: "Hội An", location: "Hội An, Quảng Nam", createdAt: "2026-01-01" },
  { id: "da-nang", name: "Đà Nẵng", location: "Đà Nẵng", createdAt: "2026-01-01" },
  { id: "da-lat", name: "Đà Lạt", location: "Đà Lạt, Lâm Đồng", createdAt: "2026-01-01" },
  { id: "nha-trang", name: "Nha Trang", location: "Nha Trang, Khánh Hòa", createdAt: "2026-01-01" },
  { id: "phu-quoc", name: "Phú Quốc", location: "Phú Quốc, Kiên Giang", createdAt: "2026-01-01" },
];

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

function saveGroups(groups: Group[]) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

function loadCompetitors(): Competitor[] {
  try {
    const data = localStorage.getItem(COMPETITORS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load competitors:", e);
  }
  return [];
}

// ============================================================================
// Component
// ============================================================================

export function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const [groupName, setGroupName] = useState("");
  const [groupLocation, setGroupLocation] = useState("");

  useEffect(() => {
    setGroups(loadGroups());
    setCompetitors(loadCompetitors());
  }, []);

  const resetForm = () => {
    setGroupName("");
    setGroupLocation("");
    setEditingGroup(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupLocation(group.location);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    if (editingGroup) {
      const updated = groups.map(g =>
        g.id === editingGroup.id
          ? { ...g, name: groupName.trim(), location: groupLocation.trim() }
          : g
      );
      setGroups(updated);
      saveGroups(updated);
      toast.success(`Đã cập nhật nhóm "${groupName}"!`);
    } else {
      const newGroup: Group = {
        id: groupName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || Date.now().toString(),
        name: groupName.trim(),
        location: groupLocation.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updated = [...groups, newGroup];
      setGroups(updated);
      saveGroups(updated);
      toast.success(`Đã tạo nhóm "${groupName}" thành công!`);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteGroup = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa nhóm "${name}"? Các đối thủ trong nhóm này sẽ không hiển thị vùng nữa.`)) {
      const updated = groups.filter(g => g.id !== id);
      setGroups(updated);
      saveGroups(updated);
      toast.success(`Đã xóa nhóm "${name}"`);
    }
  };

  // Memoized group data with counts
  const groupsWithStats = useMemo(() => {
    return groups.map(group => {
      const companions = competitors.filter((c) => c.groupId === group.id);
      const myHotelCount = companions.filter((c) => c.isMyHotel).length;
      return {
        ...group,
        competitorCount: companions.length,
        myHotelCount
      };
    });
  }, [groups, competitors]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-display">
            Quản lý nhóm
          </h1>
          <p className="text-gray-500 mt-1">Cấu hình các cụm khách sạn đối thủ theo khu vực địa lý</p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-none rounded-xl shadow-lg shadow-indigo-200 h-11 px-6 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tạo nhóm mới
        </Button>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display">
              {editingGroup ? "Cập nhật nhóm điểm đến" : "Tạo nhóm điểm đến"}
            </DialogTitle>
            <DialogDescription>Thêm một nhóm điểm đến mới vào hệ thống để bắt đầu theo dõi</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="group-name" className="text-xs uppercase tracking-widest font-bold text-gray-400">Tên nhóm</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="group-name"
                  placeholder="Ví dụ: Hội An, Đà Nẵng..."
                  className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all shadow-sm"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-location" className="text-xs uppercase tracking-widest font-bold text-gray-400">Địa điểm</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="group-location"
                  placeholder="Ví dụ: Hội An, Quảng Nam"
                  className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all shadow-sm"
                  value={groupLocation}
                  onChange={(e) => setGroupLocation(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" className="rounded-xl h-11 px-6 font-bold" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-none rounded-xl h-11 px-8 shadow-lg shadow-indigo-200 active:scale-95 transition-all text-white font-bold">
                {editingGroup ? "Lưu thay đổi" : "Tạo nhóm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {groupsWithStats.map((group, i) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              layout
            >
              <Card className="hover:shadow-xl transition-all duration-300 border-none group overflow-hidden bg-white shadow-md relative">
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 w-full" />
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-50 p-3 rounded-2xl group-hover:bg-indigo-600 transition-colors duration-300 shadow-sm border border-indigo-100/50">
                        <MapPin className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold font-display text-indigo-950">{group.name}</CardTitle>
                        <CardDescription className="text-xs font-medium text-gray-400 mt-0.5">{group.location}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1 p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                        <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                          <Building2 className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Đối thủ</span>
                        </div>
                        <p className="text-xl font-bold text-indigo-900">{group.competitorCount}</p>
                      </div>
                      <div className="flex-1 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/30">
                        <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
                          <Hotel className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Của tôi</span>
                        </div>
                        <p className="text-xl font-bold text-emerald-600">{group.myHotelCount}</p>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 rounded-xl h-10 border-gray-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all font-bold text-xs uppercase tracking-wider"
                        onClick={() => handleOpenEdit(group)}
                      >
                        <Pencil className="w-3 h-3" />
                        Sửa
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-2 rounded-xl h-10 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-xs uppercase tracking-wider"
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                      >
                        <Trash2 className="w-3 h-3" />
                        Xóa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Detailed Table View */}
      <Card className="shadow-lg border-none overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/30 px-6 py-5 border-b border-gray-100">
          <CardTitle className="text-lg font-display">Bảng chi tiết các nhóm</CardTitle>
          <CardDescription>Danh sách đầy đủ thông tin kỹ thuật của các nhóm</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="pl-6 text-[10px] uppercase tracking-widest font-extrabold text-gray-400">Tên nhóm</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400">Địa điểm</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400">Số đối thủ</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400">Phân loại</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400">Ngày tạo</TableHead>
                <TableHead className="text-right pr-6 text-[10px] uppercase tracking-widest font-extrabold text-gray-400">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupsWithStats.map((group) => (
                <TableRow key={group.id} className="hover:bg-gray-50/30 transition-colors border-gray-50 group">
                  <TableCell className="pl-6 font-bold text-indigo-900">{group.name}</TableCell>
                  <TableCell className="text-sm text-gray-500">{group.location}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none font-bold">
                      {group.competitorCount} hotels
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-indigo-500 font-bold uppercase text-[9px]">Region</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-400 font-medium">{group.createdAt || "01/01/2026"}</TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-indigo-600 hover:bg-indigo-50"
                        onClick={() => handleOpenEdit(group)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50"
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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
