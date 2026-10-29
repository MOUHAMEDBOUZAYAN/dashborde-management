import { EmptyState } from "@/components/dashboard/empty-state";

export const instant = false;

export default function ConnexionMetaPage() {
  return (
    <EmptyState
      title="Bientôt disponible"
      description="La connexion Meta sera disponible ici prochainement."
    />
  );
}
