import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CoachProfile {
  id: string | number;
  name: string;
  slug?: string;
  photo_url?: string;
  bio?: string;
  tagline?: string;
}

export function CoachIntroduction({ coaches }: { coaches: CoachProfile[] }) {
  const coach = coaches.find(person => person.name && person.photo_url);
  if (!coach) return null;

  return (
    <section className="border-b border-white/10 px-6 py-14 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.7fr_1.3fr] md:items-center md:gap-14">
        <img src={coach.photo_url} alt={coach.name} loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover object-top sm:max-h-96" />
        <div>
          <p className="mb-3 text-sm font-semibold text-[var(--color-violet-300)]">Les coachs de MMA IQ Academy</p>
          <h2 className="font-display text-4xl text-white sm:text-5xl">La technique se transmet.</h2>
          <h3 className="mt-6 font-display text-2xl text-white">{coach.name}</h3>
          {coach.tagline && <p className="mt-2 text-base text-[var(--color-violet-200)]">{coach.tagline}</p>}
          {coach.bio && <p className="mt-3 line-clamp-4 text-base leading-relaxed text-[var(--color-text-secondary)]">{coach.bio}</p>}
          <Link to={coach.slug ? `/coaches/${coach.slug}` : '/instructional'} className="mt-5 inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-white hover:text-[var(--color-violet-200)]">
            {coach.slug ? 'Découvrir son parcours' : "Rencontrer les coachs de l'Academy"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">L'Academy propose des formations approfondies, distinctes des tutoriels de l'application.</p>
        </div>
      </div>
    </section>
  );
}
