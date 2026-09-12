import { useState } from "react";
import { MessageSquare, Mail, Bell, Download, Users } from "lucide-react";
import { showToast } from "../../utils/ui";
import { getWaitlistInterest, type WaitlistInterest } from "../../lib/waitlist";

// Vues admin des leads (audit 17 juil 2026) : les messages de contact,
// les inscrits newsletter du footer et la waitlist app arrivaient tous
// dans la table `leads` sans être affichés nulle part. Trois vues en
// lecture seule — la table n'a pas de colonne statut (voir
// supabase_p0.sql), donc pas de toggle traité/non traité sans migration.

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function sortByDateDesc(leads: any[]): any[] {
  return [...leads].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

const thCls = "px-6 py-4 text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]";

// ── Messages du formulaire de contact ────────────────────────────

export function MessagesCRUD({ leads }: { leads: any[] }) {
  const messages = sortByDateDesc(leads.filter((l) => l.type === "contact"));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl">Messages reçus ({messages.length})</h2>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-12 text-center">
          <MessageSquare size={32} className="mx-auto mb-4 text-[var(--color-text-secondary)]" />
          <p className="text-[var(--color-text-secondary)] font-ui">
            Aucun message pour l'instant. Les envois du formulaire de contact apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="bg-[var(--color-bg-surface)] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[var(--color-bg-base)]">
                <th className={thCls}>Contact</th>
                <th className={thCls}>Message</th>
                <th className={thCls}>Date</th>
                <th className={`${thCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {messages.map((m) => (
                <tr key={m.id} className="hover:bg-white/5 transition-colors align-top">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{m.name || "Anonyme"}</div>
                    <div className="text-[10px] text-[var(--color-text-secondary)]">{m.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap max-w-xl">
                    {m.message || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                    {formatDate(m.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent(`Re : ton message à MMA IQ${m.name ? ` (${m.name})` : ""}`)}`}
                      className="inline-flex items-center gap-2 bg-[var(--color-accent-primary)] hover:opacity-90 text-white px-4 py-2 rounded-xl font-ui text-xs font-bold uppercase tracking-wide transition-opacity"
                    >
                      <Mail size={14} /> Répondre
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Inscrits newsletter via le footer (table leads, type 'newsletter') ──
// Affichée sous NewsletterTable : table séparée plutôt que fusion, pour
// ne pas mélanger des lignes avec/sans actions (toggle/suppression).
// Dédup par email : on masque les leads déjà présents dans
// newsletter_subscribers, et les doublons internes à leads.

export function NewsletterLeadsTable({ leads, subscribers }: { leads: any[]; subscribers: any[] }) {
  const subscribed = new Set(subscribers.map((s) => (s.email || "").toLowerCase()));
  const seen = new Set<string>();
  const footerLeads = sortByDateDesc(leads.filter((l) => l.type === "newsletter")).filter((l) => {
    const email = (l.email || "").toLowerCase();
    if (subscribed.has(email) || seen.has(email)) return false;
    seen.add(email);
    return true;
  });

  if (footerLeads.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-xl">Inscrits via le footer ({footerLeads.length})</h3>
        <p className="text-xs text-[var(--color-text-secondary)] font-ui mt-1">
          Emails collectés dans la table leads (type newsletter), absents de la liste ci-dessus.
        </p>
      </div>
      <div className="bg-[var(--color-bg-surface)] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-[var(--color-bg-base)]">
              <th className={thCls}>Email</th>
              <th className={thCls}>Date d'inscription</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {footerLeads.map((l) => (
              <tr key={l.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-sm font-medium">{l.email}</td>
                <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{formatDate(l.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Listes d'attente app et Academy (leads type 'waitlist') ──

function csvEscape(value: string): string {
  const text = String(value ?? "");
  // Les valeurs saisies par les visiteurs doivent rester du texte dans Excel.
  const safeText = /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

export function WaitlistTable({ leads, partners }: { leads: any[]; partners: any[] }) {
  const [interestFilter, setInterestFilter] = useState<WaitlistInterest | "all">("all");
  const waitlist = sortByDateDesc(leads.filter((l) => l.type === "waitlist"));
  const visibleWaitlist = interestFilter === "all"
    ? waitlist
    : waitlist.filter((l) => getWaitlistInterest(l.message) === interestFilter);
  const withCode = visibleWaitlist.filter((l) => l.referral_code).length;
  const partnerName = (code: string) => partners.find((p) => p.code === code)?.name;
  const interestLabel = (message?: string | null) => getWaitlistInterest(message) === "academy" ? "Academy" : "Application";

  const exportCsv = () => {
    if (visibleWaitlist.length === 0) {
      showToast("Aucun inscrit à exporter.");
      return;
    }
    const header = ["email", "name", "referral_code", "salle", "created_at", "interest", "message"];
    const rows = visibleWaitlist.map((l) => [
      l.email,
      l.name || "",
      l.referral_code || "",
      l.referral_code ? partnerName(l.referral_code) || "" : "",
      l.created_at,
      getWaitlistInterest(l.message),
      l.message || "",
    ]);
    // BOM pour que Excel ouvre les accents correctement.
    const csv = "\uFEFF" + [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-mmaiq-${interestFilter === "all" ? "" : `${interestFilter}-`}${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">Listes d’attente ({waitlist.length})</h2>
          <p className="text-sm text-[var(--color-text-secondary)] font-ui mt-1">
            {visibleWaitlist.length} affichés · {withCode} via une salle partenaire · {visibleWaitlist.length - withCode} en direct
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="shrink-0 flex items-center gap-2 bg-[var(--color-accent-primary)] hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-ui text-sm font-bold transition-opacity"
        >
          <Download size={16} /> {interestFilter === "all" ? "Exporter toutes les listes" : `Exporter ${interestFilter === "academy" ? "Academy" : "Application"}`} (CSV)
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label htmlFor="waitlist-interest-filter" className="text-sm font-medium">Intérêt</label>
        <select
          id="waitlist-interest-filter"
          value={interestFilter}
          onChange={(e) => setInterestFilter(e.target.value as WaitlistInterest | "all")}
          className="min-h-11 rounded-xl border border-white/20 bg-[var(--color-bg-surface)] px-4 py-2 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-violet-300)]"
        >
          <option value="all">Toutes les listes</option>
          <option value="app">Application</option>
          <option value="academy">Academy</option>
        </select>
      </div>

      {visibleWaitlist.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-12 text-center">
          <Bell size={32} className="mx-auto mb-4 text-[var(--color-text-secondary)]" />
          <p className="text-[var(--color-text-secondary)] font-ui">
            {waitlist.length === 0 ? "Aucun inscrit sur les listes d’attente pour l’instant." : "Aucun inscrit pour cet intérêt pour l’instant."}
          </p>
        </div>
      ) : (
        <div className="bg-[var(--color-bg-surface)] border border-white/10 rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[var(--color-bg-base)]">
                <th className={thCls}>Email</th>
                <th className={thCls}>Nom</th>
                <th className={thCls}>Intérêt</th>
                <th className={thCls}>Salle / referral</th>
                <th className={thCls}>Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {visibleWaitlist.map((l) => (
                <tr key={l.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{l.email}</td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{l.name || "—"}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex rounded-full border px-3 py-1 ${getWaitlistInterest(l.message) === "academy"
                      ? "border-[var(--color-accent-red)]/30 bg-[var(--color-accent-red)]/10 text-white"
                      : "border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-primary)]/10 text-white"}`}>
                      {interestLabel(l.message)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {l.referral_code ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-[var(--color-accent-primary)]">
                        <Users size={13} /> {l.referral_code}
                        {partnerName(l.referral_code) && (
                          <span className="text-[var(--color-text-secondary)] font-normal tracking-normal normal-case">
                            · {partnerName(l.referral_code)}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--color-text-secondary)]">Direct</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                    {formatDate(l.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
