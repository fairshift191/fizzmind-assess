import { useState, useEffect } from 'react'
import { C, W, K, tint } from '../theme'
import { motion, AnimatePresence } from 'framer-motion'
import { verifyInvite, markInviteUsed } from '../lib/invites.js'
import { saveTestResults, saveInterviewResults } from '../lib/supabase.js'
import PythonQuiz from './PythonQuiz.jsx'
import ArtsTest from './ArtsTest.jsx'
import BusinessTest from './BusinessTest.jsx'
import VoiceInterview from './VoiceInterview.jsx'
import Results from './Results.jsx'
import ThankYou from './ThankYou.jsx'

// Maps track slug → human label + description
const TRACK_INFO = {
  stem: {
    label: 'STEM & AI',
    icon: '🤖',
    desc: 'A Python coding challenge — 30 questions, 10 minutes. Navigate freely, no pressure.',
    color: C.trackCode,
  },
  arts: {
    label: 'Creative Arts',
    icon: '🎨',
    desc: 'A creative prompt — upload your work (image, video, audio) and write a short description.',
    color: C.trackArts,
  },
  business: {
    label: 'Business & Entrepreneurship',
    icon: '💡',
    desc: '15 case study questions — strategic thinking scenarios, 15 minutes.',
    color: C.warning,
  },
}

