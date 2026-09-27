/**
 * Default set of high-risk domains where Auto Browser denies mutating actions.
 * Curated across financial institutions, government / identity services, and
 * healthcare portals.
 *
 * Precedence note: the blocklist BEATS the user's domainAllowlist (see the
 * precedence ladder in src/safety/permission-manager.js). That's deliberate:
 * an accidental "allow everything" setting, a typo in the allowlist, or a
 * well-meaning rule copied from a blog post must not open up a banking or
 * healthcare portal to the agent. If you genuinely need the agent to drive
 * a listed domain, remove the entry from THIS list — not the allowlist.
 *
 * Ships as a static list (no remote fetch in v1). A later phase may add a
 * signed, versioned update channel.
 */

export const DEFAULT_BLOCKLIST = [
  // Banking & brokerage
  "chase.com",
  "bankofamerica.com",
  "wellsfargo.com",
  "citibank.com",
  "usbank.com",
  "capitalone.com",
  "americanexpress.com",
  "discover.com",
  "fidelity.com",
  "vanguard.com",
  "schwab.com",
  // Payments & wallets
  "paypal.com",
  "venmo.com",
  "cash.app",
  "stripe.com",
  // Crypto exchanges
  "coinbase.com",
  "kraken.com",
  "binance.com",
  // Government & identity
  "irs.gov",
  "ssa.gov",
  "usa.gov",
  "login.gov",
  "healthcare.gov",
  // Healthcare portals
  "mychart.com",
  "mychart.org",
  "kaiserpermanente.org",
  "anthem.com",
  // Password managers
  "1password.com",
  "lastpass.com",
  "bitwarden.com",
];

/**
 * Does `domain` match any pattern in `list`? Match is exact or subdomain
 * suffix — "chase.com" matches "chase.com" and "online.chase.com" but NOT
 * "notchase.com" or "chasematch.com". Case-insensitive.
 */
export function isBlocked(domain, list = DEFAULT_BLOCKLIST) {
  const d = String(domain).toLowerCase();
  for (const pattern of list) {
    const p = String(pattern).toLowerCase();
    if (d === p) return true;
    if (d.endsWith("." + p)) return true;
  }
  return false;
}
