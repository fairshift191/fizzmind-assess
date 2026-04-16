import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Save voice assessment results to Supabase.
 * Creates a student record if none exists, then inserts an assessments row.
 */
export async function saveAssessmentResults({ studentName, email, assessmentState, recommendedCamp, recommendedTrack, summary }) {
  if (!supabaseUrl || !supabaseAnonKey) return { error: 'Supabase not configured' }

  try {
    const cleanEmail = email.toLowerCase().trim()
    const [firstName, ...rest] = (studentName || '').trim().split(' ')
    const lastName = rest.join(' ') || ''

    // Find or create student
    let { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (!student) {
      const { data: created, error: createErr } = await supabase
        .from('students')
        .insert({ first_name: firstName, last_name: lastName, email: cleanEmail })
        .select('id')
        .single()
      if (createErr) { console.error('Student create error:', createErr); return { error: createErr.message } }
      student = created
    }

    const studentId = student.id

    // Find or create application
    let { data: app } = await supabase
      .from('applications')
      .select('id')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!app) {
      const { data: created } = await supabase
        .from('applications')
        .insert({ student_id: studentId, status: 'submitted' })
        .select('id')
        .single()
      app = created
    }

    const applicationId = app?.id ?? null

    // Insert assessment row
    const assessmentRow = {
      student_id: studentId,
      application_id: applicationId,
      type: 'voice',
      completed_at: new Date().toISOString(),
    }

    if (Object.keys(assessmentState || {}).length > 0) {
      assessmentRow.dimensions = assessmentState
      assessmentRow.recommended_camp_id = recommendedCamp?.campId ?? null
      assessmentRow.recommended_track = recommendedTrack?.trackId ?? null
      assessmentRow.summary = summary ?? null
    }

    const { error: insertError } = await supabase.from('assessments').insert(assessmentRow)
    if (insertError) console.error('Assessment save error:', insertError)

    // Update application with assessment data
    if (applicationId) {
      await supabase.from('applications').update({
        assessment_completed: true,
        assessment_date: new Date().toISOString(),
        assessment_scores: assessmentState,
        assessment_summary: summary ?? null,
        recommended_camp: recommendedCamp?.campId ?? null,
        recommended_track: recommendedTrack?.trackId ?? null,
        updated_at: new Date().toISOString(),
      }).eq('id', applicationId)
    }

    // Update student assessment_status
    await supabase.from('students').update({ assessment_status: 'voice_completed' }).eq('id', studentId)

    return { ok: true, studentId }
  } catch (err) {
    console.error('saveAssessmentResults error:', err)
    return { error: err.message }
  }
}

/**
 * Save track-specific test results.
 */
export async function saveTestResults({ studentId, applicationId, testType, results }) {
  if (!supabaseUrl || !supabaseAnonKey) return { error: 'Supabase not configured' }

  try {
    const row = {
      student_id: studentId,
      application_id: applicationId,
      type: testType,
      completed_at: new Date().toISOString(),
    }

    if (results.score !== undefined) {
      row.test_score = results.score ?? 0
      row.test_total = results.total ?? 0
      row.test_percentage = results.percentage ?? 0
      row.test_time_used = results.timeUsed ?? 0
      row.test_attempted = results.attempted ?? 0
      row.test_breakdown = results.breakdown ?? null
    }

    // For arts test: store file URL and description in dimensions
    if (results.fileUrl || results.description) {
      row.dimensions = { fileUrl: results.fileUrl, description: results.description, prompt: results.prompt }
    }

    const { error } = await supabase.from('assessments').insert(row)
    if (error) console.error('Test save error:', error)

    // Update student status
    await supabase.from('students').update({ assessment_status: 'test_completed' }).eq('id', studentId)

    return { ok: true }
  } catch (err) {
    console.error('saveTestResults error:', err)
    return { error: err.message }
  }
}
