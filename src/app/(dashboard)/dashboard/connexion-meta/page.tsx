import { Suspense } from "react";
import { ConnexionMetaPageView } from "@/components/dashboard/connexion-meta-page";

export const instant = false;

export default function ConnexionMetaPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm" style={{ color: "var(--dash-muted)" }}>
          Chargement…
        </p>
      }
    >
      <ConnexionMetaPageView />
    </Suspense>
  );
}
