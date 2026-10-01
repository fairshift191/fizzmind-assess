import { supabase } from './supabase.js'

/**
 * Verify an invite code. Returns the invite + student data if valid.
 */
export async function verifyInvite(code) {
  if (!code) return { valid: false, reason: 'No invite code provided' }

  const { data: invite, error } = await supabase
    .from('invites')
    .select(`
      id, type, track, code, status, expires_at, metadata,
      students:student_id(id, first_name, last_name, email)
    `)
    .eq('code', code.trim())
    .maybeSingle()

  if (error || !invite) return { valid: false, reason: 'Invalid invite code' }
  // ⚠ A USED invite is still valid until it expires.
  //
  // These are mentoring calls, not one-shot exam tokens. A call that drops in
  // the first minute used to leave the student locked out with a dead link and
  // no way back in, which has now happened twice: once when the connection
  // went before he had spoken, and once when a test click burned a fresh link.
  // Rejoining a conversation you were already invited to is not a security
  // boundary; the expiry date is.
  if (new Date(invite.expires_at) < new Date()) return { valid: false, reason: 'This invite has expired' }

  return {
    valid: true,
    invite: {
      id: invite.id,
      type: invite.type,
      track: invite.track,
      code: invite.code,
      metadata: invite.metadata ?? {},
    },
    student: invite.students,
  }
}

/**
 * What happened on the latest call on this invite: whether the microphone
 * reached Nova, how often she spoke, and how it ended.
 * ⚠ On 30 Sept a call "disconnected" and nothing had been recorded, so the
 * cause could only be guessed. This is kept on the invite, overwritten each
 * time, so the next one can be read instead of guessed.
 */
export async function recordCall(code, metadata, lastCall) {
  if (!code) return
  const { error } = await supabase
    .from('invites')
    .update({ metadata: { ...(metadata ?? {}), last_call: lastCall } })
    .eq('code', code.trim())
  if (error) console.warn('recordCall error:', error.message)
}

/**
 * The same record, sent as the page closes. A normal request is cancelled
 * when the tab goes away; `keepalive` lets it finish, so a call that ends with
 * a closed tab still says so.
 */
export function recordCallOnClose(code, metadata, lastCall) {
  if (!code) return
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  try {
    fetch(`${url}/rest/v1/invites?code=eq.${encodeURIComponent(code.trim())}`, {
      method: 'PATCH',
      keepalive: true,
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ metadata: { ...(metadata ?? {}), last_call: lastCall } }),
    })
  } catch {}
}

/**
 * Mark an invite as used.
 */
export async function markInviteUsed(code) {
  // Records the FIRST time it was opened and leaves it alone after, so the
  // used_at timestamp stays the moment the call actually started.
  const { error } = await supabase
    .from('invites')
    .update({ status: 'used', used_at: new Date().toISOString() })
    .eq('code', code.trim())
    .is('used_at', null)

  if (error) console.error('markInviteUsed error:', error)
  return !error
}
