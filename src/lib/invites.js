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
  if (invite.status !== 'pending') return { valid: false, reason: 'This invite has already been used' }
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
 * Mark an invite as used.
 */
export async function markInviteUsed(code) {
  const { error } = await supabase
    .from('invites')
    .update({ status: 'used', used_at: new Date().toISOString() })
    .eq('code', code.trim())

  if (error) console.error('markInviteUsed error:', error)
  return !error
}
