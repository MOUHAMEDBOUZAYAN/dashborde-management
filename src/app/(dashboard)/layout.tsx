import { DashboardGuard } from "@/components/layout/dashboard-guard";

export const instant = false;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardGuard>{children}</DashboardGuard>;
}
