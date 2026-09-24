/**
 * Mise en page des e-mails MMA IQ (direction V3) : tableaux et styles en
 * ligne pour les messageries (Gmail, Outlook, Apple Mail), une version texte
 * pour chaque message. Tout contenu dynamique est échappé.
 */

export type EmailBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "facts"; rows: Array<[label: string, value: string]> }
  | { kind: "button"; label: string; href: string }
  | { kind: "link"; label: string; href: string; before?: string }
  | { kind: "steps"; title: string; items: string[] }
  | { kind: "note"; text: string };

export interface EmailContent {
  subject: string;
  /** Aperçu affiché par la messagerie après l'objet. */
  preheader: string;
  eyebrow: string;
  title: string;
  blocks: EmailBlock[];
}

export interface EmailLinks {
  siteUrl: string;
  manageUrl: string;
  helpUrl: string;
  termsUrl: string;
  logoUrl: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const FONT = "'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const COLORS = {
  page: "#F4F0FC",
  ink: "#04050A",
  inkMuted: "#4A5568",
  brand: "#7B2FFF",
  lavender: "#C9A9FF",
  border: "#E9E2F5",
  night: "#221B34",
  soft: "#FAF8FE",
  footer: "#8B8A9C",
};

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function renderBlock(block: EmailBlock): string {
  switch (block.kind) {
    case "paragraph":
      return `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:24px;color:${COLORS.inkMuted};">${escapeHtml(block.text)}</p>`;

    case "facts": {
      const rows = block.rows
        .map(([label, value], index) => {
          const separator = index < block.rows.length - 1 ? `border-bottom:1px solid ${COLORS.border};` : "";
          return `<tr>
  <td style="padding:12px 0;${separator}font-family:${FONT};font-size:14px;line-height:20px;color:${COLORS.inkMuted};">${escapeHtml(label)}</td>
  <td align="right" style="padding:12px 0 12px 16px;${separator}font-family:${FONT};font-size:15px;line-height:20px;font-weight:600;color:${COLORS.ink};">${escapeHtml(value)}</td>
</tr>`;
        })
        .join("");
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;background:${COLORS.page};border-radius:12px;">
<tr><td style="padding:4px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>
</table>`;
    }

    case "button":
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
<tr><td bgcolor="${COLORS.brand}" style="border-radius:12px;background:${COLORS.brand};">
<a href="${escapeHtml(block.href)}" style="display:inline-block;padding:16px 28px;font-family:${FONT};font-size:16px;line-height:24px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">${escapeHtml(block.label)}</a>
</td></tr>
</table>`;

    case "link":
      return `<p style="margin:0 0 16px;font-family:${FONT};font-size:14px;line-height:20px;color:${COLORS.inkMuted};">${block.before ? `${escapeHtml(block.before)} ` : ""}<a href="${escapeHtml(block.href)}" style="color:${COLORS.brand};font-weight:600;text-decoration:underline;">${escapeHtml(block.label)}</a></p>`;

    case "steps": {
      const items = block.items
        .map(
          (item, index) => `<tr>
  <td width="40" valign="top" style="padding:8px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="28" height="28" align="center" bgcolor="${COLORS.brand}" style="width:28px;height:28px;border-radius:14px;background:${COLORS.brand};font-family:${FONT};font-size:13px;line-height:28px;font-weight:600;color:#ffffff;">${index + 1}</td></tr></table>
  </td>
  <td valign="top" style="padding:12px 0 8px;font-family:${FONT};font-size:15px;line-height:22px;color:${COLORS.ink};">${escapeHtml(item)}</td>
</tr>`,
        )
        .join("");
      return `<p style="margin:8px 0 4px;font-family:${FONT};font-size:17px;line-height:24px;font-weight:600;color:${COLORS.ink};">${escapeHtml(block.title)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${items}</table>`;
    }

    case "note":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 8px;">
<tr><td style="padding:14px 18px;background:${COLORS.soft};border-left:3px solid ${COLORS.lavender};border-radius:0 12px 12px 0;font-family:${FONT};font-size:14px;line-height:21px;color:${COLORS.inkMuted};">${escapeHtml(block.text)}</td></tr>
</table>`;
  }
}

function blockToText(block: EmailBlock): string {
  switch (block.kind) {
    case "paragraph":
    case "note":
      return block.text;
    case "facts":
      return block.rows.map(([label, value]) => `${label} : ${value}`).join("\n");
    case "button":
      return `${block.label} : ${block.href}`;
    case "link":
      return `${block.before ? `${block.before} ` : ""}${block.label} : ${block.href}`;
    case "steps":
      return [block.title, ...block.items.map((item, index) => `${index + 1}. ${item}`)].join("\n");
  }
}

export function renderEmail(content: EmailContent, links: EmailLinks): RenderedEmail {
  const body = content.blocks.map(renderBlock).join("\n");
  // Caractères invisibles : la messagerie n'affiche pas le début du corps en aperçu.
  const preheaderPadding = "&#847;&zwnj;&nbsp;".repeat(40);
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(content.subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600&display=swap" rel="stylesheet">
<style>
  @media (max-width: 620px) {
    .mmaiq-pad { padding-left: 24px !important; padding-right: 24px !important; }
    .mmaiq-title { font-size: 26px !important; line-height: 32px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(content.preheader)}${preheaderPadding}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page};">
<tr><td align="center" style="padding:32px 12px 40px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
    <tr>
      <td class="mmaiq-pad" bgcolor="${COLORS.night}" style="padding:26px 40px;border-radius:16px 16px 0 0;background:${COLORS.night};background-image:linear-gradient(135deg,#2C2442 14%,#191625 86%);">
        <a href="${escapeHtml(links.siteUrl)}" style="text-decoration:none;">
          <img src="${escapeHtml(links.logoUrl)}" width="34" height="27" alt="" style="display:inline-block;vertical-align:middle;border:0;">
          <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-family:${FONT};font-size:20px;line-height:28px;font-weight:600;letter-spacing:0.5px;color:#ffffff;">MMA IQ</span>
        </a>
      </td>
    </tr>
    <tr>
      <td class="mmaiq-pad" bgcolor="#ffffff" style="padding:40px 40px 24px;background:#ffffff;">
        <p style="margin:0 0 12px;font-family:${FONT};font-size:13px;line-height:20px;font-weight:600;letter-spacing:1px;color:${COLORS.brand};">${escapeHtml(content.eyebrow)}</p>
        <h1 class="mmaiq-title" style="margin:0 0 20px;font-family:${FONT};font-size:30px;line-height:36px;font-weight:600;letter-spacing:-0.5px;color:${COLORS.ink};">${escapeHtml(content.title)}</h1>
        ${body}
      </td>
    </tr>
    <tr>
      <td class="mmaiq-pad" bgcolor="#ffffff" style="padding:20px 40px 32px;border-top:1px solid ${COLORS.border};border-radius:0 0 16px 16px;background:#ffffff;font-family:${FONT};font-size:13px;line-height:20px;color:${COLORS.inkMuted};">
        Une question ? Réponds simplement à cet e-mail, l'équipe MMA IQ te répond.<br>
        <a href="${escapeHtml(links.manageUrl)}" style="color:${COLORS.inkMuted};text-decoration:underline;">Mon abonnement</a>
        &nbsp;·&nbsp; <a href="${escapeHtml(links.helpUrl)}" style="color:${COLORS.inkMuted};text-decoration:underline;">Aide</a>
        &nbsp;·&nbsp; <a href="${escapeHtml(links.termsUrl)}" style="color:${COLORS.inkMuted};text-decoration:underline;">Conditions générales</a>
      </td>
    </tr>
  </table>
  <p style="margin:16px 0 0;font-family:${FONT};font-size:12px;line-height:18px;color:${COLORS.footer};">MMA IQ APP · SAS au capital de 5 000 € · 173 rue de Courcelles, 75017 Paris</p>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    content.title,
    "",
    ...content.blocks.flatMap((block) => [blockToText(block), ""]),
    "—",
    "Une question ? Réponds simplement à cet e-mail.",
    `Mon abonnement : ${links.manageUrl}`,
    `Aide : ${links.helpUrl}`,
    "MMA IQ APP · 173 rue de Courcelles, 75017 Paris",
  ].join("\n");

  return { subject: content.subject, html, text };
}
