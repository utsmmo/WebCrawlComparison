import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Save, Loader2, Server } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

// ============================================================================
// Storage
// ============================================================================

const SETTINGS_KEY = "joyon_settings";

export interface AppSettings {
    defaultAdults: number;
    cacheEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
    defaultAdults: 2,
    cacheEnabled: true,
};

export function loadSettings(): AppSettings {
    try {
        const data = localStorage.getItem(SETTINGS_KEY);
        if (data) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
        }
    } catch (e) {
        console.error("Failed to load settings:", e);
    }
    return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ============================================================================
// Component
// ============================================================================

export function SettingsPage() {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setSettings(loadSettings());
    }, []);

    const handleSave = () => {
        setIsSaving(true);

        const finalSettings = { ...settings };

        saveSettings(finalSettings);
        setSettings(finalSettings);

        setTimeout(() => {
            setIsSaving(false);
            toast.success("Đã lưu cài đặt!");
        }, 500);
    };

    return (
        <div className="space-y-6 pb-12">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-display">
                        Cài đặt hệ thống
                    </h1>
                    <p className="text-gray-500 mt-1">Cấu hình API và các thông số mặc định</p>
                </div>
            </motion.div>

            <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
                            <Server className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="font-display">System Configuration</CardTitle>
                            <CardDescription>Cấu hình các thông số mặc định của hệ thống</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Số khách mặc định
                        </Label>
                        <Input
                            type="number"
                            min={1}
                            max={10}
                            className="h-12 rounded-xl bg-gray-50 border-gray-100 w-32"
                            value={settings.defaultAdults}
                            onChange={(e) => setSettings({ ...settings, defaultAdults: parseInt(e.target.value) || 2 })}
                        />
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            className="h-12 px-8 rounded-xl gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Lưu cài đặt
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-gradient-to-br from-indigo-50 to-purple-50">
                <CardHeader>
                    <CardTitle className="text-lg font-display text-indigo-900">Tham khảo API Endpoints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            { method: "GET", path: "/api/{region}", desc: "Lấy giá theo khu vực" },
                            { method: "GET", path: "/api/myhotel", desc: "Khách sạn của tôi" },
                            { method: "GET", path: "/api/crawl?id=xxx", desc: "Crawl 1 KS cụ thể" },
                            { method: "GET", path: "/api/competitor-price", desc: "So sánh với đối thủ" },
                        ].map((api, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-indigo-100/50">
                                <Badge className="bg-indigo-600 text-[10px] font-bold">{api.method}</Badge>
                                <code className="text-xs text-indigo-700 font-mono">{api.path}</code>
                                <span className="text-xs text-gray-500 ml-auto">{api.desc}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
