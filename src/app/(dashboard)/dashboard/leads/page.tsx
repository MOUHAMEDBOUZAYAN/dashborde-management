import { Suspense } from "react";
import { LeadsPageView } from "@/components/dashboard/leads-page";

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm" style={{ color: "var(--dash-muted)" }}>
          Chargement…
        </p>
      }
    >
      <LeadsPageView />
    </Suspense>
  );
}
