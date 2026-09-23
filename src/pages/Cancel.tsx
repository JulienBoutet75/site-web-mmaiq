import { Seo } from "../components/Seo";
import { ArrowLink, ButtonLink } from "../v3/ui";
import { Confirmation } from "./Success";

// Retour Stripe après abandon du paiement. Pas de maquette dédiée : même
// gabarit que les confirmations de paiement (Figma « 12 · Confirmations »).
export function Cancel() {
  return (
    <>
      <Seo title="Paiement annulé — MMA IQ" description="Le paiement a été interrompu : aucune somme n’a été débitée." canonicalPath="/cancel" />
      <Confirmation
        status="PAIEMENT ANNULÉ"
        title="Paiement annulé."
        actions={
          <>
            <ButtonLink to="/tarifs">Revoir les formules</ButtonLink>
            <ButtonLink to="/" variant="outline">Retour à l’accueil</ButtonLink>
          </>
        }
      >
        <p>
          Le paiement a été interrompu : aucune somme n’a été débitée. Tu peux reprendre quand tu veux
          ou choisir une autre formule.
        </p>
        <div>
          <ArrowLink to="/contact">Un souci pendant le paiement ? Écris-nous</ArrowLink>
        </div>
      </Confirmation>
    </>
  );
}
