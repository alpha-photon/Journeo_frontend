// Anonymous user identity — UUID stored in localStorage.
// Persists across sessions. Survives page refresh. Lost only on clear storage.
//
// For auth-aware code, prefer `effectiveUserId` from AuthContext — it returns
// the account id when logged in and falls back to this UUID for guests.

export function getUserId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem('iteranary_uid');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('iteranary_uid', id);
  }
  return id;
}