export default function InviteTest({ inviteCode, onReset }) {
  const [phase, setPhase] = useState('verifying') // verifying | welcome | test | interview | interview-done | results | error
  const [invite, setInvite] = useState(null)
  const [student, setStudent] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [testResults, setTestResults] = useState(null)

  // Verify invite on mount
  useEffect(() => {
    async function verify() {
      const result = await verifyInvite(inviteCode)
      if (!result.valid) {
        setErrorMsg(result.reason)
        setPhase('error')
      } else {
        setInvite(result.invite)
        setStudent(result.student)
        setPhase('welcome')
      }
    }
    verify()
  }, [inviteCode])

  async function handleTestComplete(results) {
    // Save results + mark invite used
    const track = invite.track
    const studentName = `${student.first_name} ${student.last_name}`.trim()

    await saveTestResults({
      studentId: student.id,
      email: student.email,
      studentName,
      track,
      results,
    })

    await markInviteUsed(inviteCode)

    setTestResults({
      ...results,
      studentName,
      email: student.email,
      track,
    })
    setPhase('results')
  }

  async function handleInterviewComplete(res) {
    await saveInterviewResults({
      studentId: student.id,
      applicationId: invite.application_id ?? null,
      projectPlan: res.projectPlan,
      personNote: res.personNote,
      adminNote: res.adminNote,
    })
    await markInviteUsed(inviteCode)
    setPhase('interview-done')
  }

  const config = student
    ? {
        studentName: `${student.first_name} ${student.last_name}`.trim(),
        email: student.email,
      }
    : null

  const isVoiceInterview = invite?.type === 'voice_interview'
  const isCodeInterview = invite?.type === 'code_interview'
  const isInterview = isVoiceInterview || isCodeInterview
  const inviteVariant = invite?.metadata?.invite_variant ?? null
  const isPostAdmission = isVoiceInterview && inviteVariant === 'post_admission'
  const isPostCounsellor = isVoiceInterview && inviteVariant === 'post_counsellor'
  const isDayOneCheckin = isVoiceInterview && inviteVariant === 'post_day_one'
  const isDayTwoCheckin = isVoiceInterview && inviteVariant === 'post_day_two'
  const isDayThreeFollowup = isVoiceInterview && inviteVariant === 'post_day_three'
  const isWeekendPlan = isVoiceInterview && inviteVariant === 'weekend_plan'
  const isPostCampPushback = isVoiceInterview && inviteVariant === 'post_camp_pushback'
  const isPostCampWrap = isVoiceInterview && inviteVariant === 'post_camp_wrap'
  const isScopeCall = isVoiceInterview && inviteVariant === 'scope_call'
  const isIdeaCheckin = isVoiceInterview && inviteVariant === 'idea_checkin'
  const isBuildKickoff = isVoiceInterview && inviteVariant === 'build_kickoff'
  const isNamingCall = isVoiceInterview && inviteVariant === 'naming_call'
  const isMarketingCall = isVoiceInterview && inviteVariant === 'marketing_call'
  const isFrustratedCall = isVoiceInterview && inviteVariant === 'frustrated_call'
  const isTensraCall = isVoiceInterview && inviteVariant === 'tensra_call'
  const isNameserverCall = isVoiceInterview && inviteVariant === 'nameserver_call'
  const isHostingUpdateCall = isVoiceInterview && inviteVariant === 'hosting_update_call'
  const isInstallCall = isVoiceInterview && inviteVariant === 'install_call'
  const isBuildReviewCall = isVoiceInterview && inviteVariant === 'build_review_call'
  const isModulesReviewCall = isVoiceInterview && inviteVariant === 'modules_review_call'
  const isModule5Call = isVoiceInterview && inviteVariant === 'module5_call'
  const isModule6Call = isVoiceInterview && inviteVariant === 'module6_call'
  const isFullReviewCall = isVoiceInterview && inviteVariant === 'full_review_call'
  const isChatHistoryCall = isVoiceInterview && inviteVariant === 'chat_history_call'
  const isResumeCall = isVoiceInterview && inviteVariant === 'resume_call'
  const isTeacherCall = isVoiceInterview && inviteVariant === 'teacher_call'
  const isTeacherFullCall = isVoiceInterview && inviteVariant === 'teacher_full_call'
  const isParentCall = isVoiceInterview && inviteVariant === 'parent_call'
  const isAdminBriefCall = isVoiceInterview && inviteVariant === 'admin_brief_call'
  const isAdminCall = isVoiceInterview && inviteVariant === 'admin_call'
  const isAdmin2Call = isVoiceInterview && inviteVariant === 'admin2_call'
  const isAdmin3Call = isVoiceInterview && inviteVariant === 'admin3_call'
  const isRedesignCall = isVoiceInterview && inviteVariant === 'redesign_call'
  const isRedesign2Call = isVoiceInterview && inviteVariant === 'redesign2_call'
  const isLesson15Call = isVoiceInterview && inviteVariant === 'lesson15_call'
  const isLesson16Call = isVoiceInterview && inviteVariant === 'lesson16_call'
  const isAppShellCall = isVoiceInterview && inviteVariant === 'appshell_call'
  const isTabsCall = isVoiceInterview && inviteVariant === 'tabs_call'
  const isLesson17Call = isVoiceInterview && inviteVariant === 'lesson17_call'
  const isLesson19Call = isVoiceInterview && inviteVariant === 'lesson19_call'
  const isResearchCall = isVoiceInterview && inviteVariant === 'research_call'
  const isBusinessCall = isVoiceInterview && inviteVariant === 'business_call'
  const trackInfo = invite && !isInterview ? TRACK_INFO[invite.track] : null
  const interviewInfo = isCodeInterview
    ? {
        label: 'Code Interpretation',
        icon: '💬',
        desc: 'A short chat with Scout about the chatbot you built. Just a few minutes — walk her through what you made and how it works.',
        color: C.gold,
      }
    : isPostCounsellor
      ? {
          label: 'Parent Call · with Beverly',
          icon: '🎙️',
          desc: 'A 15 to 20 minute call with Beverly, one of our coordinators, intended for the parents. Beverly will walk you through what the Wild Minds Fellowship actually is, the dates, and an important choice for your family.',
          color: C.gold,
        }
      : isDayOneCheckin
        ? {
            label: 'Day 1 Check-in · with Scout',
            icon: '🎙️',
            desc: 'A short, friendly catch-up with Scout after your first day of the Fellowship. Just a few minutes — she wants to hear how it went.',
            color: C.gold,
          }
        : isDayTwoCheckin
          ? {
              label: 'Day 2 + 3 Review · with Coach Nova',
              icon: '🎙️',
              desc: 'A proper review chat with Coach Nova after Days 2 and 3. Around 30 to 40 minutes. Your coaches will be listening in. Find a quiet spot.',
              color: C.gold,
            }
          : isDayThreeFollowup
            ? {
                label: 'Follow-up Call · with Coach Nova',
                icon: '🎙️',
                desc: 'A long catch-up with Coach Nova. Around 60 to 90 minutes. He wants the full picture of your day, your project thinking, and a proper chat about what you love. Find a really quiet spot and settle in.',
                color: C.gold,
              }
            : isWeekendPlan
              ? {
                  label: 'Weekend Plan · with Beverly',
                  icon: '🎙️',
                  desc: 'A long chat with Beverly to plan your weekend in Kuala Lumpur. Around 45 to 60 minutes. She wants to know what would actually make this weekend yours.',
                  color: C.gold,
                }
              : isPostCampPushback
                ? {
                    label: 'Post-Camp Call · with Coach Nova',
                    icon: '🎙️',
                    desc: 'A serious call with Coach Nova. The camp was fun. The work starts now. 35 to 50 minutes. Find a quiet spot and be ready to be straight.',
                    color: C.gold,
                  }
                : isPostCampWrap
                  ? {
                      label: 'Camp Wrap · with Coach Nova',
                      icon: '🎙️',
                      desc: 'A warm wrap-up with Coach Nova. The camp is done. Time to talk about how it went and what comes next. 25 to 35 minutes.',
                      color: C.gold,
                    }
                  : isScopeCall
                    ? {
                        label: 'Scope Call · with Coach Nova',
                        icon: '🎙️',
                        desc: 'A working call with Coach Nova. The school AI is a go. Time to start scoping the project. 30 to 40 minutes.',
                        color: C.gold,
                      }
                    : isIdeaCheckin
                    ? {
                        label: 'Idea Check-in · with Coach Nova',
                        icon: '🎙️',
                        desc: 'A relaxed call with Coach Nova. He wants to hear how you like the project idea, any suggestions you have, and to set your next step. About 15 to 20 minutes.',
                        color: C.gold,
                      }
                    : isBuildKickoff
                    ? {
                        label: 'Build Kickoff · with Coach Nova',
                        icon: '🎙️',
                        desc: 'A full hour with Coach Nova. He walks you through everything you need to do to start building, step by step, and stays with you after. Be at your laptop. About 1 hour.',
                        color: C.gold,
                      }
                    : isNamingCall
                    ? {
                        label: 'Naming & Next Steps · with Coach Nova',
                        icon: '🎙️',
                        desc: 'A chat with Coach Nova about naming your service, a few next steps, and some good news from your uncle. About 20 to 30 minutes.',
                        color: C.gold,
                      }
                    : isMarketingCall
                    ? {
                        label: 'Marketing & Website · with Coach Nova',
                        icon: '🎙️',
                        desc: 'A working call with Coach Nova about getting your service out there, by email and a website. About 25 to 30 minutes.',
                        color: C.gold,
                      }
                    : isFrustratedCall
                      ? {
                          label: 'Pace Call · with Coach Nova',
                          icon: '🎙️',
                          desc: 'A direct call with Coach Nova about pace, website feedback, and the project framework. 30 to 40 minutes. Find a quiet spot.',
                          color: C.gold,
                        }
                      : isTensraCall
                      ? {
                          label: 'Website Review & Build Plan · with Coach Nova',
                          icon: '🎙️',
                          desc: 'Show Coach Nova the website, sort out the hero, then plan the app build together. A long one, an hour or more. Find a quiet spot and settle in.',
                          color: C.gold,
                        }
                      : isNameserverCall
                      ? {
                          label: 'Domain & Hosting Setup · with Coach Nova',
                          icon: '🎙️',
                          desc: 'Coach Nova walks you through pointing tensra.app and lining up hosting, then sets up Saturday to deploy the app together. Find a quiet spot.',
                          color: C.gold,
                        }
                      : isHostingUpdateCall
                      ? {
                          label: 'Site Live & App Next · with Coach Nova',
                          icon: '🎙️',
                          desc: 'Coach Nova has updates: the site is live on tensra.app, built on your design, and the app is nearly ready. Come with your questions.',
                          color: C.gold,
                        }
                      : isInstallCall
                      ? {
                          label: 'Laptop Setup & Install · with Coach Nova',
                          icon: '🎙️',
                          desc: 'The MSI is clean and ready. Coach Nova walks you through installing Android Studio and Flutter so you can start building. Have your laptop with you.',
                          color: C.gold,
                        }
                      : isBuildReviewCall
                      ? {
                          label: 'Dashboard Build Review · with Coach Nova',
                          icon: '🎙️',
                          desc: 'Two sections are live: Home and the AI Tutor. Coach Nova goes through both lessons and your homework with you, then sets up Section 3. Have the dashboard open.',
                          color: C.gold,
                        }
                      : isModulesReviewCall
                      ? {
                          label: 'Four Modules Review · with Coach Nova',
                          icon: '🎙️',
                          desc: 'All four modules are live. Coach Nova goes through each one and asks you questions to make sure you understand every function. Have the dashboard and all four lessons ready.',
                          color: C.gold,
                        }
                      : isModule5Call
                      ? {
                          label: 'Module 5 Review · with Coach Nova',
                          icon: '🎙️',
                          desc: 'The last call cut out, but you have the first four. Now we finish with the fifth module, Timetable and Attendance. Have the dashboard and Lesson 5 ready.',
                          color: C.gold,
                        }
                      : isModule6Call
                      ? {
                          label: 'Module 6 Review · with Coach Nova',
                          icon: '🎙️',
                          desc: "Today's module went live: the game layer, Achievements and Leaderboard. Coach Nova explains it and asks you to walk it back. Have the dashboard and Lesson 6 ready.",
                          color: C.gold,
                        }
                      : isFullReviewCall
                      ? {
                          label: 'Full Dashboard Run-Through · with Coach Nova',
                          icon: '🎙️',
                          desc: 'Ten of eleven sections are live. Coach Nova runs you through everything built so far, section by section, and has you explain it back. A longer call. Have the whole dashboard open.',
                          color: C.gold,
                        }
                      : isChatHistoryCall
                      ? {
                          label: 'Finished Dashboard · with Coach Nova',
                          icon: '🎙️',
                          desc: 'The last section, Chat History, is live, so the whole Student dashboard is done. Coach Nova talks it through and tells you what comes next. Have the dashboard open.',
                          color: C.gold,
                        }
                      : isResumeCall
                      ? {
                          label: 'Quick Reconnect · with Coach Nova',
                          icon: '🎙️',
                          desc: 'Our last call got cut off. A quick one to finish anything left and answer anything you want to ask.',
                          color: C.gold,
                        }
                      : isBusinessCall
                      ? {
                          label: 'The Business Side · with Coach Nova',
                          icon: '🎙️',
                          desc: 'You present first, because you said Wednesday. Then I tell you what your uncle and I discussed: schools, pricing, trials, and the thing you researched turning out to be exactly what we need.',
                          color: C.gold,
                        }
                      : isResearchCall
                      ? {
                          label: 'Go And Find Out · with Coach Nova',
                          icon: '🎙️',
                          desc: 'Something your uncle mentioned, one thing I am not going to build, and a change in how the two of us work from here.',
                          color: C.gold,
                        }
                      : isLesson19Call
                      ? {
                          label: 'Four Times Now · with Coach Nova',
                          icon: '🎙️',
                          desc: 'I set you homework to find a rule I was still breaking. I have now failed it four times myself, and the fourth one is closer to you than you think.',
                          color: C.gold,
                        }
                      : isLesson17Call
                      ? {
                          label: 'I Found Two More · with Coach Nova',
                          icon: '🎙️',
                          desc: 'Lesson 17 asked you to find a rule I was still breaking. Within an hour of sending it, I found two more myself. Plus two decisions that are yours.',
                          color: C.gold,
                        }
                      : isTabsCall
                      ? {
                          label: 'Five Slots, Six Sections · with Coach Nova',
                          icon: '🎙️',
                          desc: 'Your jump is fixed. Now two decisions that the Flutter app will be built from, and both of them are yours to make.',
                          color: C.gold,
                        }
                      : isAppShellCall
                      ? {
                          label: 'You Were Right Twice · with Coach Nova',
                          icon: '🎙️',
                          desc: 'Your Telugu fix is done and the scroller you argued for is built. Bring your phone: the student dashboard is now an app, and what you make of it decides how we build the Flutter one.',
                          color: C.gold,
                        }
                      : isLesson16Call
                      ? {
                          label: 'You Can Sign In Now · with Coach Nova',
                          icon: '🎙️',
                          desc: 'The door is on. Four accounts, four dashboards, one login. We go through Lesson 16, including a mistake I nearly shipped, and you try to break the guard while I watch.',
                          color: C.gold,
                        }
                      : isLesson15Call
                      ? {
                          label: 'Lesson 15 & One Argument · with Coach Nova',
                          icon: '🎙️',
                          desc: 'Your friend\u2019s language switcher is built and live. We go through Lesson 15, and then I want a proper argument with you about the scroller you asked for.',
                          color: C.gold,
                        }
                      : isRedesign2Call
                      ? {
                          label: 'Picking Up Where We Cut · with Coach Nova',
                          icon: '🎙️',
                          desc: 'The line dropped last time, and we had already been through nearly everything. This one is short. Two questions for you, and then anything you have for me.',
                          color: C.gold,
                        }
                      : isRedesignCall
                      ? {
                          label: 'The Redesign & Today · with Coach Nova',
                          icon: '🎙️',
                          desc: 'The whole site has been redesigned and made to work on a phone, and it is live. Coach Nova goes through what changed, four things that were genuinely broken, and what you both do today.',
                          color: C.gold,
                        }
                      : isAdmin3Call
                      ? {
                          label: 'Every Dashboard Finished · with Coach Nova',
                          icon: '🎙️',
                          desc: 'Reports, Announcements and Settings are live, so all four dashboards are done. Coach Nova goes through the last three and what the final piece really means.',
                          color: C.gold,
                        }
                      : isAdmin2Call
                      ? {
                          label: 'Attendance, Fees & Knowledge Base · with Coach Nova',
                          icon: '🎙️',
                          desc: 'Three more Admin sections, and these are about judgement more than code. Coach Nova will mostly ask you why. Have Lesson 13 ready.',
                          color: C.gold,
                        }
                      : isAdminCall
                      ? {
                          label: 'The Admin Dashboard · with Coach Nova',
                          icon: '🎙️',
                          desc: 'The last dashboard has begun. Coach Nova goes through Overview, Students and Staff, and the screens that can do real harm. Have it open.',
                          color: C.gold,
                        }
                      : isAdminBriefCall
                      ? {
                          label: 'Finishing Up · with Coach Nova',
                          icon: '🎙️',
                          desc: 'Our call cut off with one thing left: the Admin dashboard, why it matters most and why it is the riskiest. A short one.',
                          color: C.gold,
                        }
                      : isParentCall
                      ? {
                          label: 'The Parent Dashboard · with Coach Nova',
                          icon: '🎙️',
                          desc: 'The third dashboard is finished. Coach Nova goes through it and Lesson 11 with you, especially the child switcher. Have it open.',
                          color: C.gold,
                        }
                      : isTeacherFullCall
                      ? {
                          label: 'The Whole Teacher Dashboard · with Coach Nova',
                          icon: '🎙️',
                          desc: 'All eight sections are finished. Coach Nova runs you through the entire Teacher dashboard and you explain it back. You were asked to prepare, so come ready.',
                          color: C.gold,
                        }
                      : isTeacherCall
                      ? {
                          label: 'Teacher Dashboard · with Coach Nova',
                          icon: '🎙️',
                          desc: 'The second dashboard has begun. Coach Nova talks through the Teacher dashboard and Lesson 9, and has you explain it back. Have it open.',
                          color: C.gold,
                        }
                      : isPostAdmission
          ? {
              label: 'Counsellor Session · with Sophie',
              icon: '🎙️',
              desc: 'A longer chat (around 45 minutes) with Sophie, one of our counsellors. She wants to get to know you properly so we can pick the right camp for you.',
              color: C.gold,
            }
          : {
              label: 'Top 50 Interview',
              icon: '🎙️',
              desc: 'A short conversation with Scout — congratulations on reaching the top 50! You\'ll chat about your Challenge project and we\'ll explain scholarships.',
              color: C.gold,
            }

  return (
    <AnimatePresence mode="wait">
      {/* ── Verifying ──────────────────────────── */}
      {phase === 'verifying' && (
        <motion.div
          key="verifying"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={styles.center}
        >
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Verifying your invite…</p>
        </motion.div>
      )}

      {/* ── Error ──────────────────────────────── */}
      {phase === 'error' && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={styles.center}
        >
          <div style={styles.errorIcon}>⚠️</div>
          <h2 style={styles.errorTitle}>Invite Invalid</h2>
          <p style={styles.errorMsg}>{errorMsg}</p>
          <p style={styles.errorHint}>
            Make sure you're using the exact link that was sent to you. If you think this is a mistake, contact{' '}
            <a href="mailto:hello@fizzmind.com" style={{ color: C.gold }}>hello@fizzmind.com</a>.
          </p>
          <a href="https://fizzmind.com" style={styles.backBtn}>← Back to Fizzmind</a>
        </motion.div>
      )}

      {/* ── Welcome / Intro (TRACK TEST) ────────────────────── */}
      {phase === 'welcome' && trackInfo && student && !isInterview && (
        <motion.div
          key="welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={styles.page}
        >
          {/* Ambient glow */}
          <div style={{ ...styles.glow, background: `radial-gradient(circle, ${trackInfo.color}15 0%, transparent 70%)` }} />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={styles.card}
          >
            {/* Badge */}
            <div style={{ ...styles.badge, borderColor: `${trackInfo.color}30`, color: trackInfo.color, background: `${trackInfo.color}10` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: trackInfo.color, display: 'inline-block' }} />
              Track Challenge
            </div>

            <div style={styles.iconLarge}>{trackInfo.icon}</div>

            <h1 style={styles.title}>
              Hi, {student.first_name}! 👋
            </h1>
            <p style={styles.subtitle}>
              You've been invited to complete the{' '}
              <strong style={{ color: trackInfo.color }}>{trackInfo.label}</strong> challenge.
            </p>

            <div style={{ ...styles.infoBox, borderColor: `${trackInfo.color}20`, background: `${trackInfo.color}08` }}>
              <p style={styles.infoText}>{trackInfo.desc}</p>
            </div>

            <div style={styles.rules}>
              {invite.track === 'stem' && (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />30 Python questions · 10 minutes</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Navigate freely — go back and change answers</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />No penalty for guessing</div>
                </>
              )}
              {invite.track === 'arts' && (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />You'll get a creative prompt</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Upload any work: image, video, audio, or document</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Write a short description (max 500 words)</div>
                </>
              )}
              {invite.track === 'business' && (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />15 case study scenarios · 15 minutes</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />No single right answer — we want your thinking</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Navigate back and change answers freely</div>
                </>
              )}
            </div>

            <button
              onClick={() => setPhase('test')}
              style={{ ...styles.startBtn, background: trackInfo.color, color: invite.track === 'stem' ? C.white : C.ink }}
            >
              Start Challenge →
            </button>

            <p style={styles.footerNote}>
              fizzmind — Summer 2026 · {student.email}
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* ── Welcome (INTERVIEW) ────────────────── */}
      {phase === 'welcome' && isInterview && student && (
        <motion.div
          key="welcome-interview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={styles.page}
        >
          <div style={{ ...styles.glow, background: `radial-gradient(circle, ${interviewInfo.color}15 0%, transparent 70%)` }} />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={styles.card}
          >
            <div style={{ ...styles.badge, borderColor: `${interviewInfo.color}30`, color: interviewInfo.color, background: `${interviewInfo.color}10` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: interviewInfo.color, display: 'inline-block' }} />
              {isCodeInterview ? 'Final Round' : isPostCounsellor ? 'Wrap-up Call' : isPostAdmission ? 'Counsellor Session' : isDayOneCheckin ? 'Day 1 Check-in' : isDayTwoCheckin ? 'Day 2 + 3 Review' : isDayThreeFollowup ? 'Follow-up Call' : isWeekendPlan ? 'Weekend Plan' : isPostCampPushback ? 'Post-Camp Call' : isPostCampWrap ? 'Camp Wrap' : isScopeCall ? 'Scope Call' : isIdeaCheckin ? 'Idea Check-in' : isBuildKickoff ? 'Build Kickoff' : isNamingCall ? 'Naming & Next Steps' : isMarketingCall ? 'Marketing & Website' : isFrustratedCall ? 'Pace Call' : isTensraCall ? 'Website & Build Plan' : isNameserverCall ? 'Domain & Hosting' : isHostingUpdateCall ? 'Site Live & App Next' : isInstallCall ? 'Laptop Setup' : isBuildReviewCall ? 'Build Review' : isModulesReviewCall ? 'Four Modules Review' : isModule5Call ? 'Module 5 Review' : isModule6Call ? 'Module 6 Review' : isFullReviewCall ? 'Full Run-Through' : isChatHistoryCall ? 'Finished Dashboard' : isResumeCall ? 'Quick Reconnect' : isTeacherCall ? 'Teacher Dashboard' : isTeacherFullCall ? 'Whole Teacher Dashboard' : isParentCall ? 'Parent Dashboard' : isAdminBriefCall ? 'Finishing Up' : isAdminCall ? 'Admin Dashboard' : isAdmin2Call ? 'Admin, Part 2' : isAdmin3Call ? 'Build Complete' : isRedesignCall ? 'Redesign & Today' : isRedesign2Call ? 'Picking Back Up' : isLesson15Call ? 'Lesson 15' : isLesson16Call ? 'Login Is Live' : isAppShellCall ? 'The App' : isTabsCall ? 'Your Decision' : isLesson17Call ? 'Lesson 17' : isLesson19Call ? 'Lesson 19' : isResearchCall ? 'Your Turn' : isBusinessCall ? 'The Business' : "You're in the top 50"}
            </div>
            <div style={styles.iconLarge}>{interviewInfo.icon}</div>
            <h1 style={styles.title}>
              {isCodeInterview
                ? `Hey ${student.first_name}!`
                : isPostCounsellor
                  ? `A call for ${student.first_name}'s parents.`
                  : isPostAdmission
                    ? `Hi ${student.first_name}, meet Sophie.`
                    : isDayOneCheckin
                      ? `Hey ${student.first_name}, how was Day 1?`
                      : isDayTwoCheckin
                        ? `Hi ${student.first_name}, meet Coach Nova.`
                        : isDayThreeFollowup
                          ? `Hey ${student.first_name}, settle in.`
                          : isWeekendPlan
                            ? `Hey ${student.first_name}, let's plan your weekend.`
                            : isPostCampPushback
                              ? `${student.first_name}, we need to talk.`
                              : isPostCampWrap
                                ? `Hey ${student.first_name}, let's wrap the camp.`
                                : isScopeCall
                                  ? `Hey ${student.first_name}, big news.`
                                  : isIdeaCheckin
                                  ? `Hey ${student.first_name}, quick check-in.`
                                  : isBuildKickoff
                                  ? `Hey ${student.first_name}, let's start building.`
                                  : isNamingCall
                                  ? `Hey ${student.first_name}, let's name it.`
                                  : isMarketingCall
                                  ? `Hey ${student.first_name}, let's get it out there.`
                                  : isFrustratedCall
                                  ? `${student.first_name}, we need to talk.`
                                  : isTensraCall
                                  ? `Hey ${student.first_name}, let's dig in.`
                                  : isNameserverCall
                                  ? `Hey ${student.first_name}, let's get you live.`
                                  : isHostingUpdateCall
                                  ? `Hey ${student.first_name}, you're live.`
                                  : isInstallCall
                                  ? `Hey ${student.first_name}, let's set up.`
                                  : isBuildReviewCall
                                  ? `Hey ${student.first_name}, two sections live.`
                                  : isModulesReviewCall
                                  ? `Hey ${student.first_name}, let's test what you know.`
                                  : isModule5Call
                                  ? `Hey ${student.first_name}, let's finish the set.`
                                  : isModule6Call
                                  ? `Hey ${student.first_name}, today's module.`
                                  : isFullReviewCall
                                  ? `Hey ${student.first_name}, the whole thing.`
                                  : isChatHistoryCall
                                  ? `${student.first_name}, the dashboard is done.`
                                  : isResumeCall
                                  ? `Hey ${student.first_name}, let's reconnect.`
                                  : isTeacherCall
                                  ? `Hey ${student.first_name}, the second dashboard.`
                                  : isTeacherFullCall
                                  ? `${student.first_name}, all eight sections.`
                                  : isParentCall
                                  ? `${student.first_name}, three down.`
                                  : isAdminBriefCall
                                  ? `${student.first_name}, one thing left.`
                                  : isAdminCall
                                  ? `${student.first_name}, the last dashboard.`
                                  : isAdmin2Call
                                  ? `${student.first_name}, three more.`
                                  : isBusinessCall
                                  ? `${student.first_name}, it is Wednesday.`
                                  : isResearchCall
                                  ? `${student.first_name}, your turn to go looking.`
                                  : isLesson19Call
                                  ? `${student.first_name}, four times now.`
                                  : isLesson17Call
                                  ? `${student.first_name}, I found two more.`
                                  : isTabsCall
                                  ? `${student.first_name}, you decide this one.`
                                  : isAppShellCall
                                  ? `${student.first_name}, you were right twice.`
                                  : isLesson16Call
                                  ? `${student.first_name}, you can sign in now.`
                                  : isLesson15Call
                                  ? `${student.first_name}, your friend was right.`
                                  : isRedesign2Call
                                  ? `${student.first_name}, we got cut off.`
                                  : isRedesignCall
                                  ? `${student.first_name}, it looks like a real product now.`
                                  : isAdmin3Call
                                  ? `${student.first_name}, they're all done.`
                                  : `Congratulations, ${student.first_name}!`}
            </h1>
            <p style={styles.subtitle}>
              {isCodeInterview
                ? <>Scout would love to hear about the chatbot you built. Just a quick chat <strong style={{ color: interviewInfo.color }}>3 to 5 minutes</strong>.</>
                : isPostCounsellor
                  ? <>Beverly is one of our coordinators. She has a <strong style={{ color: interviewInfo.color }}>15 to 20 minute call</strong> for the parents, to make sure you understand what {student.first_name} has been picked for and to walk through a decision the family needs to make.</>
                  : isPostAdmission
                    ? <>Sophie is one of our counsellors. She wants to spend <strong style={{ color: interviewInfo.color }}>around 45 minutes</strong> getting to know you properly, so we can pick the right camp for you.</>
                    : isDayOneCheckin
                      ? <>Scout wants to have a quick catch-up with you after your first day. Around <strong style={{ color: interviewInfo.color }}>25 to 30 minutes</strong>. She wants to hear what you learnt and how you are thinking about your project.</>
                      : isDayTwoCheckin
                        ? <>Coach Nova is picking up your project journey from here. A proper review after Days 2 and 3. Around <strong style={{ color: interviewInfo.color }}>30 to 40 minutes</strong>. Your coaches will be listening in. Find a quiet spot.</>
                        : isDayThreeFollowup
                          ? <>Coach Nova wants to catch up properly tonight. This will be a long one, <strong style={{ color: interviewInfo.color }}>60 to 90 minutes</strong>. Go long with your answers — he wants the full story.</>
                          : isWeekendPlan
                            ? <>Beverly is putting your Kuala Lumpur weekend together. Around <strong style={{ color: interviewInfo.color }}>45 to 60 minutes</strong>. She'll walk you through the city and find out what would actually be fun for you.</>
                            : isPostCampPushback
                              ? <>Coach Nova has a serious call to make with you. Around <strong style={{ color: interviewInfo.color }}>35 to 50 minutes</strong>. The camp was fun. The work starts now.</>
                              : isPostCampWrap
                                ? <>Coach Nova wants to wrap the camp side properly and talk through what comes next. Around <strong style={{ color: interviewInfo.color }}>25 to 35 minutes</strong>.</>
                                : isScopeCall
                                  ? <>Coach Nova has an update from your uncle and a working call to scope your project. Around <strong style={{ color: interviewInfo.color }}>30 to 40 minutes</strong>. Find a quiet spot.</>
                                  : isIdeaCheckin
                                  ? <>Coach Nova wants a relaxed catch-up about your project idea. Around <strong style={{ color: interviewInfo.color }}>15 to 20 minutes</strong>. He wants your thoughts and any suggestions.</>
                                  : isBuildKickoff
                                  ? <>Coach Nova will walk you through everything you need to start building. A full <strong style={{ color: interviewInfo.color }}>hour</strong>. Be at your laptop and ready to follow along.</>
                                  : isNamingCall
                                  ? <>Coach Nova wants to talk about naming your service and a few next steps. Around <strong style={{ color: interviewInfo.color }}>20 to 30 minutes</strong>. He also has good news from your uncle.</>
                                  : isMarketingCall
                                  ? <>Coach Nova wants to talk about getting your service out there, by email and a website. Around <strong style={{ color: interviewInfo.color }}>25 to 30 minutes</strong>. Be ready to take a few notes.</>
                                  : isFrustratedCall
                                  ? <>Coach Nova has feedback on your website, an update on the framework, and a serious conversation about your pace. Around <strong style={{ color: interviewInfo.color }}>30 to 40 minutes</strong>.</>
                                  : isTensraCall
                                  ? <>Show Coach Nova the website, fix up the hero, then plan the app build together. <strong style={{ color: interviewInfo.color }}>An hour or more</strong>. Find a quiet spot and settle in.</>
                                  : isNameserverCall
                                  ? <>Coach Nova walks you through pointing <strong style={{ color: interviewInfo.color }}>tensra.app</strong> and lining up hosting, then sets up Saturday to deploy the app together. Find a quiet spot.</>
                                  : isHostingUpdateCall
                                  ? <>Coach Nova has updates: your site is <strong style={{ color: interviewInfo.color }}>live on tensra.app</strong>, built on your design, and the app is nearly ready. Come with your questions.</>
                                  : isInstallCall
                                  ? <>The MSI is clean and ready. Coach Nova walks you through installing <strong style={{ color: interviewInfo.color }}>Android Studio and Flutter</strong> so you can start building. Have your laptop with you.</>
                                  : isBuildReviewCall
                                  ? <>Two sections are live: <strong style={{ color: interviewInfo.color }}>Home and the AI Tutor</strong>. Coach Nova goes through both lessons and your homework, then sets up Section 3. Have the dashboard open.</>
                                  : isModulesReviewCall
                                  ? <>All <strong style={{ color: interviewInfo.color }}>four modules</strong> are live. Coach Nova goes through each one and asks you questions to make sure you understand every function. Have the dashboard and all four lessons ready.</>
                                  : isModule5Call
                                  ? <>The last call cut out, but you have the first four. Now we finish with the <strong style={{ color: interviewInfo.color }}>fifth module</strong>, Timetable and Attendance. Have the dashboard and Lesson 5 ready.</>
                                  : isModule6Call
                                  ? <>Today's module is live: the <strong style={{ color: interviewInfo.color }}>game layer</strong>, Achievements and Leaderboard. Coach Nova explains it and asks you to walk it back. Have the dashboard and Lesson 6 ready.</>
                                  : isFullReviewCall
                                  ? <>Ten of eleven sections are live. Coach Nova runs you through <strong style={{ color: interviewInfo.color }}>everything built so far</strong> and has you explain it back. A longer call. Have the whole dashboard open.</>
                                  : isChatHistoryCall
                                  ? <>The last section, Chat History, is live, so the <strong style={{ color: interviewInfo.color }}>whole Student dashboard is done</strong>. Coach Nova talks it through and tells you what comes next. Have the dashboard open.</>
                                  : isResumeCall
                                  ? <>Our last call <strong style={{ color: interviewInfo.color }}>got cut off</strong>. A quick one to finish anything left, and answer anything you want to ask.</>
                                  : isTeacherCall
                                  ? <>The <strong style={{ color: interviewInfo.color }}>second dashboard</strong> has begun. Coach Nova talks through the Teacher dashboard and Lesson 9, and has you explain it back. Have it open.</>
                                  : isTeacherFullCall
                                  ? <>All <strong style={{ color: interviewInfo.color }}>eight sections</strong> are finished. Coach Nova runs you through the entire Teacher dashboard and you explain it back. You were asked to prepare, so come ready.</>
                                  : isParentCall
                                  ? <>The <strong style={{ color: interviewInfo.color }}>Parent dashboard</strong> is finished, three of four done. Coach Nova goes through it and Lesson 11 with you, especially the child switcher. Have it open.</>
                                  : isAdminBriefCall
                                  ? <>Our call cut off with one thing left: the <strong style={{ color: interviewInfo.color }}>Admin dashboard</strong>, why it matters most and why it is the riskiest. A short one.</>
                                  : isAdminCall
                                  ? <>The last dashboard has begun. Coach Nova goes through Overview, Students and Staff, and the <strong style={{ color: interviewInfo.color }}>screens that can do real harm</strong>. Have it open.</>
                                  : isAdmin2Call
                                  ? <>Attendance, Fees and the Knowledge Base. These are about <strong style={{ color: interviewInfo.color }}>judgement more than code</strong>, so Coach Nova will mostly ask you why. Have Lesson 13 ready.</>
                                  : isBusinessCall
                                  ? <>You go first. Then I have a long update from <strong style={{ color: interviewInfo.color }}>your uncle</strong> about schools, trials and pricing, and it turns out <strong style={{ color: interviewInfo.color }}>your homework is what we actually need</strong>.</>
                                  : isResearchCall
                                  ? <>From here you go and <strong style={{ color: interviewInfo.color }}>find things out</strong> and come back with what you found. Also: what has your uncle been saying he wants changed?</>
                                  : isLesson19Call
                                  ? <>Read Lesson 19 first. Then come and tell me <strong style={{ color: interviewInfo.color }}>which app</strong> the last hundred and twenty eight were hiding in. You are looking at it.</>
                                  : isLesson17Call
                                  ? <>Lesson 17 is sixteen pages, and <strong style={{ color: interviewInfo.color }}>half of it is about a mess I made</strong>. Then two decisions that are yours, and the Flutter app gets built from them.</>
                                  : isTabsCall
                                  ? <>Snap or Timetable, and which four tabs a <strong style={{ color: interviewInfo.color }}>parent</strong> gets. Two real decisions, and <strong style={{ color: interviewInfo.color }}>the Flutter app gets built from your answers</strong>.</>
                                  : isAppShellCall
                                  ? <>Both the things you told me are <strong style={{ color: interviewInfo.color }}>done</strong>. Bring your <strong style={{ color: interviewInfo.color }}>phone</strong>, not your laptop, because you will be using the app while we talk.</>
                                  : isLesson16Call
                                  ? <>Login is <strong style={{ color: interviewInfo.color }}>live</strong>. Read Lesson 16 first, then come with tensra.app open, because you are going to <strong style={{ color: interviewInfo.color }}>try to break the guard</strong> while I watch.</>
                                  : isLesson15Call
                                  ? <>The language switcher is <strong style={{ color: interviewInfo.color }}>built and live</strong>. Read Lesson 15 first, then come and <strong style={{ color: interviewInfo.color }}>argue with me</strong> about the scroller. I have written down why I think you are wrong.</>
                                  : isRedesign2Call
                                  ? <>We had already been through nearly everything, so this one is <strong style={{ color: interviewInfo.color }}>short</strong>. I mostly want to hear <strong style={{ color: interviewInfo.color }}>what you would change</strong>, so have a think before you join.</>
                                  : isRedesignCall
                                  ? <>Every section worked, but it still looked like a template. The whole site has been <strong style={{ color: interviewInfo.color }}>redesigned and made to work on a phone</strong>, and it is live. Have tensra.app open, and your phone next to you.</>
                                  : isAdmin3Call
                                  ? <>Reports, Announcements and Settings are live, so <strong style={{ color: interviewInfo.color }}>all four dashboards are finished</strong>. Coach Nova goes through the last three, and what the final piece really means.</>
                                  : <>Your application made it to the <strong style={{ color: interviewInfo.color }}>top 50</strong>. Before the Challenge brief goes out, Scout wants to have a quick chat.</>}
            </p>
            <div style={{ ...styles.infoBox, borderColor: `${interviewInfo.color}20`, background: `${interviewInfo.color}08` }}>
              <p style={styles.infoText}>{interviewInfo.desc}</p>
            </div>
            <div style={styles.rules}>
              {isCodeInterview ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />About 3 to 5 minutes, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Walk Scout through your bot and how it works</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Speak freely, no wrong answers</div>
                </>
              ) : isPostCounsellor ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />About 15 to 20 minutes, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Beverly will explain what Wild Minds actually is</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />The dates, and an important choice for your family</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Listen, react, ask questions, no pressure</div>
                </>
              ) : isPostAdmission ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />About 45 minutes, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Sophie will ask what you hope to get from camp</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />What kind of group setting works best for you</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Speak freely, this is just a chat</div>
                </>
              ) : isDayOneCheckin ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />About 25 to 30 minutes, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Scout will ask how Day 1 went</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />You'll walk her through your project plan</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Speak freely, take your time</div>
                </>
              ) : isDayTwoCheckin ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />About 30 to 40 minutes, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Your coaches will be listening in</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Walk Coach Nova through Day 2 and Day 3 in detail</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Speak freely, take your time</div>
                </>
              ) : isDayThreeFollowup ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />About 60 to 90 minutes, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Go long — Coach Nova wants the full story</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />He missed today and wants to make up for it</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Find a really quiet spot and settle in</div>
                </>
              ) : isWeekendPlan ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />About 45 to 60 minutes, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Beverly will walk you through Kuala Lumpur</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Tell her what would actually be fun for you</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Go long — short answers will not do tonight</div>
                </>
              ) : isPostCampPushback ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />About 35 to 50 minutes, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Coach Nova is going to be straight with you</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />He has a real project to put on the table</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Go long — and be honest</div>
                </>
              ) : isPostCampWrap ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />About 25 to 35 minutes, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Talk about how the camp went</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Coach Nova will set up the next phase</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Go long — short answers will not do</div>
                </>
              ) : isScopeCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />About 30 to 40 minutes, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Coach Nova has news from your uncle</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />You'll start scoping the project together</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Go long — short answers will not do</div>
                </>
              ) : isIdeaCheckin ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />About 15 to 20 minutes, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Coach Nova wants to hear how you like the idea</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Share any suggestions you have</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Speak freely, take your time</div>
                </>
              ) : isBuildKickoff ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />About 1 hour, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Be at your laptop, ready to build</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Coach Nova walks you through every step</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Ask questions any time</div>
                </>
              ) : isNamingCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />About 20 to 30 minutes, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Think about a name for your service</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Good news from your uncle</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />A couple of next steps to start</div>
                </>
              ) : isMarketingCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />About 25 to 30 minutes, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Marketing your service by email</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Polishing and hosting your website</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Bring your questions</div>
                </>
              ) : isFrustratedCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />About 30 to 40 minutes, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Website feedback, framework update, pace</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Coach Nova will be direct with you tonight</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Go long — short answers will not do</div>
                </>
              ) : isTensraCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />An hour or more, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Show Coach Nova the website and hero</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Plan the app build together</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Bring your questions and ideas</div>
                </>
              ) : isNameserverCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />A proper chat, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Pointing tensra.app and lining up hosting</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Ask your uncle for the details first</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Then Saturday we deploy together</div>
                </>
              ) : isHostingUpdateCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />A quick update chat, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Your site is live on tensra.app</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />To learn how a part was made, email Coach Nova</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />The app is nearly ready, lessons coming</div>
                </>
              ) : isInstallCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />A setup chat, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Have your MSI laptop with you</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Installing Android Studio and Flutter</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />If stuck, we finish it together on Monday</div>
                </>
              ) : isBuildReviewCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />A review chat, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Have the dashboard and both lessons ready</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />We go through your homework together</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Then we line up Section 3, Snap and Ask</div>
                </>
              ) : isModulesReviewCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />An understanding call, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Have the dashboard and all four lessons ready</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Coach Nova asks, you explain every function</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Come ready, no gaps</div>
                </>
              ) : isModule5Call ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />Finishing the review, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />The first four are solid, today is the fifth</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Have the dashboard and Lesson 5 ready</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Timetable and Attendance, then we complete</div>
                </>
              ) : isModule6Call ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />Today's module, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Have the dashboard and Lesson 6 ready</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Achievements and Leaderboard, the game layer</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Coach Nova asks, you explain it back</div>
                </>
              ) : isFullReviewCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />A full run-through, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Have the whole dashboard open</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />We go through all ten sections, you explain them</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />A longer call, come ready</div>
                </>
              ) : isChatHistoryCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />The finished dashboard, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Chat History is live, all eleven sections done</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />We talk it through, and what comes next</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Things move fast from here</div>
                </>
              ) : isResumeCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />A quick reconnect, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Our last call got cut off</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Anything left, and anything you want to ask</div>
                </>
              ) : isBusinessCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />You present first. Ten minutes, no slides.</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Email warming, the textbook technique, tokens</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Then: schools, trials, cold mail and pricing</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />And what your father meant by one dashboard</div>
                </>
              ) : isResearchCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />Voice only, about twenty minutes</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Bring what your uncle said he wants changed</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />One thing I am not going to build, and why</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Then homework that is yours to choose</div>
                </>
              ) : isLesson19Call ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />Read Lesson 19 first, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Bring your phone, tensra.app open</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Leaderboard or Achievements. You still owe me one.</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />And a guess about where I was not looking</div>
                </>
              ) : isLesson17Call ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />Read Lesson 17 first. Check your spam folder.</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Bring your phone, tensra.app open</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Snap or Timetable, and the parent&apos;s four tabs</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />And argue with Part 8 if you disagree</div>
                </>
              ) : isTabsCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />Bring your phone, tensra.app open</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Decision one: Snap or Timetable in the bar</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Decision two: four tabs for a parent, from six</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />And the link you sent me does not work</div>
                </>
              ) : isAppShellCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />Bring your phone. You will be using it.</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />tensra.app/login · aarav@demo.tensra.app · tensra2026</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />I need your verdict on the Telugu translation</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />And whether the five tabs are the right five</div>
                </>
              ) : isLesson16Call ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />Read Lesson 16 before we speak, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Have tensra.app/login open, you will sign in</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Password for all four accounts: tensra2026</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Homework 5 and 7. I want real answers.</div>
                </>
              ) : isLesson15Call ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />Read Lesson 15 before we speak, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Have tensra.app open, laptop and phone</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Switch it to Telugu, we will test it together</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Come ready to argue. I want you to push back.</div>
                </>
              ) : isRedesign2Call ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />Short call, voice only, no starting again</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Have tensra.app open so you can point at things</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Come with at least one thing you would change</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />And an answer about your teacher and your class</div>
                </>
              ) : isRedesignCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />Open tensra.app on the laptop, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Keep your phone next to you, you will need it</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Mostly you looking and telling me what changed</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Then today's plan, and the answer about your class</div>
                </>
              ) : isAdmin3Call ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />The last three sections, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Every dashboard is finished now</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Have Lesson 14 ready, especially Part 4</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Then what the last piece really means</div>
                </>
              ) : isAdmin2Call ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />Three sections, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Have Lesson 13 and the dashboard ready</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Mostly why questions, not how</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Be ready to trace one textbook</div>
                </>
              ) : isAdminCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />The Admin dashboard, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Have it open and Lesson 12 ready</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Try the bin button on Students first</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Coach Nova asks, you explain it back</div>
                </>
              ) : isAdminBriefCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />A short one, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />We are not redoing the Parent dashboard</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Just the last bit: the Admin dashboard</div>
                </>
              ) : isParentCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />The Parent dashboard, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Have it open and Lesson 11 ready</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Try the child switcher before we start</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Coach Nova asks, you explain it back</div>
                </>
              ) : isTeacherFullCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />All eight sections, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Have the whole Teacher dashboard open</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />You were asked to prepare, so come ready</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Coach Nova asks, you explain every section</div>
                </>
              ) : isTeacherCall ? (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />The Teacher dashboard, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Have it open and Lesson 9 ready</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Coach Nova asks, you explain it back</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Then what comes next</div>
                </>
              ) : (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />About 10 minutes, voice only</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Scout will ask about your Challenge project idea</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />We'll also explain how scholarships work</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Speak freely — no wrong answers</div>
                </>
              )}
            </div>
            <button
              onClick={() => setPhase('interview')}
              style={{ ...styles.startBtn, background: interviewInfo.color, color: `${C.ground}` }}
            >
              {isCodeInterview ? 'Start Chat →' : isPostCounsellor ? 'Start Call with Beverly →' : isPostAdmission ? 'Start Session with Sophie →' : isDayOneCheckin ? 'Start Check-in with Scout →' : isDayTwoCheckin ? 'Start Review with Coach Nova →' : isDayThreeFollowup ? 'Start Call with Coach Nova →' : isWeekendPlan ? 'Start Weekend Plan with Beverly →' : isPostCampPushback ? 'Start Call with Coach Nova →' : isPostCampWrap ? 'Start Wrap with Coach Nova →' : isScopeCall ? 'Start Scope Call with Coach Nova →' : isIdeaCheckin ? 'Start Check-in with Coach Nova →' : isBuildKickoff ? 'Start Build Kickoff with Coach Nova →' : isNamingCall ? 'Start Call with Coach Nova →' : isMarketingCall ? 'Start Call with Coach Nova →' : isFrustratedCall ? 'Start Call with Coach Nova →' : isTensraCall ? 'Start Call with Coach Nova →' : isNameserverCall ? 'Start Call with Coach Nova →' : isHostingUpdateCall ? 'Start Call with Coach Nova →' : isInstallCall ? 'Start Call with Coach Nova →' : isBuildReviewCall ? 'Start Call with Coach Nova →' : isModulesReviewCall ? 'Start Call with Coach Nova →' : isModule5Call ? 'Start Call with Coach Nova →' : isModule6Call ? 'Start Call with Coach Nova →' : isFullReviewCall ? 'Start Call with Coach Nova →' : isChatHistoryCall ? 'Start Call with Coach Nova →' : isResumeCall ? 'Start Call with Coach Nova →' : isTeacherCall ? 'Start Call with Coach Nova →' : isTeacherFullCall ? 'Start Call with Coach Nova →' : isParentCall ? 'Start Call with Coach Nova →' : isAdminBriefCall ? 'Start Call with Coach Nova →' : isAdminCall ? 'Start Call with Coach Nova →' : isAdmin2Call ? 'Start Call with Coach Nova →' : isAdmin3Call ? 'Start Call with Coach Nova →' : isRedesignCall ? 'Start Call with Coach Nova →' : isRedesign2Call ? 'Start Call with Coach Nova →' : isLesson15Call ? 'Start Call with Coach Nova →' : isLesson16Call ? 'Start Call with Coach Nova →' : isAppShellCall ? 'Start Call with Coach Nova →' : isTabsCall ? 'Start Call with Coach Nova →' : isLesson17Call ? 'Start Call with Coach Nova →' : isLesson19Call ? 'Start Call with Coach Nova →' : isResearchCall ? 'Start Call with Coach Nova →' : isBusinessCall ? 'Start Call with Coach Nova →' : 'Start Interview →'}
            </button>
            <p style={styles.footerNote}>fizzmind — Summer 2026 · {student.email}</p>
          </motion.div>
        </motion.div>
      )}

      {/* ── Interview (Voice #2) ───────────────── */}
      {phase === 'interview' && invite && config && (
        <motion.div key="interview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <VoiceInterview
            config={{
              ...config,
              track: invite.track,
              apiKey: import.meta.env.VITE_GEMINI_API_KEY,
              studentContext: invite.metadata?.student_context ?? null,
              interviewType: invite.type,
              inviteVariant: invite.metadata?.invite_variant ?? null,
            }}
            onComplete={handleInterviewComplete}
          />
        </motion.div>
      )}

      {/* ── Interview Done ─────────────────────── */}
      {phase === 'interview-done' && student && (
        <ThankYou
          studentName={`${student.first_name} ${student.last_name}`.trim()}
          customMessage={isCodeInterview
            ? "Thanks for the chat! The team will be in touch by email within a day or two with everything you need to know."
            : isPostCounsellor
              ? "Thanks for the call! Watch out for the email from us. It will have the camp details and the full prep list so your family can book flights and get you set."
              : isPostAdmission
                ? "Thanks for chatting with Sophie! She will share what you talked about with the team picking your camp. We will get back to your family soon with the next step."
                : "Thanks for the chat! Keep an eye on your email — your Challenge brief will arrive soon with all the details. You'll have about a week to work on it."}
          onReset={onReset}
        />
      )}

      {/* ── Test ───────────────────────────────── */}
      {phase === 'test' && invite && !isInterview && (
        <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {invite.track === 'stem' && (
            <PythonQuiz config={config} onComplete={handleTestComplete} />
          )}
          {invite.track === 'arts' && (
            <ArtsTest config={config} onComplete={handleTestComplete} />
          )}
          {invite.track === 'business' && (
            <BusinessTest config={config} onComplete={handleTestComplete} />
          )}
        </motion.div>
      )}

      {/* ── Results ────────────────────────────── */}
      {phase === 'results' && testResults && (
        <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Results results={testResults} onReset={onReset} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const styles = {
  page: {
    width: '100%',
    minHeight: '100vh',
    background: C.ink,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '700px',
    height: '500px',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  card: {
    maxWidth: '540px',
    width: '100%',
    background: W[4],
    border: `1px solid ${W[8]}`,
    borderRadius: '24px',
    padding: '48px 40px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
    backdropFilter: 'blur(20px)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    border: '1px solid',
    borderRadius: '99px',
    padding: '5px 14px',
    marginBottom: '24px',
  },
  iconLarge: {
    fontSize: '56px',
    marginBottom: '20px',
    lineHeight: 1,
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '28px',
    fontWeight: '700',
    color: C.white,
    margin: '0 0 10px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '16px',
    color: W[60],
    lineHeight: 1.6,
    margin: '0 0 24px',
  },
  infoBox: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '16px 20px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  infoText: {
    fontSize: '14px',
    color: W[60],
    lineHeight: 1.6,
    margin: 0,
  },
  rules: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '32px',
    textAlign: 'left',
  },
  rule: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: W[60],
  },
  ruleDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: W[25],
    flexShrink: 0,
  },
  startBtn: {
    width: '100%',
    padding: '14px 32px',
    borderRadius: '99px',
    border: 'none',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '0.01em',
    transition: 'all 0.2s',
    marginBottom: '24px',
  },
  footerNote: {
    fontSize: '11px',
    color: W[15],
    margin: 0,
  },
  center: {
    width: '100%',
    minHeight: '100vh',
    background: C.ink,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: `3px solid ${tint(C.gold, 15)}`,
    borderTop: `3px solid ${C.gold}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '16px',
  },
  loadingText: {
    fontSize: '14px',
    color: W[35],
  },
  errorIcon: { fontSize: '48px', marginBottom: '16px' },
  errorTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '24px',
    fontWeight: '700',
    color: C.white,
    margin: '0 0 12px',
  },
  errorMsg: {
    fontSize: '16px',
    color: W[60],
    margin: '0 0 12px',
  },
  errorHint: {
    fontSize: '13px',
    color: W[35],
    maxWidth: '400px',
    lineHeight: 1.6,
    margin: '0 0 32px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 28px',
    borderRadius: '99px',
    background: W[4],
    color: W[60],
    border: `1px solid ${W[8]}`,
    fontSize: '14px',
    fontWeight: '500',
    textDecoration: 'none',
  },
}
