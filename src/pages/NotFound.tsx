import { Seo } from "../components/Seo";
import { ButtonLink, Eyebrow } from "../v3/ui";

export function NotFound() {
  return (
    <section className="v3-gutter v3-first-screen flex items-center bg-v3-fond py-20 text-white">
      <Seo title="Page introuvable — MMA IQ" description="Cette page n’existe pas ou a été déplacée." />
      <div className="v3-container flex flex-col items-start gap-6">
        <Eyebrow>ERREUR 404</Eyebrow>
        <h1 className="v3-display text-v3-paper">Cette page<br />n’existe pas.</h1>
        <p className="v3-body max-w-[544px] text-v3-muted">Le lien est peut-être cassé, ou la page a été déplacée.</p>
        <div className="flex flex-wrap gap-4">
          <ButtonLink to="/">Retour à l’accueil</ButtonLink>
          <ButtonLink to="/aide" variant="outline">Centre d’aide</ButtonLink>
        </div>
      </div>
    </section>
  );
}
