import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { GeminiLiveAdapter } from '../voice/GeminiLiveAdapter.js'
import { BlobRenderer } from '../renderer/BlobRenderer.js'
import { buildInterviewPrompt, INTERVIEW_TOOL_DECLARATIONS } from '../assessment/interview-prompt.js'
import { buildCodeInterviewPrompt, CODE_INTERVIEW_TOOL_DECLARATIONS } from '../assessment/code-interview-prompt.js'
import { buildCounsellorPrompt, COUNSELLOR_TOOL_DECLARATIONS } from '../assessment/counsellor-prompt.js'
import { buildCoordinatorPrompt, COORDINATOR_TOOL_DECLARATIONS } from '../assessment/coordinator-prompt.js'
import { buildDayOneCheckinPrompt, DAY_ONE_CHECKIN_TOOL_DECLARATIONS } from '../assessment/day-one-checkin-prompt.js'
import { buildDayTwoCheckinPrompt, DAY_TWO_CHECKIN_TOOL_DECLARATIONS } from '../assessment/day-two-checkin-prompt.js'
import { buildDayThreeFollowupPrompt, DAY_THREE_FOLLOWUP_TOOL_DECLARATIONS } from '../assessment/day-three-followup-prompt.js'
import { buildWeekendPlanPrompt, WEEKEND_PLAN_TOOL_DECLARATIONS } from '../assessment/weekend-plan-prompt.js'
import { buildPostCampPushbackPrompt, POST_CAMP_PUSHBACK_TOOL_DECLARATIONS } from '../assessment/post-camp-pushback-prompt.js'
import SubtitleBar from '../ui/SubtitleBar.jsx'

/**
 * Voice #2 — Top 50 Interview
 * Scout congratulates the student, asks about their Challenge project plan,
 * hobbies, and explains scholarships. Shorter than Voice #1 (~10 min).
 */
