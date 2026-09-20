/**
 * Shared between proxy.ts (edge middleware) and the auth API routes (Node
 * runtime) so both sides agree on the cookie name/lifetime without proxy.ts
 * needing to be imported into a Node-only route (or vice versa).
 */
export const SESSION_COOKIE = "la_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
