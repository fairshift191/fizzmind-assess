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
