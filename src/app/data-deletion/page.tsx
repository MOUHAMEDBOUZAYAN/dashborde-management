import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Suppression des données — 63 Agency",
  description:
    "Comment demander la suppression de vos données sur le portail client 63 Agency.",
};

export default function DataDeletionPage() {
  return (
    <LegalShell title="Suppression des données">
      <LegalSection title="Comment demander la suppression">
        <p>
          Si vous souhaitez supprimer vos données liées au portail client 63
          Agency, vous pouvez procéder de la façon suivante :
        </p>
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <strong style={{ color: "var(--login-text)" }}>
              Déconnexion Meta
            </strong>
            {" — "}
            depuis la page « Connexion Meta » de votre espace client, déconnectez
            votre compte Facebook. Cette action révoque l&apos;accès et
            supprime les jetons d&apos;accès stockés.
          </li>
          <li>
            <strong style={{ color: "var(--login-text)" }}>
              Demande complète par e-mail
            </strong>
            {" — "}
            envoyez une demande de suppression à{" "}
            <a
              href="mailto:contact@63agency.ma"
              className="underline underline-offset-2"
              style={{ color: "var(--login-gold)" }}
            >
              contact@63agency.ma
            </a>{" "}
            en précisant votre compte (nom de société et e-mail de connexion).
            Nous traitons la demande et supprimons vos données sous{" "}
            <strong style={{ color: "var(--login-text)" }}>30 jours</strong>.
          </li>
        </ol>
      </LegalSection>

      <LegalSection title="Ce qui est supprimé">
        <p>Une demande de suppression complète porte notamment sur :</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>votre compte client sur le portail ;</li>
          <li>les connexions Meta / Facebook associées ;</li>
          <li>les jetons d&apos;accès stockés ;</li>
          <li>les leads associés à votre compte.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Pour toute question ou demande relative à la suppression de vos
          données :{" "}
          <a
            href="mailto:contact@63agency.ma"
            className="underline underline-offset-2"
            style={{ color: "var(--login-gold)" }}
          >
            contact@63agency.ma
          </a>
          .
        </p>
        <p>
          Voir aussi notre{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2"
            style={{ color: "var(--login-gold)" }}
          >
            Politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <p className="pt-2 text-xs" style={{ color: "var(--login-muted)" }}>
        Dernière mise à jour : 3 novembre 2026.
      </p>
    </LegalShell>
  );
}
