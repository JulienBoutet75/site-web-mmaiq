import { useState } from "react";
import QRCode from "qrcode";
import {
  Plus, Copy, QrCode as QrIcon, Printer, Pencil, Trash2, ExternalLink,
  X, Save, Building2, Users, Download, Inbox, ArrowRight
} from "lucide-react";
import { insertData, updateData, deleteData } from "../../lib/supabase";
import { showToast, customConfirm } from "../../utils/ui";

// Gestion des salles/clubs partenaires (Phase 0 du programme, 13 juil 2026).
// Pensé pour le rendez-vous terrain : nom + ville + email → code, slug,
// lien, QR et affiche A4 générés dans la minute. Taux de commission et
// remise adhérent configurables par salle (décisions Q4/Q5).

const VAT_LABELS: Record<string, string> = {
  tva20: "Assujettie TVA 20 %",
  franchise_293b: "Franchise en base (art. 293 B)",
  asso_non_assujettie: "Association non assujettie",
};

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function codeFromSlug(slug: string): string {
  return slug.replace(/-/g, "").toUpperCase().slice(0, 12);
}

function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now() % 1000}`;
}

function uniqueCode(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let i = 2; i < 100; i++) {
    const candidate = `${base.slice(0, 11)}${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base.slice(0, 9)}${Date.now() % 100}`;
}

function partnerUrl(slug: string): string {
  return `${window.location.origin}/s/${slug}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Affiche A4 imprimable (fond clair : les posters sombres impriment mal).
