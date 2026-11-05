import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Politique de confidentialité — 63 Agency",
  description:
    "Politique de confidentialité du portail client 63 Agency (client.63agency.com).",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Politique de confidentialité">
      <LegalSection title="Introduction">
        <p>
          63 Agency (« nous ») exploite ce portail client (
          <span style={{ color: "var(--login-text)" }}>client.63agency.com</span>
          ) permettant à ses clients de gérer les leads générés par leurs
          campagnes publicitaires. La présente politique décrit les données que
          nous collectons, comment nous les utilisons et les droits dont vous
          disposez.
        </p>
      </LegalSection>

      <LegalSection title="Données collectées">
        <p>Dans le cadre du service, nous pouvons collecter :</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            des informations de compte (nom de société, adresse e-mail) ;
          </li>
          <li>
            des données de connexion Facebook / Meta autorisées par
            l&apos;utilisateur (identifiant Facebook, accès aux Pages et aux
            formulaires Lead Ads) ;
          </li>
          <li>
            les leads importés (nom, téléphone, e-mail, campagne et champs
            associés au formulaire).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Utilisation des données">
        <p>Nous utilisons ces données uniquement pour :</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            afficher et gérer les leads du client dans son espace dédié ;
          </li>
          <li>synchroniser les formulaires Meta autorisés ;</li>
          <li>fournir le suivi commercial et les statistiques associées.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Données Facebook / Meta">
        <p>
          Nous accédons aux Pages Facebook et aux leads uniquement avec
          l&apos;autorisation explicite de l&apos;utilisateur via Facebook Login.
          Les jetons d&apos;accès sont stockés de manière chiffrée. Nous
          n&apos;utilisons ces données que pour le service décrit dans cette
          politique, et non à d&apos;autres fins.
        </p>
      </LegalSection>

      <LegalSection title="Partage des données">
        <p>
          Nous ne vendons pas vos données. Le partage est limité aux
          prestataires techniques strictement nécessaires au fonctionnement du
          portail (hébergement, infrastructure), dans le respect de mesures de
          sécurité appropriées.
        </p>
      </LegalSection>

      <LegalSection title="Conservation et sécurité">
        <p>
          Nous appliquons des mesures techniques et organisationnelles adaptées :
          chiffrement des jetons d&apos;accès Meta, accès restreint au personnel
          autorisé, et isolation des données par client.
        </p>
      </LegalSection>

      <LegalSection title="Droits de l'utilisateur">
        <p>
          Vous pouvez demander l&apos;accès, la rectification ou la suppression
          de vos données. Pour une demande de suppression, consultez la page{" "}
          <Link
            href="/data-deletion"
            className="underline underline-offset-2"
            style={{ color: "var(--login-gold)" }}
          >
            Suppression des données
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Déconnexion Meta">
        <p>
          Vous pouvez déconnecter votre compte Facebook à tout moment depuis la
          page « Connexion Meta » de votre espace client. Cette action révoque
          l&apos;accès et entraîne la suppression des jetons stockés associés.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Pour toute question relative à cette politique ou à vos données,
          contactez-nous à{" "}
          <a
            href="mailto:contact@63agency.ma"
            className="underline underline-offset-2"
            style={{ color: "var(--login-gold)" }}
          >
            contact@63agency.ma
          </a>
          .
        </p>
      </LegalSection>

      <p className="pt-2 text-xs" style={{ color: "var(--login-muted)" }}>
        Dernière mise à jour : 3 novembre 2026.
      </p>
    </LegalShell>
  );
}
