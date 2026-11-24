/**
 * One email address can own several MO Sell accounts (creator and/or brand).
 *
 * Supabase Auth only permits one auth user per email address. Extra accounts
 * use deterministic plus-address aliases internally, while the real email is
 * stored on the profile (`email`) for display and communication.
 *
 *   amara@example.com -> amara@example.com
 *                     -> amara+creator@example.com
 *                     -> amara+brand@example.com
 *                     -> amara+creator2@example.com ...
 *
 * Each login flow only accepts auth users that have a profile in its module,
 * so the same password/email works for both dashboards without ever showing
 * one module's data in the other.
 */

export type AccountModule = 'creator' | 'brand';

export function emailCandidates(email: string, module: AccountModule, limit = 8): string[] {
  const normalized = String(email || '').trim().toLowerCase();
  const at = normalized.lastIndexOf('@');
  if (at <= 0 || at >= normalized.length - 1) return [normalized];

  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  const candidates = [normalized];

  for (let i = 1; i <= limit; i += 1) {
    const tag = `${module}${i > 1 ? i : ''}`;
    candidates.push(`${local}+${tag}@${domain}`);
  }
  return candidates;
}

export function uniqueEmails(emails: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(emails.filter((value): value is string => !!value).map((value) => value.trim().toLowerCase()))
  );
}

type CreateUserResult = {
  data: { user: { id: string } | null };
  error: { code?: string; message?: string } | null;
};

type CreateUserAuth = {
  admin: {
    createUser: (options: {
      email: string;
      password: string;
      email_confirm: boolean;
      user_metadata?: Record<string, unknown>;
    }) => Promise<CreateUserResult>;
  };
};

/**
 * Creates the first free auth identity for this email/module. Supabase rejects
 * duplicate emails with `email_exists`, which is how we walk the alias list
 * without needing any extra schema.
 */
export async function createModuleUser(
  auth: CreateUserAuth,
  options: { email: string; password: string; module: AccountModule; fullName?: string }
): Promise<{ userId: string; authEmail: string }> {
  const candidates = emailCandidates(options.email, options.module, 8);
  let lastError: unknown = null;

  for (const authEmail of candidates) {
    const { data, error } = await auth.admin.createUser({
      email: authEmail,
      password: options.password,
      email_confirm: true,
      user_metadata: { full_name: options.fullName || '' },
    });

    if (!error && data?.user?.id) {
      return { userId: data.user.id, authEmail };
    }

    lastError = error;
    const message = String((error as { message?: string } | null)?.message || '').toLowerCase();
    const exists =
      (error as { code?: string } | null)?.code === 'email_exists' ||
      message.includes('already') ||
      message.includes('registered');
    if (!exists) throw error || new Error('Failed to create account');
  }

  const detail = lastError instanceof Error ? ` (${lastError.message})` : '';
  throw new Error(`No available account email for this address${detail}`);
}

type ListUsersResult = {
  data: { users: Array<{ email?: string | null }> } | null;
  error: unknown;
};

type ListUsersAuth = {
  admin: {
    listUsers: (options?: { page?: number; perPage?: number }) => Promise<ListUsersResult>;
  };
};

/** Returns only the alias emails that actually exist for this real email. */
export async function resolveAuthEmails(
  auth: ListUsersAuth,
  email: string,
  module: AccountModule,
  limit = 8
): Promise<string[]> {
  const candidates = emailCandidates(email, module, limit);
  const existing = new Set<string>();
  const perPage = 1000;

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await auth.admin.listUsers({ page, perPage });
    if (error || !data) break;

    for (const user of data.users || []) {
      const value = String(user.email || '').trim().toLowerCase();
      if (value) existing.add(value);
    }
    if (candidates.every((candidate) => existing.has(candidate))) break;
    if ((data.users || []).length < perPage) break;
  }

  const matches = candidates.filter((candidate) => existing.has(candidate));
  return matches.length ? matches : candidates;
}

/** Client-side lookup used by both login screens and password reset. */
export async function resolveModuleAuthEmails(email: string, module: AccountModule): Promise<string[]> {
  try {
    const response = await fetch(
      `/api/account/resolve?email=${encodeURIComponent(email)}&module=${module}`
    );
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.authEmails) && data.authEmails.length) {
        return data.authEmails as string[];
      }
    }
  } catch {
    // Offline / API hiccup: deterministic aliases are enough to retry.
  }
  return emailCandidates(email, module, 4);
}