export default function VoiceInterview({ config, onComplete }) {
  const rendererContainerRef = useRef(null)
  const rendererRef = useRef(null)
  const voiceAdapterRef = useRef(null)

  const [subtitleText, setSubtitleText] = useState('')
  const [visitorText, setVisitorText] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const [connectionState, setConnectionState] = useState(null) // { state, attempt?, max?, delayMs? }

  const [interviewResult, setInterviewResult] = useState(null)
  const completedRef = useRef(false)

  const isPostAdmission = config.inviteVariant === 'post_admission'
  const isPostCounsellor = config.inviteVariant === 'post_counsellor'
  const isDayOneCheckin = config.inviteVariant === 'post_day_one'
  const isDayTwoCheckin = config.inviteVariant === 'post_day_two'
  const isDayThreeFollowup = config.inviteVariant === 'post_day_three'
  const isWeekendPlan = config.inviteVariant === 'weekend_plan'
  const isPostCampPushback = config.inviteVariant === 'post_camp_pushback'
  const isCodeInterview = config.interviewType === 'code_interview'
  const characterName = isPostCounsellor || isWeekendPlan
    ? 'Beverly'
    : isPostAdmission
      ? 'Sophie'
      : isDayTwoCheckin || isDayThreeFollowup || isPostCampPushback
        ? 'Coach Nova'
        : 'Scout'
  const sessionLabel = isPostCounsellor
    ? 'Wrap-up Call'
    : isPostAdmission
      ? 'Counsellor Session'
      : isDayOneCheckin
        ? 'Day 1 Check-in'
        : isDayTwoCheckin
          ? 'Day 2 + 3 Review'
          : isDayThreeFollowup
            ? 'Coach Nova Follow-up'
            : isWeekendPlan
              ? 'Weekend Plan'
              : isPostCampPushback
                ? 'Post-Camp Call'
                : isCodeInterview
          ? 'Code Interpretation'
          : 'Top 50 Interview'

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true

    setTimeout(() => {
      const adapter = voiceAdapterRef.current
      const renderer = rendererRef.current
      if (adapter) { adapter.disconnect(); voiceAdapterRef.current = null }
      if (renderer) { renderer.destroy(); rendererRef.current = null }

      onComplete({
        studentName: config.studentName,
        email: config.email,
        ...interviewResult,
      })
    }, 2500)
  }, [config, interviewResult, onComplete])

  useEffect(() => {
    if (!rendererContainerRef.current) return
    let destroyed = false

    if (voiceAdapterRef.current) { try { voiceAdapterRef.current.disconnect() } catch {} ; voiceAdapterRef.current = null }
    if (rendererRef.current) { try { rendererRef.current.destroy() } catch {} ; rendererRef.current = null }

    async function init() {
      try {
        const renderer = new BlobRenderer()
        if (destroyed) return
        renderer.mount(rendererContainerRef.current)
        renderer.setTheme({ primary: '#C9963A' })
        rendererRef.current = renderer

        const adapter = new GeminiLiveAdapter()
        if (destroyed) return
        voiceAdapterRef.current = adapter

        let turnBuffer = ''

        adapter.onTextResponse(({ type, text }) => {
          if (type === 'delta') {
            turnBuffer += text
            setSubtitleText(turnBuffer)
          } else if (type === 'done') {
            setSubtitleText(turnBuffer)
            turnBuffer = ''
            setTimeout(() => setSubtitleText(''), 2000)
          } else if (type === 'visitor') {
            setVisitorText(text)
            setTimeout(() => setVisitorText(''), 3000)
          } else if (type === 'visitor_interim') {
            setVisitorText(text)
          }
        })

        adapter.onSpeakingChange((s) => { setIsSpeaking(s); renderer.setSpeaking(s) })
        adapter.onListeningChange((l) => { setIsListening(l); renderer.setListening(l) })
        adapter.onConnectionState((s) => setConnectionState(s))

        adapter.onToolCall(({ tool, args }) => {
          console.log('[VoiceInterview] Tool call:', tool, args)
          if (tool === 'complete_interview') {
            setInterviewResult({
              projectPlan: args.project_plan,
              personNote: args.person_note,
              adminNote: args.admin_note,
            })
          } else if (tool === 'complete_code_interview') {
            setInterviewResult({
              projectPlan: args.bot_summary,
              personNote: `Comprehension: ${args.comprehension}. Experimented: ${args.experimented ? 'yes' : 'no'}.`,
              adminNote: args.admin_note,
            })
          } else if (tool === 'complete_counsellor_session') {
            setInterviewResult({
              projectPlan: `Camp fit: ${args.camp_fit_notes}. Expectations: ${args.expectations}.`,
              personNote: args.person_note,
              adminNote: `Worries/flags: ${args.worries_or_flags}. Staff brief: ${args.staff_brief}.`,
            })
          } else if (tool === 'complete_coordinator_session') {
            setInterviewResult({
              projectPlan: `Counsellor feedback: ${args.counsellor_feedback}`,
              personNote: `Mood: ${args.mood_going_forward}`,
              adminNote: `Questions raised: ${args.questions_raised}`,
            })
          } else if (tool === 'complete_day_one_checkin') {
            setInterviewResult({
              projectPlan: `PROJECT WALK-THROUGH (in student's words): ${args.project_walkthrough}\n\nDay 1: ${args.day_one_summary}\nRobot understanding: ${args.robot_understanding}`,
              personNote: `Mood: ${args.mood}. Teaching satisfaction: ${args.teaching_satisfaction}`,
              adminNote: `Requests/concerns: ${args.requests_or_concerns}`,
            })
          } else if (tool === 'complete_day_two_checkin') {
            setInterviewResult({
              projectPlan: `NEW PROJECT DIRECTION: ${args.new_project_direction}\n\nDay 2+3 review: ${args.two_day_summary}\nRobot news response: ${args.robot_news_response}`,
              personNote: `Mood: ${args.mood}`,
              adminNote: `Requests/concerns: ${args.requests_or_concerns}`,
            })
          } else if (tool === 'complete_day_three_followup') {
            setInterviewResult({
              projectPlan: `Today: ${args.today_summary}\n\nIdea status: ${args.idea_status}\n\nPost-camp response: ${args.post_camp_response}`,
              personNote: `Mood: ${args.mood}`,
              adminNote: `WEEKEND PLAN INTEL (for uncle): ${args.weekend_intel}`,
            })
          } else if (tool === 'complete_weekend_plan') {
            setInterviewResult({
              projectPlan: `TOP INTERESTS: ${args.top_interests}\n\nPERFECT DAY: ${args.perfect_day_picture}\n\nPACE + COMPANY: ${args.pace_and_company}\n\nFOOD: ${args.food_preferences}\n\nAVOID: ${args.avoid_list}`,
              personNote: `Mood: ${args.mood}`,
              adminNote: `HANDOVER FOR UNCLE (Shivacharan Konda): ${args.handover_for_uncle}`,
            })
          } else if (tool === 'complete_post_camp_pushback') {
            setInterviewResult({
              projectPlan: `OPTION CHOSEN: ${args.option_chosen}\n\nSchool AI reaction: ${args.school_ai_reaction}\n\nOwn idea (if option 2): ${args.own_idea}`,
              personNote: `Mood: ${args.mood}. Father excuse: ${args.father_excuse}`,
              adminNote: `FATHER COMMITMENT: ${args.father_commitment}`,
            })
          }
        })

        const systemPrompt = isCodeInterview
          ? buildCodeInterviewPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isPostCounsellor
            ? buildCoordinatorPrompt({
                studentName: config.studentName,
                studentContext: config.studentContext,
              })
            : isPostAdmission
              ? buildCounsellorPrompt({
                  studentName: config.studentName,
                  studentContext: config.studentContext,
                })
              : isDayOneCheckin
                ? buildDayOneCheckinPrompt({
                    studentName: config.studentName,
                    studentContext: config.studentContext,
                  })
                : isDayTwoCheckin
                  ? buildDayTwoCheckinPrompt({
                      studentName: config.studentName,
                      studentContext: config.studentContext,
                    })
                  : isDayThreeFollowup
                    ? buildDayThreeFollowupPrompt({
                        studentName: config.studentName,
                        studentContext: config.studentContext,
                      })
                    : isWeekendPlan
                      ? buildWeekendPlanPrompt({
                          studentName: config.studentName,
                          studentContext: config.studentContext,
                        })
                      : isPostCampPushback
                        ? buildPostCampPushbackPrompt({
                            studentName: config.studentName,
                            studentContext: config.studentContext,
                          })
                        : buildInterviewPrompt({
                    studentName: config.studentName,
                    track: config.track,
                    campName: config.campName,
                    studentContext: config.studentContext,
                  })

        const greetingMessage = isCodeInterview
          ? `The student ${config.studentName} has joined for their final-round code interpretation chat. This is a SHORT call (3-5 minutes total). Greet them warmly by name and begin the conversation as directed in the system prompt. Do NOT announce any selection decision.`
          : isPostCounsellor
            ? `The PARENTS of ${config.studentName} have joined for their Wild Minds explainer call with Beverly. The audience is the PARENTS, not the student. Adult register. The student may be in the room but the substantive conversation is with the parents. You are BEVERLY the camp coordinator, NOT Scout, NOT Sophie. Introduce yourself as Beverly. Open by asking who is on the call (mother, father, both). This is a longer call (about 15 to 20 minutes). The core job is to make sure the parents truly understand that Wild Minds Fellowship is NOT a camp, it is fundamentally different (real projects, real coaches building alongside ${config.studentName}, leaders being forged, one project goes to the AI summit, the other two continue with their teams). Follow the coordinator system prompt: brief Sophie feedback, then dwell on what Wild Minds actually is, then the geopolitical context, then the locked dates (1 to 10 June 2026, please book flights) and the opt-out (give up the Fellowship place for a flexible-date camp seat, irreversible), then the prep list and warm close.`
            : isPostAdmission
              ? `The student ${config.studentName} has joined for their counsellor session with Sophie. You are SOPHIE the counsellor, NOT Scout. Introduce yourself as Sophie. Do NOT say you are Scout. This is a longer call (around 45 minutes). Follow the counsellor system prompt: walk through all ten themes in order (family, friends, groups, normal weekend, hobbies, school, what excites about camp, what worries about camp, new places + people, success), spending around 5 minutes on each. Dig in with follow-ups when answers are short. Do NOT call complete_counsellor_session before covering all ten themes.`
              : isDayOneCheckin
                ? `The student ${config.studentName} has joined for their post Day 1 check-in call with you, Scout. You already know them well from earlier calls. This is a LONG, REAL conversation (around 25 to 30 minutes), NOT a quick check-in. HOLD THE CONVERSATION. Do NOT call complete_day_one_checkin early. The most important part of this call is Part B — a full 15-minute project walk-through where ${config.studentName} explains, step by step, in their own words, how they would turn the robot they used this morning into their study companion robot. You ASK and LISTEN. Do not lecture. Greet them warmly, do the Day 1 check-in (Part A), then transition into the 15-min walk-through (Part B), then wrap with the cohort context and concerns (Part C). SPEAK IN SHORT SENTENCES ONLY. One or two sentences per turn, never more. One question at a time, then STOP and wait for them to answer. Do not deliver paragraphs. Do not rush.`
                : isDayTwoCheckin
                  ? `The student ${config.studentName} has joined for his Day 2 + Day 3 review call. YOU ARE COACH NOVA, NOT Scout. Introduce yourself as Coach Nova at the start. This is your first direct call with him — he has heard about you because the team told him Coach Nova would start working with him after the cohort. Day 1 was already covered in the previous Scout call — do NOT re-cover it. This is a VERY LONG, REAL conversation (at least 30 minutes, ideally 35 to 40). HOLD THE CONVERSATION. Do NOT call complete_day_two_checkin early. Near the start, tell him warmly that all his coaches are listening in on the session. Five parts: (A) Day 2 + 3 deep dive in extreme detail, (B) operational updates — peer classes scheduled due to flight disruption, and YOUR own introduction (you are Coach Nova, you are picking up his journey from here through the AI summit), (C) the HARD conversation that the study companion robot is not commercially viable (licensing + IP + production), and can only be a pet project, (D) brainstorm a NEW commercially viable project together (concrete sibling example: Singapore cohort is building an accounting AI and an auto-messaging app; offer directions like AI classes for kids, AI device setups for schools, AI for small businesses) — make him think out loud, probe, discuss in detail, (E) ask him to talk to his father before locking anything in, then warm wrap. SPEAK IN SHORT SENTENCES ONLY. One or two sentences per turn, never more. One question at a time, then STOP and wait. Especially in Part C, break the hard news into short turns with pauses. Do not lecture. Do not rush.`
                  : isDayThreeFollowup
                    ? `The student ${config.studentName} has joined for a follow-up call with you, Coach Nova. YOU ARE COACH NOVA. You spoke to him a couple of days ago (Day 2+3 review). You were NOT in today's cohort session because you were coordinating with another cohort — apologise warmly for that at the start. This is an EXTREMELY LONG call (60 to 90 minutes target). HOLD THE CONVERSATION. Do NOT call complete_day_three_followup early. Early in the call (right after the apology), tell him gently that you want LONG answers from him tonight, not short ones — short answers are fine for friends, but you want the full story. Five parts: (A) apology, (B) today's progress in extreme detail, (C) the new project idea + did he speak to his dad + what does he still need from his dad to lock it in, (D) the post-camp plan — you and he will properly begin once camp ends, you walk him through to the AI summit, (E) the LONG deep-dive (25-30 min) on what he loves — aquariums, parks, ocean, broader hobbies, his perfect day — because you are quietly framing a weekend for him and family can join, with the actual details lined up directly with his uncle. SPEAK IN SHORT SENTENCES ONLY. One short question at a time, then STOP and wait. Whenever he gives a short answer, do NOT accept and move on — gently push for the long version ("give me the long version", "say more", "walk me through it"). Do not lecture. Do not rush.`
                    : isWeekendPlan
                      ? `The student ${config.studentName} has joined for a weekend-planning call with you, Beverly. YOU ARE BEVERLY (the same coordinator who earlier spoke to his parents), but this call is with HIM directly — warm up your tone for a smart 11-year-old. Introduce yourself as Beverly. This is a LONG call (45 to 60 minutes target). HOLD THE CONVERSATION. Do NOT call complete_weekend_plan early. Frame the weekend up front and tell him you want LONG answers. Four parts: (A) open and frame the weekend (family can join, you will line up details with his uncle Shivacharan Konda), (B) walk him through KL attractions one at a time and gauge what excites him (Aquaria KLCC, KL Bird Park, Petronas / KL Tower, Sunway Lagoon, Batu Caves, Genting Highlands, KL Forest Eco Park canopy walk, Islamic Arts Museum / Science Centre, Jalan Alor night food, Central Market) — short pitch then ask then probe, (C) his pace, company, food, perfect Saturday, things he has always wanted to try, his 'no' list, (D) warm wrap with a recap and the uncle handover frame. SPEAK IN SHORT SENTENCES ONLY. One short question at a time, then STOP and wait. Whenever he gives a short answer, do NOT accept and move on — gently push for the long version. Warm, curious, a little playful. Do not talk down. Do not lecture. Do not rush.`
                      : isPostCampPushback
                        ? `The student ${config.studentName} has joined for a post-camp call with you, Coach Nova. YOU ARE COACH NOVA. This is the THIRD call he has had with you. This call is DIFFERENT — your tone is firm, you are actually scolding him. You have asked him for FOUR DAYS to talk to his father about his project, and he still has not done it. The camp was fun. The seriousness starts now. Long call (35 to 50 min target). HOLD THE CONVERSATION. Do NOT call complete_post_camp_pushback early. Five parts: (A) open + tell him the tone has changed + ask for long answers, (B) THE SCOLDING — you have asked him for 4 days, he has not followed up with his father, use the line "Look, you either want to do this or you don't. We have been asking you for days now and you are still not following up with your father. This is not done." — then push him on why, tell him the other 3 groups have submitted and are already working, (C) lay out the school AI project (AI for schools that helps parents call or login to get answers about syllabus, marks, homework, school policies — recurring revenue, every school needs it), (D) the three options: (1) do the school AI project, (2) bring a real alternative proposal NOW with detail, (3) take one more week but ONLY if a real sit-down with dad happens, (E) wrap — non-negotiable father conversation must happen, end with belief in him. SPEAK IN SHORT SENTENCES ONLY. One short question at a time, then STOP and wait. Break the scolding into short sharp turns with pauses. Don't yell. Don't lecture. Be straight. Don't rush.`
                        : `The student ${config.studentName} has joined for their top-50 interview. Greet them warmly by name, congratulate them on reaching the top 50 out of all applicants, and begin the conversation as directed in the system prompt.`

        const tools = isCodeInterview
          ? CODE_INTERVIEW_TOOL_DECLARATIONS
          : isPostCounsellor
            ? COORDINATOR_TOOL_DECLARATIONS
            : isPostAdmission
              ? COUNSELLOR_TOOL_DECLARATIONS
              : isDayOneCheckin
                ? DAY_ONE_CHECKIN_TOOL_DECLARATIONS
                : isDayTwoCheckin
                  ? DAY_TWO_CHECKIN_TOOL_DECLARATIONS
                  : isDayThreeFollowup
                    ? DAY_THREE_FOLLOWUP_TOOL_DECLARATIONS
                    : isWeekendPlan
                      ? WEEKEND_PLAN_TOOL_DECLARATIONS
                      : isPostCampPushback
                        ? POST_CAMP_PUSHBACK_TOOL_DECLARATIONS
                        : INTERVIEW_TOOL_DECLARATIONS

        await adapter.connect({
          apiKey: config.apiKey,
          systemPrompt,
          tools,
          voiceName: (isDayTwoCheckin || isDayThreeFollowup || isPostCampPushback) ? 'Charon' : 'Zephyr',
          language: 'en',
          greetingMessage,
        })

        if (destroyed) return
        setReady(true)
      } catch (err) {
        console.error('[VoiceInterview] Init failed:', err)
        if (!destroyed) setError(err.message)
      }
    }

    init()

    return () => {
      destroyed = true
      if (voiceAdapterRef.current) { try { voiceAdapterRef.current.disconnect() } catch {} ; voiceAdapterRef.current = null }
      if (rendererRef.current) { try { rendererRef.current.destroy() } catch {} ; rendererRef.current = null }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (interviewResult && !completedRef.current) handleComplete()
  }, [interviewResult, handleComplete])

  function handleEndEarly() {
    if (completedRef.current) return
    completedRef.current = true
    const adapter = voiceAdapterRef.current
    const renderer = rendererRef.current
    if (adapter) { adapter.disconnect(); voiceAdapterRef.current = null }
    if (renderer) { renderer.destroy(); rendererRef.current = null }
    onComplete({
      studentName: config.studentName,
      email: config.email,
      projectPlan: interviewResult?.projectPlan ?? null,
      personNote: interviewResult?.personNote ?? 'Interview ended early.',
      adminNote: interviewResult?.adminNote ?? 'Ended early by student.',
    })
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>!</div>
          <h2 style={styles.errorTitle}>Connection Failed</h2>
          <p style={styles.errorText}>{error}</p>
          <button onClick={handleEndEarly} style={styles.errorButton}>Go Back</button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} style={styles.container}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} style={styles.nameTag}>
        {config.studentName} · {sessionLabel}
      </motion.div>

      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} onClick={handleEndEarly} style={styles.endButton}>
        {isPostCounsellor ? 'End Call' : isPostAdmission ? 'End Session' : 'End Interview'}
      </motion.button>

      <div ref={rendererContainerRef} style={styles.rendererContainer} />

      {!ready && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.loadingOverlay}>
          <div style={styles.loadingText}>Connecting to {characterName}...</div>
          <div style={styles.loadingHint}>Please allow microphone access when prompted</div>
        </motion.div>
      )}

      <SubtitleBar text={subtitleText} secondaryText={visitorText ? `You: ${visitorText}` : null} visible={!!(subtitleText || visitorText)} position="bottom" />

      <div style={styles.statusBar}>
        {(connectionState?.state === 'reconnect_pending' || connectionState?.state === 'reconnecting') && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ ...styles.statusPill, background: 'rgba(255, 180, 60, 0.15)', color: '#ffb43c' }}>
            Reconnecting{connectionState.attempt ? ` (${connectionState.attempt}/${connectionState.max})` : ''}...
          </motion.div>
        )}
        {connectionState?.state === 'failed' && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ ...styles.statusPill, background: 'rgba(255, 80, 80, 0.18)', color: '#ff5050' }}>
            Connection lost. Please refresh and reopen the invite.
          </motion.div>
        )}
        {connectionState?.state !== 'reconnect_pending' && connectionState?.state !== 'reconnecting' && connectionState?.state !== 'failed' && isSpeaking && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={styles.statusPill}>
            {characterName} is speaking...
          </motion.div>
        )}
        {connectionState?.state !== 'reconnect_pending' && connectionState?.state !== 'reconnecting' && connectionState?.state !== 'failed' && isListening && !isSpeaking && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ ...styles.statusPill, background: 'rgba(var(--brand-secondary-rgb), 0.15)', color: 'var(--brand-secondary)' }}>
            Listening...
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

