import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalPageShell,
  LegalSection,
} from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Politique de confidentialité — 63 Agency",
  description:
    "Politique de confidentialité du portail client 63 Agency (client.63agency.com).",
  robots: { index: true, follow: true },
};

const UPDATED_AT = "5 novembre 2026";

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Politique de confidentialité">
      <LegalSection title="Introduction">
        <p>
          63 Agency exploite ce portail client (
          <span style={{ color: "var(--dash-text)" }}>client.63agency.com</span>
          ) qui permet à ses clients de consulter et gérer les leads générés par
          leurs campagnes publicitaires Meta.
        </p>
      </LegalSection>

      <LegalSection title="Données que nous collectons">
        <ul className="list-disc space-y-2 ps-5">
          <li>
            Informations de compte (nom de société, email).
          </li>
          <li>
            Données Facebook/Meta autorisées par l&apos;utilisateur via Facebook
            Login (identifiant Facebook, accès en lecture aux Pages et aux
            formulaires Lead Ads).
          </li>
          <li>
            Les leads importés (nom, téléphone, email, campagne).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Utilisation des données">
        <p>
          Nous utilisons ces données pour afficher et gérer les leads du client,
          synchroniser les formulaires Meta, et fournir le suivi ainsi que les
          statistiques du portail.
        </p>
      </LegalSection>

      <LegalSection title="Données Facebook / Meta">
        <ul className="list-disc space-y-2 ps-5">
          <li>
            L&apos;accès n&apos;est possible qu&apos;avec l&apos;autorisation
            explicite de l&apos;utilisateur.
          </li>
          <li>
            Les jetons d&apos;accès sont chiffrés au repos.
          </li>
          <li>
            Ils sont utilisés uniquement pour le service décrit ci-dessus.
          </li>
          <li>Ils ne sont jamais vendus.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Partage">
        <p>
          Aucune vente de données. Le partage est limité aux prestataires
          techniques nécessaires au fonctionnement du service.
        </p>
      </LegalSection>

      <LegalSection title="Conservation et sécurité">
        <p>
          Nous appliquons le chiffrement des jetons, un accès restreint aux
          systèmes, et une isolation stricte des données par client.
        </p>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification et de
          suppression de vos données. Pour la suppression, consultez la page{" "}
          <Link
            href="/data-deletion"
            className="underline-offset-2 hover:underline"
            style={{ color: "var(--dash-gold-muted)" }}
          >
            Suppression des données
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Déconnexion Meta">
        <p>
          L&apos;utilisateur peut déconnecter son compte Facebook à tout moment
          depuis la page « Connexion Meta », ce qui révoque l&apos;accès et
          supprime les jetons stockés.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Pour toute question relative à vos données :{" "}
          <a
            href="mailto:contact@63agency.ma"
            className="underline-offset-2 hover:underline"
            style={{ color: "var(--dash-gold-muted)" }}
          >
            contact@63agency.ma
          </a>
          .
        </p>
      </LegalSection>

      <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
        Dernière mise à jour : {UPDATED_AT}
      </p>
    </LegalPageShell>
  );
}
