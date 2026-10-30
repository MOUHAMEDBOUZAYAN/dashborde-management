import { Suspense } from "react";
import { ConnexionMetaCallbackPageView } from "@/components/dashboard/connexion-meta-callback-page";

export const instant = false;

export default function ConnexionMetaCallbackPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm" style={{ color: "var(--dash-muted)" }}>
          Chargement…
        </p>
      }
    >
      <ConnexionMetaCallbackPageView />
    </Suspense>
  );
}
