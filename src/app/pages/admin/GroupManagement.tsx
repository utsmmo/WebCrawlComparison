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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
import { Plus, Pencil, Trash2, MapPin, Globe, Building2, Hotel, Search, RefreshCw } from "lucide-react";
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
  { id: "hoi-an-5-6", name: "Hội An 5,6", location: "Hội An, Quảng Nam", createdAt: "2026-02-03" },
  { id: "da-nang", name: "Đà Nẵng", location: "Đà Nẵng", createdAt: "2026-01-01" },
  { id: "da-lat", name: "Đà Lạt", location: "Đà Lạt, Lâm Đồng", createdAt: "2026-01-01" },
  { id: "nha-trang", name: "Nha Trang", location: "Nha Trang, Khánh Hòa", createdAt: "2026-01-01" },
  { id: "phu-quoc", name: "Phú Quốc", location: "Phú Quốc, Kiên Giang", createdAt: "2026-01-01" },
];

function loadGroups(): Group[] {
  try {
    const data = localStorage.getItem(GROUPS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load groups:", e);
  }
  localStorage.setItem(GROUPS_KEY, JSON.stringify(DEFAULT_GROUPS));
  return DEFAULT_GROUPS;
}

function saveGroups(groups: Group[]) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  window.dispatchEvent(new Event('local-storage-update'));
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

import { saveCompetitorConfig, CompetitorConfigPayload } from "@/app/lib/api";

// ... (keep existing imports)

export function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [groupLocation, setGroupLocation] = useState("");
  const [jsonPreview, setJsonPreview] = useState<string | null>(null);

  useEffect(() => {
    setGroups(loadGroups());
    setCompetitors(loadCompetitors());
  }, []);

  const handleSaveToServer = async () => {
    try {
      setIsSaving(true);
      // Transform local state to API payload
      const payload: CompetitorConfigPayload[] = groups.map(group => {
        const groupCompetitors = competitors.filter(c => c.groupId === group.id);

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
      toast.success("✅ Đã đồng bộ cấu hình lên server thành công!");
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("❌ Lỗi đồng bộ: " + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmSave = async () => {
    if (!jsonPreview) return;

    try {
      setIsSaving(true);
      const payload = JSON.parse(jsonPreview);
      await saveCompetitorConfig(payload);
      toast.success("Đã lưu cấu hình lên máy chủ thành công!");
      setJsonPreview(null);
    } catch (error) {
      console.error("Save config error:", error);
      toast.error("Lỗi khi lưu cấu hình: " + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setGroupName("");
    setGroupId("");
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
    setGroupId(group.id);
    setGroupLocation(group.location);
    setIsDialogOpen(true);
  };

  // Helper to auto-save to server
  const autoSaveConfig = async (currentGroups: Group[], currentCompetitors: Competitor[]) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !groupId.trim()) return;

    if (editingGroup) {
      const updated = groups.map(g =>
        g.id === editingGroup.id
          ? { ...g, id: groupId.trim(), name: groupName.trim(), location: groupLocation.trim() }
          : g
      );
      setGroups(updated);
      saveGroups(updated);
      autoSaveConfig(updated, competitors); // Auto-save
      toast.success(`Đã cập nhật nhóm "${groupName}"!`);
    } else {
      const newGroup: Group = {
        id: groupId.trim(),
        name: groupName.trim(),
        location: groupLocation.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updated = [...groups, newGroup];
      setGroups(updated);
      saveGroups(updated);
      autoSaveConfig(updated, competitors); // Auto-save
      toast.success(`Đã tạo nhóm "${groupName}" thành công!`);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteGroup = async () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;

    try {
      setIsSaving(true);
      const updatedGroups = groups.filter(g => g.id !== id);
      const updatedCompetitors = competitors.filter(c => c.groupId !== id);

      setGroups(updatedGroups);
      setCompetitors(updatedCompetitors);

      saveGroups(updatedGroups);
      localStorage.setItem(COMPETITORS_KEY, JSON.stringify(updatedCompetitors));

      await autoSaveConfig(updatedGroups, updatedCompetitors);
      toast.success(`Đã xóa nhóm "${name}" và các đối thủ liên quan`);
    } catch (e) {
      toast.error("Lỗi khi xóa nhóm");
    } finally {
      setIsSaving(false);
      setDeleteTarget(null);
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">
            Quản lý nhóm
          </h1>
          <p className="text-muted-foreground mt-1">Cấu hình các cụm khách sạn đối thủ theo khu vực địa lý</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleSaveToServer}
            disabled={isSaving}
            variant="outline"
            className="gap-2 h-11 px-6 font-semibold border-green-200 text-green-700 hover:bg-green-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? "Đang đồng bộ..." : "Đồng bộ lên server"}
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="gap-2 h-11 px-6 shadow-sm active:scale-95 transition-all font-semibold"
          >
            <Plus className="w-4 h-4" />
            Tạo nhóm mới
          </Button>
        </div>
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
              <Label htmlFor="group-id" className="text-xs uppercase tracking-widest font-bold text-gray-400">ID Nhóm (Mã định danh)</Label>
              <div className="relative">
                <Input
                  id="group-id"
                  placeholder="ví-dụ-hoi-an"
                  className="h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all shadow-sm font-mono text-sm"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  required
                />
              </div>
              <p className="text-[10px] text-muted-foreground">ID dùng để gọi API, nên viết liền không dấu, dùng dấu gạch ngang.</p>
            </div>

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

      {/* JSON Preview Dialog */}
      <Dialog open={!!jsonPreview} onOpenChange={(open) => !open && setJsonPreview(null)}>
        <DialogContent className="rounded-3xl border-none shadow-2xl max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display">Xác nhận cấu hình JSON</DialogTitle>
            <DialogDescription>
              Kiểm tra định dạng JSON sẽ gửi lên server (Khách sạn và Đối thủ theo khu vực).
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-slate-950 p-4 rounded-xl border border-slate-800">
            <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
              {jsonPreview}
            </pre>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setJsonPreview(null)}>Hủy</Button>
            <Button onClick={confirmSave} disabled={isSaving}>
              {isSaving ? "Đang gửi..." : "Gửi Test JSON"}
            </Button>
          </div>
        </DialogContent>
      </Dialog >

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-bold text-xl">Xác nhận xóa nhóm?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Bạn có chắc muốn xóa nhóm <strong>{deleteTarget?.name}</strong>?
              <br />
              Tất cả các đối thủ trong nhóm này cũng sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl h-11 px-6 font-semibold">Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-11 px-8 font-bold"
              onClick={handleDeleteGroup}
              disabled={isSaving}
            >
              {isSaving ? "Đang xóa..." : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Groups Grid */}
      < div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" >
        <AnimatePresence>
          {groupsWithStats.map((group, i) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              layout
            >
              <Card className="hover:shadow-lg transition-all duration-300 group overflow-hidden bg-card shadow-sm relative">
                <div className="h-1 bg-primary w-full" />
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-secondary p-3 rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 shadow-sm">
                        <MapPin className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold font-display text-foreground">{group.name}</CardTitle>
                        <CardDescription className="text-xs font-medium text-muted-foreground mt-0.5">{group.location}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1 p-3 bg-secondary/50 rounded-2xl border border-border">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                          <Building2 className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Đối thủ</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">{group.competitorCount}</p>
                      </div>
                      <div className="flex-1 p-3 bg-secondary/50 rounded-2xl border border-border">
                        <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
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
                        className="flex-1 gap-2 rounded-xl h-9 text-xs uppercase tracking-wider font-semibold"
                        onClick={() => handleOpenEdit(group)}
                      >
                        <Pencil className="w-3 h-3" />
                        Sửa
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-2 rounded-xl h-9 text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold text-xs uppercase tracking-wider"
                        onClick={() => setDeleteTarget(group)}
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
      </div >

      {/* Detailed Table View */}
      {/* Detailed Table View - REMOVED */}
    </div >
  );
}