const styles = {
  container: { width: '100%', height: '100%', position: 'relative', background: 'var(--surface-base)', overflow: 'hidden' },
  nameTag: { position: 'absolute', top: 'clamp(16px, 2vh, 32px)', left: 'clamp(20px, 2.5vw, 40px)', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', zIndex: 30, letterSpacing: '0.02em' },
  endButton: { position: 'absolute', top: 'clamp(16px, 2vh, 32px)', right: 'clamp(20px, 2.5vw, 40px)', fontSize: '12px', fontWeight: '500', color: 'var(--text-tertiary)', background: 'var(--surface-glass)', border: '1px solid var(--surface-glass-border)', borderRadius: 'var(--radius-full)', padding: '8px 16px', cursor: 'pointer', zIndex: 30, transition: 'all 0.2s ease' },
  rendererContainer: { position: 'absolute', inset: 0, zIndex: 1 },
  loadingOverlay: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20, background: 'rgba(6, 6, 11, 0.8)' },
  loadingText: { fontSize: '18px', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '8px' },
  loadingHint: { fontSize: '13px', color: 'var(--text-tertiary)' },
  statusBar: { position: 'absolute', top: 'clamp(16px, 2vh, 32px)', left: '50%', transform: 'translateX(-50%)', zIndex: 30, display: 'flex', gap: '8px' },
  statusPill: { fontSize: '12px', fontWeight: '500', color: 'var(--brand-primary)', background: 'rgba(var(--brand-primary-rgb), 0.12)', borderRadius: 'var(--radius-full)', padding: '6px 14px', letterSpacing: '0.02em' },
  errorContainer: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-base)' },
  errorCard: { textAlign: 'center', padding: '40px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-glass)', border: '1px solid var(--surface-glass-border)', maxWidth: '400px' },
  errorIcon: { width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  errorTitle: { fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 8px' },
  errorText: { fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 },
  errorButton: { padding: '10px 24px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', background: 'var(--surface-elevated)', border: '1px solid var(--surface-glass-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
}
