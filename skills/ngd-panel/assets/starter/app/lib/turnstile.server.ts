/**
 * Server-side Turnstile verification. The widget alone protects nothing: every token must be
 * checked here. Tokens are single-use and expire after 300 seconds.
 */
export async function verifyTurnstile({
  token,
  secret,
  ip,
}: {
  token: FormDataEntryValue | null;
  secret: string;
  ip?: string;
}): Promise<boolean> {
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) return false;

  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const outcome = (await res.json()) as { success: boolean; action?: string };
    return outcome.success === true && (outcome.action === undefined || outcome.action === 'lead');
  } catch {
    return false;
  }
}
