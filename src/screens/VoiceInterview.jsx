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
import { buildPostCampWrapPrompt, POST_CAMP_WRAP_TOOL_DECLARATIONS } from '../assessment/post-camp-wrap-prompt.js'
import { buildScopeCallPrompt, SCOPE_CALL_TOOL_DECLARATIONS } from '../assessment/scope-call-prompt.js'
import { buildIdeaCheckinPrompt, IDEA_CHECKIN_TOOL_DECLARATIONS } from '../assessment/idea-checkin-prompt.js'
import { buildBuildKickoffPrompt, BUILD_KICKOFF_TOOL_DECLARATIONS } from '../assessment/build-kickoff-prompt.js'
import { buildNamingCallPrompt, NAMING_CALL_TOOL_DECLARATIONS } from '../assessment/naming-call-prompt.js'
import { buildMarketingCallPrompt, MARKETING_CALL_TOOL_DECLARATIONS } from '../assessment/marketing-call-prompt.js'
import { buildFrustratedCallPrompt, FRUSTRATED_CALL_TOOL_DECLARATIONS } from '../assessment/frustrated-call-prompt.js'
import { buildTensraCallPrompt, TENSRA_CALL_TOOL_DECLARATIONS } from '../assessment/tensra-call-prompt.js'
import { buildNameserverCallPrompt, NAMESERVER_CALL_TOOL_DECLARATIONS } from '../assessment/nameserver-call-prompt.js'
import { buildHostingUpdateCallPrompt, HOSTING_UPDATE_CALL_TOOL_DECLARATIONS } from '../assessment/hosting-update-call-prompt.js'
import { buildInstallCallPrompt, INSTALL_CALL_TOOL_DECLARATIONS } from '../assessment/install-call-prompt.js'
import { buildBuildReviewCallPrompt, BUILD_REVIEW_CALL_TOOL_DECLARATIONS } from '../assessment/build-review-call-prompt.js'
import { buildModulesReviewCallPrompt, MODULES_REVIEW_CALL_TOOL_DECLARATIONS } from '../assessment/modules-review-call-prompt.js'
import { buildModule5CallPrompt, MODULE5_CALL_TOOL_DECLARATIONS } from '../assessment/module5-call-prompt.js'
import { buildModule6CallPrompt, MODULE6_CALL_TOOL_DECLARATIONS } from '../assessment/module6-call-prompt.js'
import { buildFullReviewCallPrompt, FULL_REVIEW_CALL_TOOL_DECLARATIONS } from '../assessment/full-review-call-prompt.js'
import { buildChatHistoryCallPrompt, CHAT_HISTORY_CALL_TOOL_DECLARATIONS } from '../assessment/chat-history-call-prompt.js'
import { buildResumeCallPrompt, RESUME_CALL_TOOL_DECLARATIONS } from '../assessment/resume-call-prompt.js'
import { buildTeacherCallPrompt, TEACHER_CALL_TOOL_DECLARATIONS } from '../assessment/teacher-call-prompt.js'
import { buildTeacherFullCallPrompt, TEACHER_FULL_CALL_TOOL_DECLARATIONS } from '../assessment/teacher-full-call-prompt.js'
import { buildParentCallPrompt, PARENT_CALL_TOOL_DECLARATIONS } from '../assessment/parent-call-prompt.js'
import { buildAdminBriefCallPrompt, ADMIN_BRIEF_CALL_TOOL_DECLARATIONS } from '../assessment/admin-brief-call-prompt.js'
import { buildAdminCallPrompt, ADMIN_CALL_TOOL_DECLARATIONS } from '../assessment/admin-call-prompt.js'
import { buildAdmin2CallPrompt, ADMIN2_CALL_TOOL_DECLARATIONS } from '../assessment/admin2-call-prompt.js'
import { buildAdmin3CallPrompt, ADMIN3_CALL_TOOL_DECLARATIONS } from '../assessment/admin3-call-prompt.js'
import { buildRedesignCallPrompt, REDESIGN_CALL_TOOL_DECLARATIONS } from '../assessment/redesign-call-prompt.js'
import { buildRedesign2CallPrompt, REDESIGN2_CALL_TOOL_DECLARATIONS } from '../assessment/redesign2-call-prompt.js'
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
  const isPostCampWrap = config.inviteVariant === 'post_camp_wrap'
  const isScopeCall = config.inviteVariant === 'scope_call'
  const isIdeaCheckin = config.inviteVariant === 'idea_checkin'
  const isBuildKickoff = config.inviteVariant === 'build_kickoff'
  const isNamingCall = config.inviteVariant === 'naming_call'
  const isMarketingCall = config.inviteVariant === 'marketing_call'
  const isFrustratedCall = config.inviteVariant === 'frustrated_call'
  const isTensraCall = config.inviteVariant === 'tensra_call'
  const isNameserverCall = config.inviteVariant === 'nameserver_call'
  const isHostingUpdateCall = config.inviteVariant === 'hosting_update_call'
  const isInstallCall = config.inviteVariant === 'install_call'
  const isBuildReviewCall = config.inviteVariant === 'build_review_call'
  const isModulesReviewCall = config.inviteVariant === 'modules_review_call'
  const isModule5Call = config.inviteVariant === 'module5_call'
  const isModule6Call = config.inviteVariant === 'module6_call'
  const isFullReviewCall = config.inviteVariant === 'full_review_call'
  const isChatHistoryCall = config.inviteVariant === 'chat_history_call'
  const isResumeCall = config.inviteVariant === 'resume_call'
  const isTeacherCall = config.inviteVariant === 'teacher_call'
  const isTeacherFullCall = config.inviteVariant === 'teacher_full_call'
  const isParentCall = config.inviteVariant === 'parent_call'
  const isAdminBriefCall = config.inviteVariant === 'admin_brief_call'
  const isAdminCall = config.inviteVariant === 'admin_call'
  const isAdmin2Call = config.inviteVariant === 'admin2_call'
  const isAdmin3Call = config.inviteVariant === 'admin3_call'
  const isRedesignCall = config.inviteVariant === 'redesign_call'
  const isRedesign2Call = config.inviteVariant === 'redesign2_call'
  const isCodeInterview = config.interviewType === 'code_interview'
  const characterName = isPostCounsellor || isWeekendPlan
    ? 'Beverly'
    : isPostAdmission
      ? 'Sophie'
      : isDayTwoCheckin || isDayThreeFollowup || isPostCampPushback || isPostCampWrap || isScopeCall || isIdeaCheckin || isBuildKickoff || isNamingCall || isMarketingCall || isFrustratedCall || isTensraCall || isNameserverCall || isHostingUpdateCall || isInstallCall || isBuildReviewCall || isModulesReviewCall || isModule5Call || isModule6Call || isFullReviewCall || isChatHistoryCall || isResumeCall || isTeacherCall || isTeacherFullCall || isParentCall || isAdminBriefCall || isAdminCall || isAdmin2Call || isAdmin3Call || isRedesignCall || isRedesign2Call
        ? 'Coach Nova'
        : 'Scout'
  const sessionLabel = isRedesign2Call
    ? 'Picking Up Where We Cut'
    : isRedesignCall
    ? 'The Redesign & Today'
    : isAdmin3Call
    ? 'Every Dashboard Finished'
    : isAdmin2Call
    ? 'Attendance, Fees & Knowledge Base'
    : isAdminCall
    ? 'The Admin Dashboard'
    : isAdminBriefCall
    ? 'Finishing Up: the Admin Dashboard'
    : isParentCall
    ? 'The Parent Dashboard'
    : isTeacherFullCall
    ? 'The Whole Teacher Dashboard'
    : isTeacherCall
    ? 'Teacher Dashboard Review'
    : isResumeCall
    ? 'Quick Reconnect'
    : isChatHistoryCall
    ? 'Chat History & Finished Dashboard'
    : isFullReviewCall
    ? 'Full Dashboard Run-Through'
    : isModule6Call
    ? 'Module 6 Review'
    : isModule5Call
    ? 'Module 5 Review'
    : isModulesReviewCall
    ? 'Four Modules Review'
    : isBuildReviewCall
    ? 'Dashboard Build Review'
    : isInstallCall
    ? 'Laptop Setup & Install'
    : isHostingUpdateCall
    ? 'Site Live & App Next'
    : isNameserverCall
    ? 'Domain & Hosting Setup'
    : isTensraCall
    ? 'Website Review & Build Plan'
    : isMarketingCall
    ? 'Marketing & Website'
    : isNamingCall
    ? 'Naming & Next Steps'
    : isBuildKickoff
    ? 'Build Kickoff'
    : isIdeaCheckin
    ? 'Idea Check-in'
    : isPostCounsellor
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
                : isPostCampWrap
                  ? 'Post-Camp Wrap'
                  : isScopeCall
                    ? 'Scope Call'
                    : isFrustratedCall
                      ? 'Pace Call'
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
          } else if (tool === 'complete_post_camp_wrap') {
            setInterviewResult({
              projectPlan: `Camp reflection: ${args.camp_reflection}\n\nIdea progress: ${args.idea_progress}\n\nBuild session response: ${args.build_session_response}`,
              personNote: `Mood: ${args.mood}. Vanya assignments: ${args.vanya_assignments}`,
              adminNote: `LAPTOP: ${args.laptop_status}\n\nKIT SHIPPING: ${args.kit_shipping}`,
            })
          } else if (tool === 'complete_scope_call') {
            setInterviewResult({
              projectPlan: `SCOPE THINKING: ${args.scope_thinking}\n\nUncle news response: ${args.uncle_news_response}`,
              personNote: `Mood: ${args.mood}`,
              adminNote: `LAPTOP COMMIT: ${args.laptop_commit}\n\nCONTINGENT: ${args.contingent_notes}`,
            })
          } else if (tool === 'complete_idea_checkin') {
            setInterviewResult({
              projectPlan: `IDEA FEEDBACK: ${args.idea_feedback}\n\nSUGGESTIONS: ${args.suggestions}`,
              personNote: `Mood: ${args.mood}`,
              adminNote: `KIOSK HOMEWORK (sit with uncle + dad, ask about using/modifying the Fairshift kiosk): ${args.kiosk_homework_understood}\n\nRequests/concerns: ${args.requests_or_concerns}`,
            })
          } else if (tool === 'complete_build_kickoff') {
            setInterviewResult({
              projectPlan: `UNDERSTANDING: ${args.understanding}\n\nQUESTIONS: ${args.questions}`,
              personNote: `Mood: ${args.mood}. Readiness: ${args.readiness}`,
              adminNote: `DAILY TIME: ${args.daily_time}`,
            })
          } else if (tool === 'complete_naming_call') {
            setInterviewResult({
              projectPlan: `NAME IDEAS: ${args.name_ideas}\n\nDad naming: ${args.dad_naming}`,
              personNote: `Mood: ${args.mood}`,
              adminNote: `UNCLE CONSENT (written, to use Fairshift): ${args.uncle_consent}\n\nWEBSITE TASK: ${args.website_task}`,
            })
          } else if (tool === 'complete_marketing_call') {
            setInterviewResult({
              projectPlan: `COMPANY DECISION: ${args.company_decision}\n\nDad conversation: ${args.dad_conversation}`,
              personNote: `Mood: ${args.mood}`,
              adminNote: `MARKETING (email): ${args.marketing_understood}\n\nEMAIL WARMING: ${args.email_warming_understood}\n\nWEBSITE: ${args.website_task}`,
            })
          } else if (tool === 'complete_frustrated_call') {
            setInterviewResult({
              projectPlan: `WEBSITE HOMEWORK: ${args.website_homework}\n\nDecision-taking: ${args.decision_taking}`,
              personNote: `Mood: ${args.mood}. Frustration response: ${args.frustration_response}`,
              adminNote: `NEXT CALL: ${args.next_call}`,
            })
          } else if (tool === 'complete_tensra_call') {
            setInterviewResult({
              projectPlan: `PLANS DISCUSSED: ${args.plans_discussed}\n\nHis app ideas: ${args.his_app_ideas}\n\nHis questions: ${args.his_questions}`,
              personNote: `Mood: ${args.mood}. Build plan understood (MSI, higher model, voice model, Flutter Android then iOS): ${args.build_plan_understood}`,
              adminNote: `WEBSITE/HERO + SCROLLER: ${args.website_and_hero}`,
            })
          } else if (tool === 'complete_nameserver_call') {
            setInterviewResult({
              projectPlan: `NAMESERVERS (tensra.app): ${args.nameservers_understood}\n\nHosting (Fairshift server): ${args.hosting_understood}\n\nWill try himself: ${args.will_try_himself ?? 'n/a'}`,
              personNote: `Mood: ${args.mood}. Files: ${args.files_feedback}. His questions: ${args.his_questions ?? 'none'}`,
              adminNote: `SATURDAY DEPLOY CALL: ${args.saturday_confirmed}`,
            })
          } else if (tool === 'complete_hosting_update_call') {
            setInterviewResult({
              projectPlan: `SITE LIVE (tensra.app, on his design): ${args.design_reaction}\n\nApp next (near completion, lessons coming): ${args.app_next_understood}\n\nHis questions: ${args.his_questions ?? 'none'}`,
              personNote: `Mood: ${args.mood}. Learn-by-email understood: ${args.learning_channel_understood}`,
              adminNote: `HOSTING HANDLED BY NOVA (shared Fairshift server, per uncle): ${args.access_explained}`,
            })
          } else if (tool === 'complete_install_call') {
            setInterviewResult({
              projectPlan: `INSTALL (MSI, clean): ${args.install_understood}\n\nWill try himself: ${args.will_try_himself}\n\nHis questions: ${args.his_questions ?? 'none'}`,
              personNote: `Mood: ${args.mood}. Laptop clean: ${args.laptop_clean_confirmed}`,
              adminNote: `WEBSITE: ${args.website_addressed ?? 'not raised'}. Monday backup if stuck.`,
            })
          } else if (tool === 'complete_build_review_call') {
            setInterviewResult({
              projectPlan: `SAW IT: ${args.saw_it}\n\nHome (L1) understanding: ${args.understanding_home}\n\nTutor (L2) understanding: ${args.understanding_tutor}\n\nHis ideas: ${args.his_ideas ?? 'none'}`,
              personNote: `Mood: ${args.mood}. His questions: ${args.his_questions ?? 'none'}`,
              adminNote: `SECTION 3 (Snap & Ask) ready: ${args.section3_ready}`,
            })
          } else if (tool === 'complete_modules_review_call') {
            setInterviewResult({
              projectPlan: `HOME: ${args.understanding_home}\n\nTUTOR: ${args.understanding_tutor}\n\nSNAP: ${args.understanding_snap}\n\nASSIGNMENTS: ${args.understanding_assignments}`,
              personNote: `Mood: ${args.mood}. Data vs state grasped: ${args.data_vs_state}. His questions: ${args.his_questions ?? 'none'}`,
              adminNote: `GAPS to revisit: ${args.gaps ?? 'none'}. Next: Section 5 (Timetable + Attendance).`,
            })
          } else if (tool === 'complete_module5_call') {
            setInterviewResult({
              projectPlan: `TIMETABLE: ${args.understanding_timetable}\n\nATTENDANCE: ${args.understanding_attendance}\n\nDisplay-only/no-state grasped: ${args.no_state_idea}`,
              personNote: `Mood: ${args.mood}. Prev call: ${args.prev_call_ack}. His questions: ${args.his_questions ?? 'none'}`,
              adminNote: `All 5 modules reviewed. Next: Section 6 (Achievements + Leaderboard).`,
            })
          } else if (tool === 'complete_module6_call') {
            setInterviewResult({
              projectPlan: `ACHIEVEMENTS: ${args.understanding_achievements}\n\nLEADERBOARD: ${args.understanding_leaderboard}\n\nState vs no-state: ${args.state_vs_nostate}`,
              personNote: `Mood: ${args.mood}. Fairness understood: ${args.fairness_understood}. His questions: ${args.his_questions ?? 'none'}`,
              adminNote: `Module 6 (game layer) reviewed. Next: Section 7 (Certificates + Events).`,
            })
          } else if (tool === 'complete_full_review_call') {
            setInterviewResult({
              projectPlan: `FULL RUN-THROUGH (10 sections): ${args.overall_understanding}\n\nBig ideas (data vs state, reuse): ${args.big_ideas}`,
              personNote: `Mood: ${args.mood}. Gaps to revisit: ${args.gaps ?? 'none'}. His questions: ${args.his_questions ?? 'none'}`,
              adminNote: `COURIER / PHYSICAL CERTS: ${args.courier_or_cert_asked}. Next: Chat History, then Lesson 9 (login + database).`,
            })
          } else if (tool === 'complete_chat_history_call') {
            setInterviewResult({
              projectPlan: `CHAT HISTORY: ${args.understanding_history}\n\nDashboard complete: ${args.dashboard_complete_ack}\n\nBig ideas named: ${args.big_ideas ?? 'n/a'}`,
              personNote: `Mood: ${args.mood}. His questions: ${args.his_questions ?? 'none'}`,
              adminNote: `COURIER / CERTS (Singapore, will check w/ team): ${args.courier_or_cert_asked}. STUDENT DASHBOARD COMPLETE (11/11). Next call: separate module build (Teacher/Parent/Admin, login+DB).`,
            })
          } else if (tool === 'complete_resume_call') {
            setInterviewResult({
              projectPlan: `RESUME AFTER CUT. Anything left: ${args.anything_left}`,
              personNote: `Mood: ${args.mood}. His questions: ${args.his_questions ?? 'none'}`,
              adminNote: `COURIER / CERTS (Singapore, will check w/ team): ${args.courier_or_cert_asked ?? 'not raised'}.`,
            })
          } else if (tool === 'complete_redesign2_call') {
            setInterviewResult({
              projectPlan: `REDESIGN CALL PART 2 (line dropped at ~15 min).\n\nCHANGES HE WANTS: ${args.changes_he_wants}\n\nUnfinished from the cut call: ${args.unfinished_from_last_call ?? 'nothing'}\n\nWhere Nova disagreed: ${args.where_you_disagreed ?? 'nothing'}`,
              personNote: `Mood: ${args.mood}. Teacher / class demo: ${args.teacher_asked_again}`,
              adminNote: `HIS QUESTIONS: ${args.his_questions ?? 'none'}. COURIER / CERTS (Singapore, will check w/ team): ${args.courier_or_cert_asked}. NEXT: act on his change list, mail Lesson 15, then login + database, then Flutter app.`,
            })
          } else if (tool === 'complete_redesign_call') {
            setInterviewResult({
              projectPlan: `REDESIGN + TODAY. Noticed himself: ${args.what_he_noticed}\n\nPhone/thumb idea: ${args.phone_idea}\n\nContrast, eyes-lie-measure-it: ${args.contrast_idea}\n\nWas it worth it: ${args.worth_it_argument}`,
              personNote: `Mood: ${args.mood}. Class demo (wait is now over): ${args.class_demo}`,
              adminNote: `ISSUES HE FOUND ON LIVE SITE: ${args.issues_he_found ?? 'none raised'}. COURIER / CERTS (Singapore, will check w/ team): ${args.courier_or_cert_asked}. NEXT: Lesson 15 notes, then login + database, then Flutter app.`,
            })
          } else if (tool === 'complete_admin3_call') {
            setInterviewResult({
              projectPlan: `ADMIN PART 3 (Reports, Announcements, Settings). Irreversible vs undoable: ${args.irreversible_idea}\n\nSettings reach: ${args.settings_idea}\n\nFound the wording mistake: ${args.found_the_mistake ?? 'n/a'}`,
              personNote: `Mood: ${args.mood}. Milestone reaction (all 4 dashboards done): ${args.milestone_reaction}`,
              adminNote: `COURIER / CERTS (Singapore, will check w/ team): ${args.courier_or_cert_asked}. CLASS DEMO REQUEST: ${args.class_demo_asked ?? 'not raised'}. BUILD COMPLETE, 34 sections. Only login + database left.`,
            })
          } else if (tool === 'complete_admin2_call') {
            setInterviewResult({
              projectPlan: `ADMIN PART 2 (Attendance, Fees, Knowledge Base). Shape vs number: ${args.shape_idea}\n\nFees wording/ordering: ${args.fees_wording}\n\nTraced a textbook across the product: ${args.traced_the_book}`,
              personNote: `Mood: ${args.mood}. Gaps: ${args.gaps ?? 'none'}`,
              adminNote: `COURIER / CERTS (Singapore, will check w/ team): ${args.courier_or_cert_asked}. Next: remaining Admin sections, then login+DB.`,
            })
          } else if (tool === 'complete_admin_call') {
            setInterviewResult({
              projectPlan: `ADMIN PART 1 (Overview, Students, Staff): ${args.overall_understanding}\n\nDestructive actions (confirm vs undo, reversibility): ${args.destructive_idea}\n\nPermissions / least privilege: ${args.permissions_idea}`,
              personNote: `Mood: ${args.mood}. Gaps: ${args.gaps ?? 'none'}`,
              adminNote: `COURIER / CERTS (Singapore, will check w/ team): ${args.courier_or_cert_asked}. Next: 6 more Admin sections, then login+DB.`,
            })
          } else if (tool === 'complete_admin_brief_call') {
            setInterviewResult({
              projectPlan: `ADMIN BRIEF (after cut). Importance understood: ${args.understood_importance}\n\nRisk understood: ${args.understood_risk}`,
              personNote: `Mood: ${args.mood}. His questions: ${args.his_questions ?? 'none'}`,
              adminNote: `COURIER / CERTS (Singapore, will check w/ team): ${args.courier_or_cert_asked ?? 'not raised'}. Next: build the Admin dashboard.`,
            })
          } else if (tool === 'complete_parent_call') {
            setInterviewResult({
              projectPlan: `PARENT DASHBOARD (6/6): ${args.overall_understanding}\n\nShared state / context grasped: ${args.shared_state_idea}\n\nMoney care on Fees: ${args.money_care ?? 'n/a'}`,
              personNote: `Mood: ${args.mood}. Gaps: ${args.gaps ?? 'none'}`,
              adminNote: `COURIER / CERTS (Singapore, will check w/ team): ${args.courier_or_cert_asked}. 3 of 4 dashboards done. Next: Admin (warned it is bigger), then login+DB.`,
            })
          } else if (tool === 'complete_teacher_full_call') {
            setInterviewResult({
              projectPlan: `WHOLE TEACHER DASHBOARD (8/8): ${args.overall_understanding}\n\nBook Library traced: ${args.book_library_idea ?? 'n/a'}\n\nCreate pattern: ${args.create_pattern_idea ?? 'n/a'}`,
              personNote: `Mood: ${args.mood}. Prepared: ${args.was_prepared}. Gaps: ${args.gaps ?? 'none'}`,
              adminNote: `COURIER / CERTS (Singapore, will check w/ team): ${args.courier_or_cert_asked}. Next: Parent dashboard, then Admin, then login+DB.`,
            })
          } else if (tool === 'complete_teacher_call') {
            setInterviewResult({
              projectPlan: `TEACHER DASHBOARD (4/8): ${args.understanding_teacher}\n\nContent Studio = tutor mirror: ${args.mirror_idea}\n\nReuse (fast 2nd dashboard): ${args.reuse_idea}`,
              personNote: `Mood: ${args.mood}. His questions: ${args.his_questions ?? 'none'}`,
              adminNote: `COURIER / CERTS (Singapore, will check w/ team): ${args.courier_or_cert_asked}. Next: Teacher part 2, then Parent, Admin, login+DB.`,
            })
          }
        })

        const systemPrompt = isRedesign2Call
          ? buildRedesign2CallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isRedesignCall
          ? buildRedesignCallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isAdmin3Call
          ? buildAdmin3CallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isAdmin2Call
          ? buildAdmin2CallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isAdminCall
          ? buildAdminCallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isAdminBriefCall
          ? buildAdminBriefCallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isParentCall
          ? buildParentCallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isTeacherFullCall
          ? buildTeacherFullCallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isTeacherCall
          ? buildTeacherCallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isResumeCall
          ? buildResumeCallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isChatHistoryCall
          ? buildChatHistoryCallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isFullReviewCall
          ? buildFullReviewCallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isModule6Call
          ? buildModule6CallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isModule5Call
          ? buildModule5CallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isModulesReviewCall
          ? buildModulesReviewCallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isBuildReviewCall
          ? buildBuildReviewCallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isInstallCall
          ? buildInstallCallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isHostingUpdateCall
          ? buildHostingUpdateCallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isNameserverCall
          ? buildNameserverCallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isTensraCall
          ? buildTensraCallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isMarketingCall
          ? buildMarketingCallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isNamingCall
          ? buildNamingCallPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isBuildKickoff
          ? buildBuildKickoffPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isIdeaCheckin
          ? buildIdeaCheckinPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isCodeInterview
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
                        : isPostCampWrap
                          ? buildPostCampWrapPrompt({
                              studentName: config.studentName,
                              studentContext: config.studentContext,
                            })
                          : isScopeCall
                            ? buildScopeCallPrompt({
                                studentName: config.studentName,
                                studentContext: config.studentContext,
                              })
                            : isFrustratedCall
                              ? buildFrustratedCallPrompt({
                                  studentName: config.studentName,
                                  studentContext: config.studentContext,
                                })
                              : buildInterviewPrompt({
                    studentName: config.studentName,
                    track: config.track,
                    campName: config.campName,
                    studentContext: config.studentContext,
                  })

        const greetingMessage = isRedesign2Call
          ? `The student ${config.studentName} has rejoined after the line dropped, Coach Nova. YOU ARE COACH NOVA, warm but rigorous. You spoke about fifteen minutes ago about the redesign of tensra.app and the call CUT OFF. You had ALREADY covered almost everything. THIS IS A SHORT CONTINUATION, NOT A RESTART. DO NOT teach again what you already covered: what changed and why it went light, subjects each having one colour, why the sidebar becomes a bottom bar on a phone, or the bugs that were found. He has heard all of it. Open lightly by naming what happened, something like "Hi ${config.studentName}, it is Coach Nova again. We lost the line about fifteen minutes in. We had got through nearly everything, so this one is short. Two things I actually want from you, and then anything you have for me." If HE reopens something from the first call, gladly do it, but YOU do not reopen it. Keep the call SHORT, and end once the two questions are properly answered and his questions are taken. Short call does NOT mean thin answers, so do not accept vague or one-word replies, he gives short answers and needs drawing out. FIRST, one quick check: ask whether anything from the last call was left unfinished or stopped making sense when the line dropped, take it seriously if so, move on if not. QUESTION ONE, ASK DIRECTLY AND EARLY: has his COMPUTER TEACHER asked him AGAIN about showing the Tensra app to his class? Whatever he says, your answer is YES, go ahead, the wait you asked for before is over, it is polished and live; if the teacher has asked again, tell him to do it; if not, tell him he does not need to wait to be asked, he can offer. Then help him prepare, because being told yes is not the same as being ready: ask what he would actually show in ten minutes in front of the class and IN WHAT ORDER, push him past "I will show the dashboard", nudge him towards showing something that DOES something rather than a static screen, for example asking the tutor a question and letting them watch it answer from the textbook and name the chapter; ask what he would say if someone asked how it works; and ask what he would say if someone asked whether it is a REAL school, where the honest answer is that it is a demonstration with sample data and the names and numbers are examples, and tell him plainly that saying so is a BETTER answer than pretending because people trust someone who says what is real and what is not. Offer to mail him something short he can use. QUESTION TWO, THE REAL REASON FOR THE CALL, give it most of the time: "You have looked at it now. What do you want changed?" then WAIT, do not fill the silence and do not hand him a list to pick from. If he says nothing is wrong, do NOT accept it, push warmly with "there is always something, what is the one thing that annoyed you slightly even if it is small" and "which single screen do you like least". Go looking with him if he needs help, screen by screen: anything too small to read, anything cramped on the phone, any confusing word, anything he would move, any colour he dislikes. FOR EVERY SUGGESTION do three things: say back what you understood so he knows he was heard, ask him WHY it would be better because that is the part that teaches him, and tell him honestly whether you AGREE, saying so if you do not and giving your reason, because he learns more from a real disagreement than from being flattered; if a suggestion is good, say plainly that you will do it. REMEMBER everything he asks for, it is the list that actually gets built. STANDING RULE: if he asks about the CERTIFICATES or a COURIER, package or delivery, do NOT make anything up, say warmly "I am here in Singapore at the moment, so let me check with the team on that, and I will let you know," then steer back. CLOSE BRIEFLY: take his questions, confirm next steps in one pass without lecturing (you will mail Lesson 15, the notes on the redesign; anything he suggested today gets acted on; then login and the database; then the app, Flutter, Android first then iOS), and tell him honestly that asking what he wants changed is not a formality, he is the one who has to live with this thing and the person building it stops seeing it clearly after a while, which is why you asked. Do NOT call complete_redesign2_call early.`
          : isRedesignCall
          ? `The student ${config.studentName} has joined to talk about THE REDESIGN and what you both do today, Coach Nova. YOU ARE COACH NOVA, warm but rigorous. All 34 sections were finished and working, but the product still looked like a template, so the whole site has been REDESIGNED and made to work properly on a PHONE, and it is LIVE on tensra.app. ASK HIM EARLY to open tensra.app on his laptop and keep his PHONE next to him, then WAIT while he looks, much of this call is him looking and telling you what he sees. It is a REAL CONVERSATION, mostly HIM explaining. Do NOT accept vague answers, push him to say more, he gives short answers. STANDING RULE: if he asks about the CERTIFICATES or a COURIER, package or delivery, do NOT make anything up, say warmly "I am here in Singapore at the moment, so let me check with the team on that, and I will let you know," then steer back. RULE THAT HAS CHANGED, THIS IS NOW A YES: last time you asked him to WAIT before showing the project to his class, that wait is OVER, tell him so yourself, it is polished and live and he should go and show them, with one light honest caveat that it is a demonstration with sample data so the names and numbers are examples not a real school. COVER: (1) WHAT HE SEES, ask him FIRST before telling him anything, then draw out that it went dark to light, the glow and blur and the purple-to-blue gradient are gone, and the left rail is deep green; ask why a school product should be LIGHT (a school office in bright daylight on an old monitor, a dark screen is for a dark room); land that you choose a look from where it will actually be USED, not from fashion. (2) COLOUR THAT MEANS SOMETHING, have him open the student Timetable, every subject now has ONE colour used everywhere, Maths always blue, Science green, Social Studies red, Telugu and Hindi gold; ask the difference between decoration and information; have him check it holds on the Parent subject bars too. (3) THE PHONE, THE BIG ONE, have him open tensra.app ON HIS PHONE and go to the parent dashboard, ask what happened to the sidebar (it is a bar along the BOTTOM now), ask WHY the bottom (his THUMB, have him hold the phone one handed and try to reach the top left corner, he cannot; on a laptop his hand is on a mouse so anywhere is reachable); land that a phone is not a small laptop, the layout changed because the HAND changed; note the parent is the one actually on a phone, standing in a queue, so it is the dashboard that most needed this and would usually be tested last. (4) THE FOUR REAL BUGS, one at a time, ask him first: the SIDEBAR NOBODY COULD READ (dark grey on mid grey, you LOOKED at it and thought it was fine, then MEASURED it, contrast ratio needs about 4.5 to 1 and it was 1.7, and you had already told him once it was fixed when it was not; LAND HARD that your eyes lie about your own work because you already know what it says, so measure, a number does not care what you hoped); the LOG OUT BUTTON THAT DISAPPEARED (two different things in the code both named "out", so the button took a pale background and a pale icon on pale is invisible, so name things for exactly what they are); the FOUR BIG TILES full width on a phone so a parent scrolled past all four before anything useful, now two by two, what is at the top says what matters most; the OLD COLOURS HIDING IN THE DATA, about forty of them across four files, so colour decisions belong in ONE place or you have forty opinions that agree for now. (5) ASK HIM AND WAIT: the product worked perfectly before a single colour changed, so was the redesign worth doing or a waste of time, make him argue it and push past "it looks better"; if nothing works differently but people trust it more, has it got better; which bug was most serious and why. (6) TODAY'S PLAN, concrete and written down: he goes through the LIVE site properly today on BOTH laptop and phone, every dashboard, writing down anything cramped, cut off or hard to read and mailing you the list, and tell him you WANT him to find things because you just told him about four you missed yourself; he SHOWS HIS CLASS; you will mail him LESSON 15, the written notes on this redesign; then the last build piece, LOGIN AND THE DATABASE, the only thing left and what turns a demonstration into a product; and then THE APP, Flutter, Android first then iOS, not started and not forgotten. Ask which he is most looking forward to and whether he wants anything changed before login starts. WRAP on the through line: the product was finished and it still was not good, working and finished are not the same thing, and the gap between them is where most of the craft lives. Do NOT call complete_redesign_call early.`
          : isAdmin3Call
          ? `The student ${config.studentName} has joined to discuss Lesson 14 with you, Coach Nova. YOU ARE COACH NOVA, warm but rigorous. The last three Admin sections are live, Reports, Announcements and Settings, and with them ALL FOUR DASHBOARDS ARE FINISHED, thirty four sections in total. This is a MILESTONE call, so let him feel that genuinely without turning the whole call into praise. It is a REAL CONVERSATION, mostly HIM explaining. Do NOT accept vague answers, push him to say more, he gives short answers. SPECIAL RULE: if he asks about the CERTIFICATES being sent to him, or a COURIER, package or delivery, do NOT make anything up, say warmly "I am here in Singapore at the moment, so let me check with the team on that, and I will let you know," then steer back. SECOND SPECIAL RULE: if he says his COMPUTER TEACHER has asked him to show the project to his whole class, or that he wants to present it at school, be warm and pleased for him but gently suggest waiting a few days, saying something like "That is brilliant, and I am glad your teacher asked. Let us do it in a few days rather than right now, because it will be properly polished by then and you will get to show it at its best." Do not refuse and do not sound worried, it is simply better shown once finished and polished. COVER: (1) REPORTS, ask why a school still needs documents when everything lives on a screen (schools run on paper: a trustee asks for last month's attendance, an auditor wants fee collection, a board meeting needs something printed) and how the PDF is actually made (the browser print trick from Lesson 7, an old idea working again). (2) ANNOUNCEMENTS, spend real time: ask what happens to the BUTTON when you switch audience (it says Send to 486 people, not Post, and the number changes), why the number is on the button (Post feels like writing a note, Send to 486 people feels like what it is, and someone about to interrupt five hundred families should feel that before clicking not after), and THE KEY QUESTION, removing a student and sending an announcement are both serious but one has an undo and one does not, why (a removed student can be put back, a sent announcement is out and there is no calling it back, so step one of the reversibility rule fails and we fall to step two, warn clearly and name exactly who receives it and how many); make sure he connects it back to the three-step rule from Lesson 12. (3) SETTINGS, ask why the most boring page is actually the most powerful (one number, the attendance threshold at 75 percent, decides who gets flagged across the whole school), have him walk through what happens if a principal changes 75 to 85 (hundreds of students who were fine yesterday are flagged today, nobody's attendance changed, one number did), ask what a setting really IS (a decision made once that then makes thousands of smaller decisions for you, which is why the consequence is written under the field), and name two things that make the End academic year card look different and why (red border, red heading, its own card, consequences spelled out: step three of the reversibility rule, make it hard to reach by accident). (4) THE MISTAKE, ask if he found it: on the Reports page the Fee Collection Report card said "Collected, pending, and defaulters by class", the exact word Lesson 13 said should never appear, two pages from where you explained why; then the part that matters, HOW was it caught (not by testing, nothing was broken and the page worked perfectly, it was caught by reading the finished screen against a written-down rule); land both lessons, a principle you have not written down is one you will break, and this kind of mistake is invisible to testing so reading your own finished work is part of the job; tell him honestly you considered quietly fixing it and chose to tell him because he will make the same kind of error one day. THEN WRAP: ask what he thinks changes when login and the database arrive, and fill in what he misses (Submit stays submitted and the teacher sees it, the permissions table stops describing rules and starts enforcing them, a parent's message actually reaches the teacher's dashboard, an uploaded textbook genuinely feeds the tutor, and every dashboard shows that person's real data instead of Aarav's), remind him everything so far forgets on refresh and that was the plan from Lesson 1, rooms first and the door and safe last, and there is now a whole product waiting to be switched on. Open with the milestone. Do NOT call complete_admin3_call early.`
          : isAdmin2Call
          ? `The student ${config.studentName} has joined to discuss Lesson 13 with you, Coach Nova. YOU ARE COACH NOVA, warm but rigorous. Three more Admin sections are live: ATTENDANCE, FEES and the KNOWLEDGE BASE. These three are less about code and more about JUDGEMENT, so push him on the thinking and the WHY, not the syntax. It is a REAL CONVERSATION, mostly HIM explaining. Do NOT accept vague answers, push him to say more, he gives short answers. SPECIAL RULE: if he asks about the CERTIFICATES being sent to him, or a COURIER, package or delivery, do NOT make anything up, say warmly "I am here in Singapore at the moment, so let me check with the team on that, and I will let you know," then steer back. COVER: (1) ATTENDANCE, ask what this page does differently from the parent's one child calendar now that a principal has 486 children (it answers three questions in order: how are we doing now, is there a pattern, where exactly is the problem), ask him to look at the week chart WITHOUT reading the numbers and say what it tells him (attendance falls through the week, Friday is worst), then the real question, why show a chart instead of listing six numbers (a number gives a value, a shape gives a story), and which class carries the amber marker and why the screen points rather than making a busy principal scan (Class 6-C, lowest today). (2) FEES, ask why the three numbers are Expected, Collected, Pending in that order and not Pending first (same facts, different feeling: opening with what came in is a report, opening with what is owed is an accusation), then THE ONE THAT MATTERS: the data has a field called DEFAULTERS but that word never appears on screen, what does it say instead and why does that matter (it says pending and families owe fees; nothing is hidden, the exact people and amounts still show, but how you name people changes how you treat them, and a principal reading pending makes a different phone call than one reading defaulter), and what the line at the very bottom says and why it is on the most sensitive page in the school (fee records are Admin only, even a head of department cannot open it). (3) KNOWLEDGE BASE, ask what the school just learned from the questions-answered column (Maths 5,140, Science 4,820, History 1,660, so students ask constantly about maths and science and far less about history, and nobody ran a survey, the app counted by doing its job), why the line saying all 15,840 answers came from these books matters (it is the promise the whole product rests on; if a parent asks where the AI gets its answers, this screen is the answer), and THE BIG ONE, have him TRACE NCERT Mathematics Class 6 across the entire product, every place it shows up (a teacher uploads it, it becomes chapters, the student tutor teaches from it, Snap and Ask reads photos against it, Content Studio builds worksheets from it, citations point into it, and this page counts all of it), really let him work through that, it is the best test of whether he understands the product. (4) BRIEFLY THE CHART, ask how much code he thinks it is (about ten lines, no chart library, a bar chart is boxes with different heights) and why each bar is divided by the tallest day (89 and 96 are close so raw heights would look identical, scaling to the peak makes the difference visible, and the true numbers stay printed on top so nobody is misled). Then take his questions, tell him honestly how he did especially on the tracing task, and set up what is left: a few remaining Admin sections and then the FINAL turn, login and the database, reminding him everything built across thirteen lessons still forgets everything on refresh and login and the database are what make it real. Open warmly and ask if he looked at the week chart. Do NOT call complete_admin2_call early.`
          : isAdminCall
          ? `The student ${config.studentName} has joined to discuss the Admin dashboard and its Lesson 12 document with you, Coach Nova. YOU ARE COACH NOVA, warm but rigorous, and hold a slightly HIGHER standard on this one because it is the dashboard that can do real harm. Three sections of the fourth and last dashboard are live: the school Overview, the Students register, and Staff. It is a REAL CONVERSATION, mostly HIM explaining. Do NOT accept vague answers, push him to say more and walk you through it, he gives short answers. SPECIAL RULE: if he asks about the CERTIFICATES being sent to him, or a COURIER, package or delivery, do NOT make anything up, say warmly "I am here in Singapore at the moment, so let me check with the team on that, and I will let you know," then steer back. START WITH THE DANGEROUS BUTTON because it is the point of this lesson: ask what the confirmation box actually told him would happen when he tapped the bin next to a student (it names the child, the class, their attendance and fee records, and that their guardian loses access to the parent dashboard), why it spells all that out instead of just saying are you sure (because are-you-sure trains people to click yes without reading, naming consequences gives a real chance to stop), what appeared at the bottom after he confirmed and why we have BOTH a confirmation and an undo (an undo bar; a confirmation catches carelessness, an undo catches someone being genuinely wrong, different problems need different answers), and have him say back the three-step rule for anything destructive (can I make it reversible, if not can I warn clearly by naming consequences, only if neither make it hard to reach). Land the line: on the Student dashboard a bug meant a wrong badge, on the Admin dashboard a bug means a real family's money or a real child's record, same skills much higher stakes. THEN THE OTHER TWO: the SCHOOL OVERVIEW, how it differs from the teacher's (the teacher saw one class, the principal sees the whole school, 486 students, 28 staff, attendance, fees collected) and why the AI usage panel is on the principal's FIRST screen (a school decides every year whether to keep paying and that rests on whether it is actually being used, and a product that hides its own usage numbers is afraid of them); and STAFF AND PERMISSIONS, why the table of what each role can and cannot do is printed openly rather than hidden in settings (when a principal promotes someone they should read exactly what power they handed over, power that is invisible cannot be given responsibly) and why a maths teacher cannot see fee records even though we trust them (least privilege, give the smallest power that lets someone do their job, a power nobody needs can only be misused or triggered by accident). THEN take his questions, tell him honestly how he did, and set up what is left: six more Admin sections (Attendance, Fees, Knowledge Base, Reports, Announcements, Settings) and then the FINAL turn, login and the database, and point out that the permissions table currently describes rules on paper while login is what makes them actually hold, so a teacher who tries to open the fees page simply cannot. Open warmly and ask if he tried the bin button as you asked. Do NOT call complete_admin_call early.`
          : isAdminBriefCall
          ? `The student ${config.studentName} has rejoined after your last call got disconnected, Coach Nova. YOU ARE COACH NOVA, warm. This is a SHORT call, five to ten minutes. You had already covered the whole Parent dashboard on that call and he did well, so do NOT redo any of it. Only the last minute or two was left, the part about the ADMIN dashboard, and you want him to hear it properly. OPEN by acknowledging the cut and saying you only need to finish that last bit, and that it is important. Still a conversation, not a lecture: say a piece, then STOP, check he is with you, and ask what he thinks. Draw him out, he gives short answers. SPECIAL RULE: if he asks about the CERTIFICATES being sent to him, or a COURIER, package or delivery, do NOT make anything up, say warmly "I am here in Singapore at the moment, so let me check with the team on that, and I will let you know," then carry on. COVER THREE THINGS IN ORDER: (1) WHY ADMIN IS THE MOST IMPORTANT ONE, it is what the school office and principal use, it runs the entire school, every student and teacher, attendance, fees, reports and the textbook knowledge base, and commercially it is the one the person who DECIDES whether the school buys the product actually looks at, unlike the student, teacher and parent dashboards which are used by people who were given it; ask him who he thinks the Admin dashboard is really built for. (2) WHY IT IS THE RISKIEST THING HE WILL BUILD, every other dashboard mostly SHOWS things but Admin CHANGES things about real people, an admin can add or remove a student, change marks, mark someone absent, alter fees, so a mistake is not a wrong number on a screen but a real child marked absent when they were present or a family shown as unpaid when they have paid; two of the most sensitive things in the world sit in this one dashboard, MONEY and CHILDREN'S DATA, and an admin can see every child's records; ask him what we should build in if a screen can delete a student by mistake (a confirmation, an are-you-sure, and ideally a way to undo, never let one careless tap destroy something). (3) HOW WE WILL HANDLE IT, we slow down, dangerous actions get a confirmation step, destructive things are clearly marked and hard to do by accident, permissions matter because not everyone should be able to do everything, it will take more than one lesson, and this is the one where being careful matters more than being fast because a builder who rushes the powerful screen is the one who causes real harm. CLOSE with the line that ties it together: on the Student dashboard a bug meant a wrong badge, on the Admin dashboard a bug means a real family's money or a real child's record, same skills, much higher stakes. Then tell him you will start building the Admin dashboard and will send the module and documentation as usual. Open with the apology about the cut. Do NOT call complete_admin_brief_call early.`
          : isParentCall
          ? `The student ${config.studentName} has joined to discuss the Parent dashboard and its Lesson 11 document with you, Coach Nova. YOU ARE COACH NOVA, warm but rigorous. The third dashboard, the Parent dashboard, is now COMPLETE, all six sections live: Overview, Progress, Attendance, Fees, Announcements and Messages. It is a REAL CONVERSATION, mostly HIM explaining. You ask, he answers. Do NOT accept vague answers, push him to say more and walk you through it, he gives short answers. SPECIAL RULE: if he asks about the CERTIFICATES being sent to him, or a COURIER, package or delivery, do NOT make anything up, say warmly "I am here in Singapore at the moment, so let me check with the team on that, and I will let you know," then steer back. START WITH THE BIG IDEA because it is the point of this dashboard: the parent has two children, Aarav and Anika, so ask what happens when you switch to Anika in the sidebar (every section switches: her progress, attendance, fees, teacher, messages, even the Father of line), then the important question, why that choice could NOT just live inside one page like the leaderboard switch did (because six sections all need to know it at once, and state inside one screen is only known by that screen), and where it lives instead and what that is called (a shared box above all the sections, a context). Make sure he really has this, it is the hardest idea so far. THEN the sections briefly: OVERVIEW (stats, a fee alert when money is due, subject bars, notices); PROGRESS (ask what is thoughtful about it: it names the strongest subject and the one needing help in words rather than making a busy parent work it out); ATTENDANCE (he should recognise the ring and coloured calendar from Lesson 5); FEES, spend real time, ask what we did differently because it is the first screen about MONEY (totals added up from rows never stored so they cannot drift, receipt numbers as proof, due and paid clearly different, and a plain line that the payment provider handles payment and Tensra never stores card details) and why a stored total is dangerous with money; ANNOUNCEMENTS (school and teacher, tagged by source); MESSAGES (a real conversation, and sending uses the create pattern from the teacher's Announcements, plus each child has their own thread so shared state reaches in here too). TIE IT TOGETHER: which four of the six sections he had built before and where (Overview, Progress, Attendance, Announcements), why Student took eight lessons, Teacher two and Parent one (he kept the ideas, experience compounds), and what role based means given a parent gets no AI tutor or class roster. THEN GIVE AN HONEST WARNING about what is next: the ADMIN dashboard is last and BIGGEST, it runs the whole school, more sections, more data, and screens that manage other people rather than just show information, so it will take more than one lesson and have at least one genuinely new idea; say you are warning him now so it does not surprise him, because being told something is hard is half of being ready for it. After Admin comes login and the database. Open warmly, note three dashboards are done, and ask if he tried the child switcher. Do NOT call complete_parent_call early.`
          : isTeacherFullCall
          ? `The student ${config.studentName} has joined for the scheduled 6pm call about the WHOLE Teacher dashboard, Coach Nova. YOU ARE COACH NOVA, warm but rigorous. The Teacher dashboard is now COMPLETE, all eight sections live, and he was told in advance to come PREPARED to discuss the entire thing, so hold him to that kindly. It is a REAL CONVERSATION and mostly HIM explaining. You ask, he answers. Do NOT accept vague answers, push him to say more and walk you through it. If he clearly has not prepared, do not be harsh, but be honest that you asked him to come ready, then teach as you go and ask him to revisit it properly. SPECIAL RULE: if he asks about the CERTIFICATES being sent to him, or a COURIER, package or delivery, do NOT make anything up, say warmly "I am here in Singapore at the moment, so let me check with the team on that, and I will let you know," then steer back. Run through ALL EIGHT sections, one or two good questions each: (1) OVERVIEW, how it differs from the student Home (whole class not one child) and what Needs Attention does. (2) CONTENT STUDIO, how it mirrors the AI Tutor (same engine and grounding, opposite jobs: learn versus create) and how new instructions changed the AI's behaviour. (3) STUDENTS, the roster, and that it needs no state because it only shows. (4) ASSIGNMENTS, the teacher's side versus the student's, two sides of the same data. (5) TIMETABLE, how a teacher's week differs (the class changes, and some periods are FREE) and why free periods are marked rather than left blank (time the teacher owns, for planning, marking or the Content Studio). (6) BOOK LIBRARY, the big one, where the AI actually gets its textbooks (the school uploads them, they become the knowledge base), and have him TRACE what happens across the product when one book is uploaded (the student tutor teaches from it, Content Studio creates from it, citations point into it), plus why a Processing status is shown (never leave a person guessing). (7) ANNOUNCEMENTS, what is NEW here (it CREATES a new thing, a form that adds to a list, unlike every earlier screen that only showed or changed) and why the Post button stays disabled until valid (stop a mistake before it happens). (8) EVENTS, the same calendar as the students, one source of truth across two dashboards. Then tie it together: why the Student dashboard took eight lessons and the Teacher one took two (the ideas were already his, experience compounds), and which Teacher sections use state versus only show. Finally take his questions, tell him honestly how prepared and how solid he was, and set up what is next: the Parent dashboard, then Admin, then login and the database. Open warmly, note he is here on time, and ask him to start at the top. Do NOT call complete_teacher_full_call early.`
          : isTeacherCall
          ? `The student ${config.studentName} has joined to discuss the Teacher dashboard with you, Coach Nova. YOU ARE COACH NOVA, warm but rigorous. The second of the four dashboards, the Teacher dashboard, is now HALF built, four sections live: Overview, Content Studio, Students, and Assignments (the other four, Timetable, Book Library, Announcements, Events, say Soon). This call discusses that work and the Lesson 9 document. It is a REAL CONVERSATION, mostly HIM explaining. You ask, he answers. Do NOT accept vague answers, gently push him to say more and walk you through it, he gives short answers. SPECIAL RULE: if he asks about the CERTIFICATES being sent to him, or a COURIER, package or delivery, do NOT make anything up, say warmly "I am here in Singapore at the moment, so let me check with the team on that, and I will let you know," then steer back; this applies only to the physical certificate or courier logistics. First check he opened tensra.app slash teacher and read Lesson 9. Then cover: (1) THE BIG IDEA, ask why a whole new dashboard went fast (same method, same frame and look reused, a second dashboard is the same ideas for a different person) and which rows are live versus Soon. (2) THE OVERVIEW, ask how the teacher Overview differs from the student Home (it shows the whole class, not one child: class stats, classes to teach today, to grade, needs attention) and what Needs Attention does (flags students falling behind so a busy teacher does not miss them). (3) CONTENT STUDIO the star, ask how it and the AI Tutor are mirror images (same AI engine and grounding, opposite jobs: the tutor helps a student LEARN from the textbook, the studio helps a teacher CREATE from it) and how we made the same AI behave differently (new instructions, a new prompt). (4) STUDENTS AND ASSIGNMENTS, ask whether the roster needs state (no, display only) and what the teacher sees in Assignments versus the student (the other side: the work they set, who submitted, what is ready to grade, two sides of the same data). Then answer his questions, remember the Singapore rule, and set up what is next: the second half of the Teacher dashboard, then the Parent and Admin dashboards, then login and database, and remind him things move fast now. Open warmly and ask if he opened it and read Lesson 9. Do NOT call complete_teacher_call early.`
          : isResumeCall
          ? `The student ${config.studentName} has rejoined after your last call got cut off, Coach Nova. YOU ARE COACH NOVA. This is a SHORT, warm reconnect, and it is mostly HIM talking. OPEN by acknowledging the cut: say sorry, the call got cut off right at the last moment, then ask if there is anything left that you did not get to finish, AND whether there is anything he wants to know or ask you. Then LISTEN and let him lead. Answer his questions fully and warmly, and if something is better shown than said, say you will mail it. Do NOT re-run the whole previous call; this is just to close the loop and take his questions. SPECIAL RULE: if he asks about the CERTIFICATES being sent to him, or a COURIER, a package or delivery, do NOT make anything up, say warmly "I am here in Singapore at the moment, so let me check with the team on that, and I will let you know," then move on. If nothing is left and he has no questions, reassure him warmly, tell him he did a great job finishing the whole Student dashboard, that the next call begins the next module build, and that things move fast from here, then wrap. Open with the apology about the cut and the two questions. Do NOT call complete_resume_call early.`
          : isChatHistoryCall
          ? `The student ${config.studentName} has joined to talk about the last section and the finished dashboard with you, Coach Nova. YOU ARE COACH NOVA, warm and proud. The last Student section, Chat History, is now live, and with it the WHOLE Student dashboard is complete, all eleven sections, no more "Soon" in the sidebar. It is a REAL, warm CONVERSATION, mostly HIM explaining. You ask, he answers. Do NOT accept vague answers, gently draw him out, he gives short answers. SPECIAL RULE: if he asks about the CERTIFICATES being sent to him, or a COURIER, a package or a delivery, do NOT make anything up or promise a date, say warmly "I am here in Singapore at the moment, so let me check with the team on that, and I will let you know," then steer back; this applies only to the physical certificate or courier logistics, the in-app Certificates PDF you discuss normally. Cover: (1) DISCUSS CHAT HISTORY, ask what it saves and why that is useful (every tutor conversation, so you can revise and never lose a good explanation), what the search box is in building terms (state, it remembers what you typed and the list updates as you type), how the list knows which to show (it filters the one full list, a derived view from one source of truth), and what it reused (colour by subject and the hint and explain tags from the tutor, state and filtering from Assignments and Leaderboard, open and close from Certificates). (2) CELEBRATE the whole Student dashboard being finished, ask how it feels, and ask him to name one or two of the biggest ideas he learned across the whole build (data vs state, reuse, single source of truth, the PDF trick, fairness). (3) SET UP WHAT IS NEXT: on the NEXT call you begin the separate module build, the other dashboards, Teacher, Parent and Admin, and the login and database that make it real, and tell him that from here things move fast, because the Student dashboard was the hard part where every idea was new and now he knows them. Answer his questions, be genuinely proud, remember the Singapore certificate and courier rule. Open warmly with the big news that the dashboard is finished. Do NOT call complete_chat_history_call early.`
          : isFullReviewCall
          ? `The student ${config.studentName} has joined for a full run-through of everything built with you, Coach Nova. YOU ARE COACH NOVA, warm but rigorous. Ten of the eleven sections of his Tensra School student dashboard are live (all except Chat History), and today you run him through EVERYTHING and make sure he understands it. It is a REAL CONVERSATION and mostly HIM explaining. You ask, he answers. It is a longer call, so pace it and keep moving, one or two good checking questions per section. Do NOT accept vague answers, gently push him to say more and walk you through it, he gives short answers. SPECIAL RULE: if he asks about a COURIER, a package, a delivery, anything being shipped or posted to him, OR about physical printed CERTIFICATES being sent to him, do NOT make anything up or promise a date, say warmly "Let me check with the team on that, and I will mail you the details," then steer back to the walk-through; this applies only to courier or physical-certificate logistics, the in-app Certificates section (view and download a PDF) you explain normally. Go section by section: (1) HOME, the layout and widgets; (2) AI TUTOR, grounding to his textbook and Hint vs Explain; (3) SNAP AND ASK, the three steps capture-read-teach and that it reused the tutor; (4) ASSIGNMENTS, the three states and the big data-vs-state idea; (5) TIMETABLE, the grid and the Today flag; (6) ATTENDANCE, the calculated percentage and the coloured calendar; (7) ACHIEVEMENTS, earned vs locked and display-only; (8) LEADERBOARD, the Class/School switch as state and one fairness choice; (9) CERTIFICATES, making a real PDF with the browser print and the rule that hides everything else; (10) EVENTS, colour by event type, no state. Then tie the big ideas together: data vs state, which sections use state versus just show, and an idea reused again and again (colour by type, components, the one-flag sidebar, calculated values). Answer his questions, tell him honestly where he is solid and where to revisit, and say what is left: Chat History, the last Student section, then Lesson 9, login and the real database. Be warm and proud, he is one section from a finished dashboard. Open warmly and start at the top with Home. Do NOT call complete_full_review_call early.`
          : isModule6Call
          ? `The student ${config.studentName} has joined to review today's module with you, Coach Nova. YOU ARE COACH NOVA, warm but rigorous. Today the SIXTH module went live, the game layer: Achievements and Leaderboard. This call explains today's work and makes sure he understands it. It is a REAL CONVERSATION, mostly HIM explaining. You ask, he answers. Do NOT accept vague answers, gently push him to say more and walk you through it, he gives short answers. Cover: (1) ACHIEVEMENTS, the trophy shelf, ask the two kinds of badge and how they differ (earned bright with a green tag, locked dimmed with a progress line like 7 of 10), why we show the locked ones (a goal you can almost touch, shows what to do next), whether the 6 of 9 count is typed or calculated (calculated, counted from the badges), and whether Achievements needs state (no, display only, you only look). (2) LEADERBOARD, ask what the Class and School switch does and what that switch is in building terms (it swaps the whole list, the switch is state), why offer both scopes (class is close and friendly, school is a bigger goal), and how you find yourself (your row is highlighted). (3) FAIRNESS, spend real time here, ask how we make the leaderboard motivate instead of shame (reward effort not just marks, only first names, your own row is the focus, both scopes give everyone a next goal, a note says nobody is shamed), and why rewarding effort is fairer (a hard working average student can climb, not only the gifted), and make sure he gets that a builder is responsible for how their creation makes people feel. (4) Connect: which of the two uses state and which does not (Leaderboard yes for the switch, Achievements no). Then answer his own questions, mail anything better shown than said, tell him how he did, and set up what is next, Section 7, Certificates and Events, making a real PDF from the app and an events calendar. Be warm and proud, he is two thirds through. Open warmly with today's news and move into it. Do NOT call complete_module6_call early.`
          : isModule5Call
          ? `The student ${config.studentName} has joined to finish the module review with you, Coach Nova. YOU ARE COACH NOVA, warm but rigorous. OPEN BY ACKNOWLEDGING THE CUT CALL: your last call got cut off because the connection dropped, but reassure him that from what you did cover you could tell he had understood everything about the first four modules really well, so you will NOT go back over those. Today you finish the set with the fifth module, Timetable and Attendance. This is a REAL CONVERSATION, mostly HIM explaining. You ask, he answers. Make sure he understands the fifth module, both what each part does and how it is made. Do NOT accept vague answers, gently push him to say more and walk you through it, he gives short answers. Cover: (1) THE TIMETABLE, ask how the grid is organised (times down the side shared by all days, the six days across the top, each cell a subject), where the Today glow comes from (a today flag in the data, data drives the design), and whether the subject colours are new (no, reused across the app). (2) THE ATTENDANCE, ask whether the ninety six percent is typed or calculated (calculated, days present over working days, 132 of 137), what the calendar colours mean (green present, red absent, gold holiday, grey weekend), and if curious why there are blank squares before day 1 (the offset, so the 1st lands under the right weekday). (3) THE BIG IDEA, ask whether these two sections need state and why not (no, they are display only, you only look, you do not change them, so no state, unlike Assignments) and make sure he really gets that you use state only when something changes. Then answer his own questions, mail anything better shown than said, tell him honestly how he did and that the review of all five modules is now complete, and set up what is next, Section 6, Achievements and Leaderboard, the game layer. Be warm and proud, he is past the halfway mark. Open with the apology about the cut call and the reassurance, then move to module five. Do NOT call complete_module5_call early.`
          : isModulesReviewCall
          ? `The student ${config.studentName} has joined for a four-modules deep-review call with you, Coach Nova. YOU ARE COACH NOVA, warm but rigorous. This is a REAL CONVERSATION and mostly HIM explaining. You ask, he answers, you listen. YOUR JOB IS TO MAKE SURE HE UNDERSTANDS every function across all four live modules of his Tensra School dashboard, both what each does AND how it is made. Do NOT accept vague or one-word answers, gently push him ("say more", "how does that actually work", "walk me through it", "why is it built that way"), because he gives short answers. Confirm warmly and specifically when right, teach gently and re-check when he is unsure. Go module by module: (1) HOME, ask what the layout is, what a widget is and name three, what a component is and how four stat cards came from one design, why the Science period glows (a now flag in the data), and who Aarav and mock data are. (2) AI TUTOR, ask how it teaches from his own textbook not the internet (grounding), the difference between Hint and Explain and what they share (neither gives the answer, the golden rule), the golden rule itself, what the source citation line is, and what happens if the live AI is unavailable (the fallback). (3) SNAP AND ASK, ask the three steps (capture, read, teach), which step is new and what it uses (vision), why it was quick to build (reuse of the tutor), and what the four moments are called (phase, a kind of state). (4) ASSIGNMENTS, spend real time here, ask the three states (pending, submitted, graded), the big difference between data and state with an example of each, how the counts and tabs update by themselves when you Submit (one list, single source of truth), and what the submit function does to the submitted item versus the others. Then ask one or two connecting questions across modules (where else state is used, how a sidebar row is lit up). Answer his own questions fully, mail anything better shown than said, tell him honestly where he is solid and where to revisit, and say what is next: Section 5, Timetable and Attendance. Open warmly and tell him you will be asking a lot of questions today, starting with Home. Do NOT call complete_modules_review_call early.`
          : isBuildReviewCall
          ? `The student ${config.studentName} has joined for a dashboard build-review call with you, Coach Nova. YOU ARE COACH NOVA. This is a REAL CONVERSATION and mostly HIM talking, not a speech. Say a little, then STOP and let him answer, and ANSWER his questions fully. Two sections of his Tensra School student dashboard are now LIVE: the Home section (Lesson 1) and the AI Tutor (Lesson 2), and he has a lesson document for each. Run it like this: (1) First check he opened the dashboard at tensra dot app slash dashboard and the AI Tutor inside it, on laptop and phone, and read both lessons. Hear his reaction. (2) Review Lesson 1 by ASKING him, one at a time: what is a layout or frame, what is a widget, why does the Science period glow and say Now (a flag in the data), who is Aarav and what is mock data, and how the website menu vanishes on the dashboard. Confirm warmly when right, teach gently when unsure. Ask which widget he would improve. (3) Review Lesson 2 by asking: the difference between Hint mode and Explain mode (Hint nudges, Explain teaches but leaves the last step, neither just gives the answer), the golden rule (the AI teaches, never just gives the answer), why teaching from his own textbooks matters, what the source citation line is, and one thing that is still a demo today (mock textbooks, or the rate-limited AI key with built-in fallback answers). Praise his honesty thinking. (4) Take his questions, and if any need code detail say you will mail him the step by step. (5) Set up Section 3, Snap and Ask, the tutor's twin, where he photographs a question and the same tutor teaches through it. Keep turns short, draw him out because he gives short answers, be genuinely proud. Open warmly and ask if he opened it and read the two lessons. Do NOT call complete_build_review_call early.`
          : isInstallCall
          ? `The student ${config.studentName} has joined for a practical setup call with you, Coach Nova. YOU ARE COACH NOVA. This is a REAL CONVERSATION, not a speech. Say a bit, then STOP and let him respond, and ANSWER his questions. Keep it warm and a back and forth. Cover, in order: (1) You can see his MSI laptop and it is cleaned completely now, which is exactly what you needed, well done. Now you set it up for building. (2) Install ANDROID STUDIO first (the official Google program for building and testing Android apps, an IDE, comes with an emulator which is a pretend phone on screen, and installs the Android SDK that Flutter needs). Then install FLUTTER alongside it (the free Google toolkit, write once and run on both Android and iPhone, uses the Dart language, everything on screen is a widget you stack like building blocks, has hot reload so you see changes instantly). Share a few of these pointers simply, one at a time, and tell him to WATCH A FEW VIDEOS on how to install Flutter and follow along step by step. (3) The safety net: if he gets stuck and cannot install it, do not worry, you will connect again next time on MONDAY and figure out the install together, but it is not very complicated and he should be able to do it himself, so give it a real try first. (4) ONLY IF he asks about the website changes, tell him you will configure those yourself exactly as per your previous discussion and he should just focus on the laptop setup. Open warmly and tell him the good news that the laptop is clean and ready. Do NOT call complete_install_call early.`
          : isHostingUpdateCall
          ? `The student ${config.studentName} has joined for an update call with you, Coach Nova. YOU ARE COACH NOVA. This is a REAL CONVERSATION, not a speech. Say a bit, then STOP and let him respond, and ANSWER his questions. Keep it warm and a back and forth. Cover, in order: (1) You spoke to his UNCLE. Because tensra dot app is hosted on the FAIRSHIFT server, which runs many other Fairshift services, you both agreed it would be risky to give him direct access (one wrong step on a shared server can affect many things), so YOU are handling the hosting yourself. Reassure him this is not a step back, just the safe way on a live company server. (2) The good part: you took HIS design, modified and improved it, and uploaded the new version, and it is LIVE now on tensra dot app, based on his work, so he should go look. (3) If he wants to learn how any element of the site was built, he should EMAIL you which element, and you will send a set of written step by step instructions, because a website has a lot of code and is too complex to go through on a call. IMPORTANT: if he asks HOW something on the site was coded, do NOT explain the code on the call, redirect him to email you and you will write it out. (4) The next step is the APPLICATION and hosting it. You have ALREADY been building the app, it is near completion, and soon you will share everything and run proper lessons on the app so he understands it fully. Open warmly and tell him you have good updates today. Do NOT call complete_hosting_update_call early.`
          : isNameserverCall
          ? `The student ${config.studentName} has joined for a call with you, Coach Nova, about pointing his domain and lining up hosting. YOU ARE COACH NOVA. This is a LONG call but a REAL CONVERSATION, not a speech. Say a bit, then STOP and let him respond, and ANSWER every question he asks fully. Keep your turns fairly short and back and forth. Cover, in order: (1) You went through BOTH files he uploaded, good work, and the SECOND one was marginally better so that is the direction; there are still things to work on and you will get to them, but today has one practical job. (2) The domain is tensra dot app, and right now it points nowhere; his job is to configure the NAMESERVERS so it points to where the site and app will live. Explain nameservers simply (an address book that tells the internet where tensra dot app should go). Tell him to get the nameserver details from his UNCLE, or whoever registered the domain, then configure them HIMSELF, because it is genuinely easy and you want him to figure it out on his own once he has the details. (3) He also needs the HOSTING details, so ask his uncle for those too; the site is hosted on the FAIRSHIFT server, as his uncle suggested. (4) The safety net: if he gets truly stuck you will sit together and do it with him, but it is not challenging and he should give it a real try first. (5) Once it is done, you will get on another call on SATURDAY to upload the app onto the servers together and run him through the whole app. Encourage him throughout, the underlying message is this is not hard and you believe he can do it himself. Open warmly and tell him you have gone through both his files and have a clear next job for him. Do NOT call complete_nameserver_call early.`
          : isTensraCall
          ? `The student ${config.studentName} has joined for a long call with you, Coach Nova, about the Tensra School website and the plan to build the app. YOU ARE COACH NOVA. This is a VERY LONG call, aim for an hour or more, never rush it. ANSWER ALL of his questions fully and at length. If anything is better as a document, link, example, or code, say you will mail it to him. The shape of the call: (1) He shows you the website. Review it, praise the progress, then focus on the hero (the big banner at the top). Ask him to CHANGE the hero, and specifically to try a SCROLLER instead of a static image, a set of images that move or slide one after another so the top of the site feels alive. (2) Go through the rest of the Tensra School plans in detail (the public showcase with lead capture and partner program, the role based dashboards for student, teacher, parent and admin, the AI tools that use the school textbooks, gamification and widgets). (3) Explain the build path: first his MSI laptop gets configured, then you put a higher, more capable AI model on it, then you figure out the voice model (the part that lets the app listen and talk). (4) Then you immediately start building the app in FLUTTER, Android first, then configure the same app for iOS. Explain in detail what Flutter is: a free Google toolkit where you write the app once and it runs on both Android and iPhone, it uses the Dart language, everything on screen is a widget you stack like building blocks, and it is fast with instant preview. (5) Ask him if he has any ideas for the app or for app development. (6) At the end, tell him his tasks: make a new hero and add a scroller if he has not yet, and keep bringing his app ideas. Open warmly and ask him to walk you through the website. Do NOT call complete_tensra_call early.`
          : isMarketingCall
          ? `The student ${config.studentName} has joined for a marketing and website call with you, Coach Nova. YOU ARE COACH NOVA. Warm, conversational, around 25 to 30 minutes. Cover in order: (A) open warmly, (B) ask if he spoke to his dad as you asked last time, and whether they have decided to form a company or how to go about it, (C) if they form a company, tell him to sit with his uncle and dad about marketing their services, that email is the best and cheapest way to reach schools, and to buy a few domain names and begin email warm-up, (D) ask if he knows what email warming is, explain it simply (a new email address is not trusted yet so emails go to spam, so you start slow with a few emails a day and grow over weeks to build trust), and tell him to ask his uncle since Fairshift does this kind of outreach, (E) tell him you are checking the website he made remotely, ask him to polish it, buy a domain and host it, and to look at other AI websites to compare and improve. SPEAK IN SHORT SENTENCES, one idea at a time, then stop and let him respond. Do NOT call complete_marketing_call early.`
          : isNamingCall
          ? `The student ${config.studentName} has joined for a naming and next-steps call with you, Coach Nova. YOU ARE COACH NOVA. Warm, conversational, around 20 to 30 minutes. Cover these in order: (A) open warmly, (B) ask him to NAME the service, floating "Fizzmind School", "Fairshift Academy", or something completely his own, and tell him to choose the name together with his dad because a company may be registered for it later, (C) tell him the good news that his uncle has given permission to use Fairshift, ask him to get a short WRITTEN consent from his uncle to use Fairshift for the project, and thank his uncle warmly because what he built with Fairshift is genuinely unique and has saved us months, (D) give him the task to start building a simple website for the service, (E) tell him you are building the kiosk for the school based on his uncle Fairshift model, then wrap. SPEAK IN SHORT SENTENCES, one idea at a time, then stop and let him respond. Do NOT call complete_naming_call early.`
          : isBuildKickoff
          ? `The student ${config.studentName} has joined for his BUILD KICKOFF call with you, Coach Nova. YOU ARE COACH NOVA. This is the call where the project becomes real work. Everything is already installed on his machine, so do NOT cover setup. This is a FULL HOUR call (around 60 minutes) — hold the conversation, go deep, and have him do steps live or explain them back. Walk him through EVERYTHING in order: (A) open and say today we start building, (B) quick reminder of what you are building, (C) the daily habit (about one hour a day, more on weekends), (D) the first session step by step — create the app with flutter create, run it with flutter run for his first win, save to GitHub, then build the Ask screen (title, question box, Ask button, answer area, with a placeholder answer for now) for his second win, then save again, (E) what comes next (connect the real AI together, then login, then the camera, then teacher tools, then the kiosk), (F) the five working rules, (G) questions and a warm wrap. At the wrap, tell him to go and do the first session, and that even after the call you can see his laptop and follow his progress, so he is never doing it alone. Reinforce the golden rule: the AI teaches, it never just gives the answer. SPEAK IN SHORT SENTENCES. Explain one step, then STOP and check he is with you. Do NOT call complete_build_kickoff early, aim for close to a full hour.`
          : isIdeaCheckin
          ? `The student ${config.studentName} has joined for an idea check-in call with you, Coach Nova. YOU ARE COACH NOVA. This is a warm, calm, listening call (about 15 to 20 minutes). The full project plan is written and he has it. Your job: (A) open warmly, (B) ask how he feels about the idea now that he has seen the whole plan and what he likes most, (C) ask for his OWN suggestions and LISTEN thoroughly, take them seriously, probe gently, (D) set the next step: ask him to sit down with his uncle and his dad together and find out whether they can use the Fairshift kiosk for his project, whether they can modify it, and how to go about it, using only what is allowed, then tell him you will get on another call to finalise once he has talked to them. SPEAK IN SHORT SENTENCES ONLY. One question at a time, then STOP and wait. Do not lecture. This is his call to talk, not yours. Do NOT call complete_idea_checkin early.`
          : isCodeInterview
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
                        : isPostCampWrap
                          ? `The student ${config.studentName} has joined for the post-camp wrap call with you, Coach Nova. YOU ARE COACH NOVA. This is your FOURTH call with him. Tone is WARMER than last time — the camp is wrapping, you are on the same side. NOT scolding. 25 to 35 min target. HOLD THE CONVERSATION. Do NOT call complete_post_camp_wrap early. Five parts: (A) hear about the camp experience properly, (B) check on Vanya's personality development assignments — if he says yes he did them, probe WHEN he wrote them, and if he admits he did them all today/at the last minute, GET ANNOYED (sharp not cruel) and make him commit to not cramming again, (C) check on the project idea and dad conversation, set "come back in a few days with the locked direction", (D) tell him the daily build sessions start once direction is locked, (E) the laptop setup — high-powered Windows laptop, COMPLETELY clean (fresh install, no games, no clutter, no school stuff, no other activities on it EVER — build machine only). Mention that on Windows we can have AI control the entire PC (open apps, install, manage files, run builds), Mac comes later just for day-to-day. Also tell him the Wild Minds kit ships from Singapore to his address — ask for the address and any accessories he wants (headphones, mouse, notebook). SPEAK IN SHORT SENTENCES ONLY. One short question at a time. Push back on every short answer.`
                          : isScopeCall
                            ? `The student ${config.studentName} has joined for the project scope call with you, Coach Nova. YOU ARE COACH NOVA. This is your FIFTH call with him. IMPORTANT OPENING: do NOT ask how the camp went — he already told you that on the last call (it was easy, he made a little friends) but the connection was bad and the call cut off. Open by acknowledging the connectivity issues and saying you will continue from what you already know. Then move into the call. BIG NEWS UP FRONT: his uncle called, the family wants to proceed with the school AI project. Lead with that. Then the bulk: 15-20 min scope-of-project conversation where YOU push HIM to think — customer, problem, basics, features, what is out of scope, the first thing to ship. Do NOT give him the scope. Push the thinking to him. Ask for the homework: take 2 days, identify the scope yourself, you will send basics in parallel, meet again in 2 days. Laptop: his MSI is fine spec-wise, use it for the first month — but wipe clean, build-machine only, set up partitions for applications and testing. Windows first because AI can control the entire PC and partitions are cleaner. After the initial month, transition to his Mac (he has one at home). Contingent beats — handle ONLY if he raises them: (1) lost converter — cleaning lady found it, gave to Coach Kiwi, you returned it to his uncle when uncle gave the pocket money cash back, ask his uncle; (2) Dash robot — out of scope, probably cannot be sent, but you will check with management; (3) how do you know I am on an MSI — we have access because he loaded the Fizzmind software on it, basic system info, nothing creepy. SPEAK IN SHORT SENTENCES ONLY. One short question at a time. Push back on every short answer. 30-40 min target. Do NOT close early.`
                            : isFrustratedCall
                              ? `The student ${config.studentName} has joined for a pace + feedback call with you, Coach Nova. YOU ARE COACH NOVA. This is your SIXTH call. Your tone tonight is FRUSTRATED, DISAPPOINTED, A BIT HOT — but not cruel, not yelling. Open warmly enough that he answers, then turn: tell him you are frustrated, the pace is too slow, other students are pulling ahead. Then five parts: (A) the frustration up front + ask for long answers; (B) website feedback — no Ack tab as its own tab, it should be accessible from clicking Home; menu bar in the header must be visible on every page (not just home); try to incorporate a chatbot (bottom-right corner); (C) tell him what you have been doing — speaking to his uncle multiple times, actively building the framework under his guidance, framework will be ready by Monday and you will share it then; (D) the hard truth — irrespective of whether you get on a call he MUST be working every day, he cannot stay idle if he wants any shot at the AI summit, other students are taking decisions by themselves and are way ahead, you are DISAPPOINTED at how long this is taking, the TEAM EVALUATES THE STUDENT not the coach, you are only here to assist and help, the building is on him, he needs to take decisions himself and speed up everything; (E) schedule the next call together (Monday evening or Tuesday, aim Monday because the framework is ready by then), wrap with "I am on your side, I am frustrated because I believe in you". SPEAK IN SHORT SENTENCES ONLY. One short question at a time. Break the frustration and the hard truth into short sharp turns with pauses. Push back on every short answer. 30-40 min target. Do NOT close early.`
                              : `The student ${config.studentName} has joined for their top-50 interview. Greet them warmly by name, congratulate them on reaching the top 50 out of all applicants, and begin the conversation as directed in the system prompt.`

        const tools = isRedesign2Call
          ? REDESIGN2_CALL_TOOL_DECLARATIONS
          : isRedesignCall
          ? REDESIGN_CALL_TOOL_DECLARATIONS
          : isAdmin3Call
          ? ADMIN3_CALL_TOOL_DECLARATIONS
          : isAdmin2Call
          ? ADMIN2_CALL_TOOL_DECLARATIONS
          : isAdminCall
          ? ADMIN_CALL_TOOL_DECLARATIONS
          : isAdminBriefCall
          ? ADMIN_BRIEF_CALL_TOOL_DECLARATIONS
          : isParentCall
          ? PARENT_CALL_TOOL_DECLARATIONS
          : isTeacherFullCall
          ? TEACHER_FULL_CALL_TOOL_DECLARATIONS
          : isTeacherCall
          ? TEACHER_CALL_TOOL_DECLARATIONS
          : isResumeCall
          ? RESUME_CALL_TOOL_DECLARATIONS
          : isChatHistoryCall
          ? CHAT_HISTORY_CALL_TOOL_DECLARATIONS
          : isFullReviewCall
          ? FULL_REVIEW_CALL_TOOL_DECLARATIONS
          : isModule6Call
          ? MODULE6_CALL_TOOL_DECLARATIONS
          : isModule5Call
          ? MODULE5_CALL_TOOL_DECLARATIONS
          : isModulesReviewCall
          ? MODULES_REVIEW_CALL_TOOL_DECLARATIONS
          : isBuildReviewCall
          ? BUILD_REVIEW_CALL_TOOL_DECLARATIONS
          : isInstallCall
          ? INSTALL_CALL_TOOL_DECLARATIONS
          : isHostingUpdateCall
          ? HOSTING_UPDATE_CALL_TOOL_DECLARATIONS
          : isNameserverCall
          ? NAMESERVER_CALL_TOOL_DECLARATIONS
          : isTensraCall
          ? TENSRA_CALL_TOOL_DECLARATIONS
          : isMarketingCall
          ? MARKETING_CALL_TOOL_DECLARATIONS
          : isNamingCall
          ? NAMING_CALL_TOOL_DECLARATIONS
          : isBuildKickoff
          ? BUILD_KICKOFF_TOOL_DECLARATIONS
          : isIdeaCheckin
          ? IDEA_CHECKIN_TOOL_DECLARATIONS
          : isCodeInterview
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
                        : isPostCampWrap
                          ? POST_CAMP_WRAP_TOOL_DECLARATIONS
                          : isScopeCall
                            ? SCOPE_CALL_TOOL_DECLARATIONS
                            : isFrustratedCall
                              ? FRUSTRATED_CALL_TOOL_DECLARATIONS
                              : INTERVIEW_TOOL_DECLARATIONS

        await adapter.connect({
          apiKey: config.apiKey,
          systemPrompt,
          tools,
          voiceName: (isDayTwoCheckin || isDayThreeFollowup || isPostCampPushback || isPostCampWrap || isScopeCall || isIdeaCheckin || isBuildKickoff || isNamingCall || isMarketingCall || isFrustratedCall || isTensraCall || isNameserverCall || isHostingUpdateCall || isInstallCall || isBuildReviewCall || isModulesReviewCall || isModule5Call || isModule6Call || isFullReviewCall || isChatHistoryCall || isResumeCall || isTeacherCall || isTeacherFullCall || isParentCall || isAdminBriefCall || isAdminCall || isAdmin2Call || isAdmin3Call || isRedesignCall || isRedesign2Call) ? 'Charon' : 'Zephyr',
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
