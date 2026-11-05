import type { Metadata } from "next";
import {
  LegalPageShell,
  LegalSection,
} from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Suppression des données — 63 Agency",
  description:
    "Instructions pour demander la suppression des données du portail client 63 Agency.",
  robots: { index: true, follow: true },
};

export default function DataDeletionPage() {
  return (
    <LegalPageShell title="Suppression des données">
      <LegalSection title="Comment demander la suppression">
        <ol className="list-decimal space-y-3 ps-5">
          <li>
            Se déconnecter de Meta depuis la page « Connexion Meta » (cela
            révoque l&apos;accès Facebook et supprime immédiatement les jetons
            stockés).
          </li>
          <li>
            Pour une suppression complète du compte et des données associées,
            envoyer une demande par email à{" "}
            <a
              href="mailto:contact@63agency.ma"
              className="underline-offset-2 hover:underline"
              style={{ color: "var(--dash-gold-muted)" }}
            >
              contact@63agency.ma
            </a>{" "}
            en précisant l&apos;email du compte ; la suppression est effectuée
            sous 30 jours.
          </li>
        </ol>
      </LegalSection>

      <LegalSection title="Ce qui est supprimé">
        <ul className="list-disc space-y-2 ps-5">
          <li>Le compte client</li>
          <li>
            Les connexions Meta (jetons, pages, formulaires)
          </li>
          <li>Les leads associés</li>
        </ul>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Demande de suppression :{" "}
          <a
            href="mailto:contact@63agency.ma"
            className="underline-offset-2 hover:underline"
            style={{ color: "var(--dash-gold-muted)" }}
          >
            contact@63agency.ma
          </a>
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
