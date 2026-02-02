import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "@/app/pages/LoginPage";
import { MemberLayout } from "@/app/layouts/MemberLayout";
import { AdminLayout } from "@/app/layouts/AdminLayout";
import { PriceCheckPage } from "@/app/pages/member/PriceCheckPage";
import { ReportPage } from "@/app/pages/member/ReportPage";
import { AdminDashboard } from "@/app/pages/admin/AdminDashboard";
import { GroupManagement } from "@/app/pages/admin/GroupManagement";
import { CompetitorManagement } from "@/app/pages/admin/CompetitorManagement";
import { SettingsPage } from "@/app/pages/admin/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/member",
    Component: MemberLayout,
    children: [
      { index: true, Component: PriceCheckPage },
      { path: "price-check", Component: PriceCheckPage },
      { path: "report", Component: ReportPage },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "dashboard", Component: AdminDashboard },
      { path: "groups", Component: GroupManagement },
      { path: "competitors", Component: CompetitorManagement },
      { path: "settings", Component: SettingsPage },
    ],
  },
]);