async function openPoster(partner: any) {
  const url = partnerUrl(partner.slug);
  const qr = await QRCode.toDataURL(url, { width: 720, margin: 1, color: { dark: "#17111F", light: "#FFFFFF" } });
  const name = escapeHtml(partner.name);
  const hasDiscount = partner.discount_percent > 0;
  const win = window.open("", "_blank");
  if (!win) {
    showToast("Popup bloquée : autorise les popups pour imprimer l'affiche.");
    return;
  }
  win.document.write(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Affiche — ${name}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: "Avenir Next", "Segoe UI", system-ui, sans-serif; color: #17111F; }
  .page { width: 210mm; height: 297mm; padding: 18mm 16mm; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .brand { display: flex; align-items: center; gap: 10px; font-weight: 800; letter-spacing: .12em; font-size: 15px; color: #6520D9; text-transform: uppercase; }
  .brand .x { color: #999; font-weight: 400; }
  .brand .club { color: #17111F; }
  h1 { font-size: 52px; line-height: .98; text-transform: uppercase; letter-spacing: .01em; margin-top: 14mm; font-weight: 900; }
  h1 .grad { color: #7B2FFF; }
  .sub { font-size: 17px; color: #555; max-width: 150mm; margin-top: 7mm; line-height: 1.5; }
  .promo { margin-top: 9mm; display: inline-block; background: #F1E9FF; color: #4B1AB3; border: 2px solid #7B2FFF; border-radius: 999px; padding: 5mm 10mm; font-size: 19px; font-weight: 800; }
  .qr { margin-top: 10mm; width: 78mm; height: 78mm; }
  .scan { margin-top: 6mm; font-size: 16px; color: #333; }
  .scan strong { color: #17111F; }
  .code { margin-top: 3mm; font-size: 26px; font-weight: 900; letter-spacing: .2em; color: #7B2FFF; }
  .foot { margin-top: auto; font-size: 13px; color: #888; }
</style></head>
<body>
  <div class="page">
    <div class="brand"><span>MMA IQ</span><span class="x">×</span><span class="club">${name}</span></div>
    <h1>Progresse<br>entre les cours.<br><span class="grad">Ton club est partenaire.</span></h1>
    <p class="sub">L'app tout-en-un du combattant : entraînement, nutrition, cutting, gameplan et analyse vidéo IA. Ta pré-inscription soutient directement ton club.</p>
    ${hasDiscount ? `<div class="promo">−${partner.discount_percent}&nbsp;% pendant ${partner.discount_months}&nbsp;mois pour les membres ${name}</div>` : ""}
    <img class="qr" src="${qr}" alt="QR code ${name}">
    <p class="scan">Scanne le QR ou va sur <strong>mmaiq.fr/s/${escapeHtml(partner.slug)}</strong></p>
    <p class="code">CODE&nbsp;: ${escapeHtml(partner.code)}</p>
    <p class="foot">mmaiq.fr — Upgrade your fight.</p>
  </div>
  <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
</body></html>`);
  win.document.close();
}

const inputCls = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-ui placeholder:text-white/30 focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors";
const labelCls = "block text-xs font-ui font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-1.5";

export function PartnersCRUD({ data, leads, onUpdate }: { data: any[]; leads: any[]; onUpdate: () => void }) {
  const [isCreating, setIsCreating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", contact_name: "", contact_email: "", phone: "" });

  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [kitPartner, setKitPartner] = useState<any>(null);
  const [kitQr, setKitQr] = useState<string>("");

  const leadCount = (code: string) => leads.filter((l) => l.referral_code === code).length;

  // Candidatures du formulaire /partenaires, les plus récentes d'abord.
  const candidatures = leads
    .filter((l) => l.type === "partner")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Pré-remplit le formulaire de création depuis une candidature.
  const startFromCandidature = (lead: any) => {
    const cityMatch = (lead.message || "").match(/Ville : (.+)/);
    const contactMatch = (lead.message || "").match(/Contact : (.+)/);
    setForm({
      name: lead.name || "",
      city: cityMatch?.[1]?.trim() || "",
      contact_name: contactMatch?.[1]?.trim() || "",
      contact_email: lead.email || "",
      phone: "",
    });
    setIsCreating(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      showToast("Le nom du club est obligatoire.");
      return;
    }
    setCreating(true);
    try {
      const base = slugify(form.name);
      if (!base) throw new Error("Nom de club invalide.");
      const slug = uniqueSlug(base, new Set(data.map((p) => p.slug)));
      const code = uniqueCode(codeFromSlug(slug), new Set(data.map((p) => p.code)));
      await insertData("partners", {
        name: form.name.trim(),
        slug,
        code,
        city: form.city.trim() || null,
        contact_name: form.contact_name.trim() || null,
        contact_email: form.contact_email.trim() || null,
        phone: form.phone.trim() || null,
      });
      showToast(`Salle créée — code ${code}`);
      setForm({ name: "", city: "", contact_name: "", contact_email: "", phone: "" });
      setIsCreating(false);
      onUpdate();
    } catch (e: any) {
      console.error("Create partner error:", e);
      showToast("Erreur : " + e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const rate = Number(editing.commission_pct);
      const discount = Number(editing.discount_percent);
      const months = Number(editing.discount_months);
      if (Number.isNaN(rate) || rate < 0 || rate > 50) throw new Error("Taux de commission entre 0 et 50 %.");
      if (Number.isNaN(discount) || discount < 0 || discount > 100) throw new Error("Remise entre 0 et 100 %.");
      if (Number.isNaN(months) || months < 0 || months > 24) throw new Error("Durée de remise entre 0 et 24 mois.");
      await updateData("partners", editing.id, {
        name: editing.name,
        city: editing.city || null,
        contact_name: editing.contact_name || null,
        contact_email: editing.contact_email || null,
        phone: editing.phone || null,
        logo_url: editing.logo_url || null,
        siret: editing.siret || null,
        vat_status: editing.vat_status || null,
        commission_rate: Math.round(rate * 10) / 1000,
        discount_percent: Math.round(discount),
        discount_months: Math.round(months),
        status: editing.status,
        notes: editing.notes || null,
      });
      showToast("Salle mise à jour.");
      setEditing(null);
      onUpdate();
    } catch (e: any) {
      console.error("Update partner error:", e);
      showToast("Erreur : " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (partner: any) => {
    const ok = await customConfirm(
      `Supprimer « ${partner.name} » ? Les pré-inscriptions taguées ${partner.code} restent en base, mais le lien /s/${partner.slug} et le QR cessent de fonctionner. Préfère le statut « suspendue » si le contrat est juste en pause.`
    );
    if (!ok) return;
    try {
      await deleteData("partners", partner.id);
      showToast("Salle supprimée.");
      onUpdate();
    } catch (e: any) {
      showToast("Erreur : " + e.message);
    }
  };

  const openKit = async (partner: any) => {
    setKitPartner(partner);
    setKitQr("");
    try {
      const qr = await QRCode.toDataURL(partnerUrl(partner.slug), { width: 512, margin: 1 });
      setKitQr(qr);
    } catch (e) {
      console.error("QR error:", e);
    }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(partnerUrl(slug))
      .then(() => showToast("Lien copié !"))
      .catch(() => showToast("Impossible de copier le lien."));
  };

  return (
    <div className="space-y-6">
      {/* Header + création rapide */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--color-text-secondary)] font-ui">
            {data.length} salle{data.length > 1 ? "s" : ""} · {leads.filter((l) => l.referral_code).length} pré-inscription{leads.filter((l) => l.referral_code).length > 1 ? "s" : ""} attribuée{leads.filter((l) => l.referral_code).length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 bg-[var(--color-accent-primary)] hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-ui text-sm font-bold transition-opacity"
        >
          {isCreating ? <X size={16} /> : <Plus size={16} />}
          {isCreating ? "Annuler" : "Nouvelle salle"}
        </button>
      </div>

      {/* Candidatures reçues via /partenaires : à transformer en salles */}
      {candidatures.length > 0 && (
        <div className="bg-white/[0.04] border border-[var(--color-accent-primary)]/30 rounded-2xl p-6">
          <h3 className="font-display text-lg uppercase tracking-wide mb-4 flex items-center gap-2">
            <Inbox size={18} className="text-[var(--color-accent-primary)]" />
            Candidatures reçues ({candidatures.length})
          </h3>
          <div className="flex flex-col gap-3">
            {candidatures.map((lead) => (
              <div key={lead.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-white">
                    {lead.name || "Club sans nom"}
                    <span className="text-xs text-[var(--color-text-secondary)] font-normal ml-2">
                      {new Date(lead.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">
                    {lead.email}{lead.message ? ` · ${lead.message.split("\n")[0]}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => startFromCandidature(lead)}
                  className="shrink-0 flex items-center gap-2 bg-[var(--color-accent-primary)] hover:opacity-90 text-white px-4 py-2 rounded-xl font-ui text-xs font-bold uppercase tracking-wide transition-opacity"
                >
                  Créer la salle <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulaire de création (pensé rendez-vous : 3 champs suffisent) */}
      {isCreating && (
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
          <h3 className="font-display text-lg uppercase tracking-wide mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-[var(--color-accent-primary)]" /> Nouvelle salle partenaire
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className={labelCls}>Nom du club *</label>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Gracie Barra Lyon" />
            </div>
            <div>
              <label className={labelCls}>Ville</label>
              <input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Lyon" />
            </div>
            <div>
              <label className={labelCls}>Email contact</label>
              <input className={inputCls} type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="contact@club.fr" />
            </div>
            <div>
              <label className={labelCls}>Nom du contact</label>
              <input className={inputCls} value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} placeholder="Prénom Nom" />
            </div>
            <div>
              <label className={labelCls}>Téléphone</label>
              <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="06…" />
            </div>
          </div>
          {form.name.trim() && (
            <p className="text-xs font-ui text-[var(--color-text-secondary)] mb-4">
              Sera créé avec le lien <span className="text-white">/s/{uniqueSlug(slugify(form.name), new Set(data.map((p) => p.slug)))}</span>,
              le code <span className="text-[var(--color-accent-primary)] font-bold tracking-widest">{uniqueCode(codeFromSlug(slugify(form.name)), new Set(data.map((p) => p.code)))}</span>,
              commission 20 % et remise −20 % × 3 mois (modifiables ensuite).
            </p>
          )}
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-ui text-sm font-bold transition-colors disabled:opacity-60"
          >
            <Save size={16} /> {creating ? "Création…" : "Créer la salle"}
          </button>
        </div>
      )}

      {/* Liste */}
      {data.length === 0 && !isCreating ? (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-12 text-center">
          <Building2 size={32} className="mx-auto mb-4 text-[var(--color-text-secondary)]" />
          <p className="text-[var(--color-text-secondary)] font-ui">
            Aucune salle partenaire pour l'instant. Crée la première avant ton prochain rendez-vous.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm font-ui">
            <thead>
              <tr className="bg-white/[0.04] text-left text-xs uppercase tracking-widest text-[var(--color-text-secondary)]">
                <th className="px-4 py-3 font-bold">Salle</th>
                <th className="px-4 py-3 font-bold">Code</th>
                <th className="px-4 py-3 font-bold">Commission</th>
                <th className="px-4 py-3 font-bold">Remise adhérent</th>
                <th className="px-4 py-3 font-bold">Pré-inscrits</th>
                <th className="px-4 py-3 font-bold">Statut</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{p.name}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">{p.city || "—"} · /s/{p.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold tracking-widest text-[var(--color-accent-primary)]">{p.code}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{(p.commission_rate * 100).toFixed(0)} % <span className="text-xs text-[var(--color-text-secondary)]">à vie</span></td>
                  <td className="px-4 py-3 tabular-nums">
                    {p.discount_percent > 0 ? `−${p.discount_percent} % × ${p.discount_months} mois` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Users size={14} className="text-[var(--color-text-secondary)]" /> {leadCount(p.code)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      p.status === "active" ? "bg-green-500/15 text-green-400"
                      : p.status === "pending" ? "bg-yellow-500/15 text-yellow-400"
                      : "bg-red-500/15 text-red-400"
                    }`}>
                      {p.status === "active" ? "Active" : p.status === "pending" ? "En attente" : "Suspendue"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button title="Kit salle (QR, lien, affiche)" onClick={() => openKit(p)} className="p-2 rounded-lg bg-white/5 hover:bg-[var(--color-accent-primary)] transition-colors">
                        <QrIcon size={15} />
                      </button>
                      <button title="Copier le lien" onClick={() => copyLink(p.slug)} className="p-2 rounded-lg bg-white/5 hover:bg-white/15 transition-colors">
                        <Copy size={15} />
                      </button>
                      <a title="Voir la page" href={`/s/${p.slug}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-white/15 transition-colors">
                        <ExternalLink size={15} />
                      </a>
                      <button
                        title="Modifier"
                        onClick={() => setEditing({ ...p, commission_pct: (p.commission_rate * 100).toFixed(0) })}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/15 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button title="Supprimer" onClick={() => handleDelete(p)} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/60 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal édition */}
      {editing && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-[var(--color-bg-surface)] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg uppercase tracking-wide">Modifier — {editing.name}</h3>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg bg-white/5 hover:bg-white/15"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>Nom</label>
                <input className={inputCls} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Ville</label>
                <input className={inputCls} value={editing.city || ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Contact</label>
                <input className={inputCls} value={editing.contact_name || ""} onChange={(e) => setEditing({ ...editing, contact_name: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input className={inputCls} type="email" value={editing.contact_email || ""} onChange={(e) => setEditing({ ...editing, contact_email: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Téléphone</label>
                <input className={inputCls} value={editing.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Logo (URL)</label>
                <input className={inputCls} value={editing.logo_url || ""} onChange={(e) => setEditing({ ...editing, logo_url: e.target.value })} placeholder="https://…" />
              </div>
              <div>
                <label className={labelCls}>Commission (% du HT, à vie)</label>
                <input className={inputCls} type="number" min={0} max={50} step={1} value={editing.commission_pct} onChange={(e) => setEditing({ ...editing, commission_pct: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Statut</label>
                <select className={inputCls} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  <option value="active">Active (lien + landing en ligne)</option>
                  <option value="pending">En attente (landing masquée)</option>
                  <option value="suspended">Suspendue (landing masquée)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Remise adhérent (%)</label>
                <input className={inputCls} type="number" min={0} max={100} step={5} value={editing.discount_percent} onChange={(e) => setEditing({ ...editing, discount_percent: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Durée de la remise (mois)</label>
                <input className={inputCls} type="number" min={0} max={24} step={1} value={editing.discount_months} onChange={(e) => setEditing({ ...editing, discount_months: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>SIRET</label>
                <input className={inputCls} value={editing.siret || ""} onChange={(e) => setEditing({ ...editing, siret: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Statut TVA (auto-facturation)</label>
                <select className={inputCls} value={editing.vat_status || ""} onChange={(e) => setEditing({ ...editing, vat_status: e.target.value })}>
                  <option value="">— Non renseigné —</option>
                  {Object.entries(VAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-5">
              <label className={labelCls}>Notes internes</label>
              <textarea className={`${inputCls} resize-none`} rows={3} value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 font-ui text-sm font-semibold">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 font-ui text-sm font-bold disabled:opacity-60">
                <Save size={16} /> {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal kit salle */}
      {kitPartner && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setKitPartner(null)}>
          <div className="bg-[var(--color-bg-surface)] border border-white/10 rounded-2xl p-6 w-full max-w-md text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg uppercase tracking-wide">Kit — {kitPartner.name}</h3>
              <button onClick={() => setKitPartner(null)} className="p-2 rounded-lg bg-white/5 hover:bg-white/15"><X size={16} /></button>
            </div>
            {kitQr ? (
              <img src={kitQr} alt={`QR ${kitPartner.name}`} className="w-56 h-56 mx-auto rounded-xl bg-white p-2 mb-4" />
            ) : (
              <div className="w-56 h-56 mx-auto rounded-xl bg-white/5 animate-pulse mb-4" />
            )}
            <p className="font-ui text-sm text-[var(--color-text-secondary)] mb-1">{partnerUrl(kitPartner.slug)}</p>
            <p className="font-ui text-lg font-bold tracking-[0.25em] text-[var(--color-accent-primary)] mb-6">{kitPartner.code}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button onClick={() => copyLink(kitPartner.slug)} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 font-ui text-xs font-bold uppercase tracking-wide">
                <Copy size={14} /> Lien
              </button>
              <a
                href={kitQr || undefined}
                download={`qr-mmaiq-${kitPartner.slug}.png`}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 font-ui text-xs font-bold uppercase tracking-wide ${!kitQr ? "pointer-events-none opacity-50" : ""}`}
              >
                <Download size={14} /> QR .png
              </a>
              <button onClick={() => openPoster(kitPartner)} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-accent-primary)] hover:opacity-90 font-ui text-xs font-bold uppercase tracking-wide">
                <Printer size={14} /> Affiche A4
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
