import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle2, Loader2 } from 'lucide-react';
import { submitLead } from '../lib/supabase';
import { getReferral, normalizeRefCode, saveReferral } from '../lib/referral';
import { buildWaitlistMessage, type WaitlistInterest } from '../lib/waitlist';

const SUCCESS_EVENT = 'mmaiq:waitlist-success';

interface WaitlistFormProps {
  interest?: WaitlistInterest;
  id?: string;
  className?: string;
  onSuccess?: () => void;
}

export function WaitlistForm({ interest = 'app', id, className = '', onSuccess }: WaitlistFormProps) {
  const generatedId = useId();
  const formId = id ?? `waitlist-${generatedId}`;
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(() =>
    normalizeRefCode(new URLSearchParams(window.location.search).get('ref')) ?? getReferral()?.code ?? ''
  );
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const focusSuccess = useRef(false);
  const successRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const academy = interest === 'academy';

  useEffect(() => {
    const handleSuccess = (event: Event) => {
      if ((event as CustomEvent<WaitlistInterest>).detail === interest) {
        setStatus('success');
        onSuccess?.();
      }
    };
    window.addEventListener(SUCCESS_EVENT, handleSuccess);
    return () => window.removeEventListener(SUCCESS_EVENT, handleSuccess);
  }, [interest, onSuccess]);

  useEffect(() => {
    if (status === 'success' && focusSuccess.current) successRef.current?.focus();
    if (status === 'error') errorRef.current?.focus();
  }, [status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current || status === 'success') return;
    const referralCode = normalizeRefCode(code);
    if (code.trim() && !referralCode) {
      codeRef.current?.setCustomValidity('Le code salle doit contenir entre 3 et 14 lettres ou chiffres.');
      codeRef.current?.reportValidity();
      return;
    }
    submitting.current = true;
    setStatus('loading');
    setError('');
    try {
      await submitLead({
        type: 'waitlist',
        email: email.trim(),
        message: buildWaitlistMessage(interest, new URL(window.location.href)),
        ...(referralCode ? { referral_code: referralCode } : {}),
      });
      if (referralCode) saveReferral(referralCode);
      focusSuccess.current = true;
      setEmail('');
      window.dispatchEvent(new CustomEvent(SUCCESS_EVENT, { detail: interest }));
    } catch {
      setError("L'inscription n'a pas abouti. Ton adresse est conservée : tu peux réessayer.");
      setStatus('error');
    } finally {
      submitting.current = false;
    }
  };

  return (
    <div id={formId} data-waitlist-form={interest} className={`scroll-mt-28 text-left ${className}`}>
      {status === 'success' ? (
        <div ref={successRef} tabIndex={-1} role="status" className="flex gap-3 rounded-2xl border border-[var(--color-violet-300)]/30 bg-[var(--color-accent-primary)]/10 p-5">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[var(--color-violet-300)]" aria-hidden="true" />
          <div>
            <p className="font-semibold text-white">Ton inscription est enregistrée.</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {academy ? 'Nous te préviendrons par email lorsque les premières formations seront disponibles.' : "Nous te préviendrons par email lorsque l'application sera disponible."}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} aria-label={academy ? 'Être prévenu des premières formations' : "Être prévenu du lancement de l'application"} aria-busy={status === 'loading'}>
          <label htmlFor={`${formId}-email`} className="mb-2 block text-sm font-medium text-white">Ton adresse email</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input id={`${formId}-email`} name="email" type="email" autoComplete="email" inputMode="email" required maxLength={254}
              value={email} onChange={event => setEmail(event.target.value)} placeholder="toi@exemple.fr" readOnly={status === 'loading'}
              aria-describedby={`${formId}-privacy${error ? ` ${formId}-error` : ''}`}
              className="min-h-14 min-w-0 flex-1 rounded-xl border border-white/20 bg-[var(--color-bg-surface)] px-4 text-base text-white placeholder:text-white/50 focus:border-[var(--color-violet-300)]" />
            <button type="submit" disabled={status === 'loading'} className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent-primary)] px-5 text-base font-bold text-white transition-colors hover:bg-[var(--color-violet-600)] disabled:cursor-wait disabled:opacity-70">
              {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Bell className="h-4 w-4" aria-hidden="true" />}
              {status === 'loading' ? 'Inscription…' : 'Me prévenir'}
            </button>
          </div>
          {error && <p id={`${formId}-error`} ref={errorRef} role="alert" tabIndex={-1} className="mt-3 text-sm leading-relaxed text-[var(--color-semantic-error)]">{error}</p>}
          {!academy && (
            <details className="mt-3 text-sm" open={code ? true : undefined}>
              <summary className="w-fit cursor-pointer py-2 text-[var(--color-text-secondary)] hover:text-white">J'ai un code salle <span className="text-xs">(facultatif)</span></summary>
              <label htmlFor={`${formId}-code`} className="mt-2 mb-2 block text-sm text-white">Code de ta salle</label>
              <input ref={codeRef} id={`${formId}-code`} type="text" name="referral_code" maxLength={24} autoComplete="off" value={code} readOnly={status === 'loading'}
                onChange={event => { event.target.setCustomValidity(''); setCode(event.target.value.toUpperCase()); }}
                placeholder="Ex. GRACIELYON" className="min-h-12 w-full rounded-xl border border-white/20 bg-[var(--color-bg-surface)] px-4 text-base text-white placeholder:text-white/50 sm:max-w-xs" />
            </details>
          )}
          <p id={`${formId}-privacy`} className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Inscription gratuite, sans compte. {academy ? 'Un email à la sortie des premières formations.' : "Un email au lancement de l'app."}{' '}
            <Link to="/confidentialite" className="underline underline-offset-4 hover:text-white">Confidentialité</Link>
          </p>
        </form>
      )}
    </div>
  );
}
