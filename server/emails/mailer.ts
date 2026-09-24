/**
 * Envoi des e-mails transactionnels.
 *
 * Avec BREVO_API_KEY : API Brevo (même prestataire que les e-mails de
 * lab-service). Sans clé : aucun envoi, le message est gardé en mémoire et
 * consultable en local sur /api/dev/emails (aperçu de conception et recette).
 */
import type { RenderedEmail } from "./layout";

export interface OutgoingEmail extends RenderedEmail {
  to: string;
  tags?: string[];
}

export interface SentEmail extends OutgoingEmail {
  id: string;
  sentAt: string;
  mode: "brevo" | "preview";
  providerId?: string;
}

const PREVIEW_LIMIT = 50;
const previews: SentEmail[] = [];

const sender = () => ({
  name: process.env.MAIL_FROM_NAME || "MMA IQ",
  email: process.env.MAIL_FROM || "abonnements@mmaiq.fr",
});
const replyTo = () => process.env.MAIL_REPLY_TO || "contact@mmaiq.fr";

export const mailMode = (): "brevo" | "preview" => (process.env.BREVO_API_KEY ? "brevo" : "preview");

export async function sendEmail(email: OutgoingEmail): Promise<SentEmail> {
  const id = `mail_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const record: SentEmail = { ...email, id, sentAt: new Date().toISOString(), mode: mailMode() };

  if (record.mode === "brevo") {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY as string,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: sender(),
        to: [{ email: email.to }],
        replyTo: { email: replyTo() },
        subject: email.subject,
        htmlContent: email.html,
        textContent: email.text,
        tags: email.tags,
      }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Brevo ${response.status} : ${detail.slice(0, 300)}`);
    }
    const payload: any = await response.json().catch(() => ({}));
    record.providerId = payload?.messageId;
  }

  previews.unshift(record);
  previews.length = Math.min(previews.length, PREVIEW_LIMIT);
  console.log(`📧 [${record.mode}] ${email.to} — ${email.subject}${record.mode === "preview" ? ` (aperçu /api/dev/emails/${id})` : ""}`);
  return record;
}

/** Derniers e-mails traités (envoyés ou en aperçu), du plus récent au plus ancien. */
export const recentEmails = () => previews.slice();
export const findRecentEmail = (id: string) => previews.find((email) => email.id === id);
