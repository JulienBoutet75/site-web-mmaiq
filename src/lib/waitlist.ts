export type WaitlistInterest = 'app' | 'academy';

export function getWaitlistInterest(message?: string | null): WaitlistInterest {
  return message?.startsWith('Intérêt : Academy') ? 'academy' : 'app';
}

// La colonne message existe déjà : aucune migration nécessaire pour distinguer
// les deux listes et retrouver la provenance dans l'administration et l'export.
export function buildWaitlistMessage(interest: WaitlistInterest, url: URL): string {
  const lines = [
    `Intérêt : ${interest === 'academy' ? 'Academy' : 'Application'}`,
    `Page : ${url.pathname}`,
  ];
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    const value = url.searchParams.get(key)?.replace(/[\r\n]/g, ' ').slice(0, 150);
    if (value) lines.push(`${key} : ${value}`);
  }
  return lines.join('\n');
}
