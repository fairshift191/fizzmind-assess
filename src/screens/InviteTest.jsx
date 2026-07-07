import { useState, useEffect } from 'react'
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
    color: '#3B82F6',
  },
  arts: {
    label: 'Creative Arts',
    icon: '🎨',
    desc: 'A creative prompt — upload your work (image, video, audio) and write a short description.',
    color: '#EC4899',
  },
  business: {
    label: 'Business & Entrepreneurship',
    icon: '💡',
    desc: '15 case study questions — strategic thinking scenarios, 15 minutes.',
    color: '#F59E0B',
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
  const trackInfo = invite && !isInterview ? TRACK_INFO[invite.track] : null
  const interviewInfo = isCodeInterview
    ? {
        label: 'Code Interpretation',
        icon: '💬',
        desc: 'A short chat with Scout about the chatbot you built. Just a few minutes — walk her through what you made and how it works.',
        color: '#C9963A',
      }
    : isPostCounsellor
      ? {
          label: 'Parent Call · with Beverly',
          icon: '🎙️',
          desc: 'A 15 to 20 minute call with Beverly, one of our coordinators, intended for the parents. Beverly will walk you through what the Wild Minds Fellowship actually is, the dates, and an important choice for your family.',
          color: '#C9963A',
        }
      : isDayOneCheckin
        ? {
            label: 'Day 1 Check-in · with Scout',
            icon: '🎙️',
            desc: 'A short, friendly catch-up with Scout after your first day of the Fellowship. Just a few minutes — she wants to hear how it went.',
            color: '#C9963A',
          }
        : isDayTwoCheckin
          ? {
              label: 'Day 2 + 3 Review · with Coach Nova',
              icon: '🎙️',
              desc: 'A proper review chat with Coach Nova after Days 2 and 3. Around 30 to 40 minutes. Your coaches will be listening in. Find a quiet spot.',
              color: '#C9963A',
            }
          : isDayThreeFollowup
            ? {
                label: 'Follow-up Call · with Coach Nova',
                icon: '🎙️',
                desc: 'A long catch-up with Coach Nova. Around 60 to 90 minutes. He wants the full picture of your day, your project thinking, and a proper chat about what you love. Find a really quiet spot and settle in.',
                color: '#C9963A',
              }
            : isWeekendPlan
              ? {
                  label: 'Weekend Plan · with Beverly',
                  icon: '🎙️',
                  desc: 'A long chat with Beverly to plan your weekend in Kuala Lumpur. Around 45 to 60 minutes. She wants to know what would actually make this weekend yours.',
                  color: '#C9963A',
                }
              : isPostCampPushback
                ? {
                    label: 'Post-Camp Call · with Coach Nova',
                    icon: '🎙️',
                    desc: 'A serious call with Coach Nova. The camp was fun. The work starts now. 35 to 50 minutes. Find a quiet spot and be ready to be straight.',
                    color: '#C9963A',
                  }
                : isPostCampWrap
                  ? {
                      label: 'Camp Wrap · with Coach Nova',
                      icon: '🎙️',
                      desc: 'A warm wrap-up with Coach Nova. The camp is done. Time to talk about how it went and what comes next. 25 to 35 minutes.',
                      color: '#C9963A',
                    }
                  : isScopeCall
                    ? {
                        label: 'Scope Call · with Coach Nova',
                        icon: '🎙️',
                        desc: 'A working call with Coach Nova. The school AI is a go. Time to start scoping the project. 30 to 40 minutes.',
                        color: '#C9963A',
                      }
                    : isIdeaCheckin
                    ? {
                        label: 'Idea Check-in · with Coach Nova',
                        icon: '🎙️',
                        desc: 'A relaxed call with Coach Nova. He wants to hear how you like the project idea, any suggestions you have, and to set your next step. About 15 to 20 minutes.',
                        color: '#C9963A',
                      }
                    : isBuildKickoff
                    ? {
                        label: 'Build Kickoff · with Coach Nova',
                        icon: '🎙️',
                        desc: 'A full hour with Coach Nova. He walks you through everything you need to do to start building, step by step, and stays with you after. Be at your laptop. About 1 hour.',
                        color: '#C9963A',
                      }
                    : isNamingCall
                    ? {
                        label: 'Naming & Next Steps · with Coach Nova',
                        icon: '🎙️',
                        desc: 'A chat with Coach Nova about naming your service, a few next steps, and some good news from your uncle. About 20 to 30 minutes.',
                        color: '#C9963A',
                      }
                    : isMarketingCall
                    ? {
                        label: 'Marketing & Website · with Coach Nova',
                        icon: '🎙️',
                        desc: 'A working call with Coach Nova about getting your service out there, by email and a website. About 25 to 30 minutes.',
                        color: '#C9963A',
                      }
                    : isFrustratedCall
                      ? {
                          label: 'Pace Call · with Coach Nova',
                          icon: '🎙️',
                          desc: 'A direct call with Coach Nova about pace, website feedback, and the project framework. 30 to 40 minutes. Find a quiet spot.',
                          color: '#C9963A',
                        }
                      : isTensraCall
                      ? {
                          label: 'Website Review & Build Plan · with Coach Nova',
                          icon: '🎙️',
                          desc: 'Show Coach Nova the website, sort out the hero, then plan the app build together. A long one, an hour or more. Find a quiet spot and settle in.',
                          color: '#C9963A',
                        }
                      : isPostAdmission
          ? {
              label: 'Counsellor Session · with Sophie',
              icon: '🎙️',
              desc: 'A longer chat (around 45 minutes) with Sophie, one of our counsellors. She wants to get to know you properly so we can pick the right camp for you.',
              color: '#C9963A',
            }
          : {
              label: 'Top 50 Interview',
              icon: '🎙️',
              desc: 'A short conversation with Scout — congratulations on reaching the top 50! You\'ll chat about your Challenge project and we\'ll explain scholarships.',
              color: '#C9963A',
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
            <a href="mailto:hello@fizzmind.com" style={{ color: '#C9963A' }}>hello@fizzmind.com</a>.
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
              style={{ ...styles.startBtn, background: trackInfo.color, color: invite.track === 'stem' ? '#fff' : '#06060B' }}
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
              {isCodeInterview ? 'Final Round' : isPostCounsellor ? 'Wrap-up Call' : isPostAdmission ? 'Counsellor Session' : isDayOneCheckin ? 'Day 1 Check-in' : isDayTwoCheckin ? 'Day 2 + 3 Review' : isDayThreeFollowup ? 'Follow-up Call' : isWeekendPlan ? 'Weekend Plan' : isPostCampPushback ? 'Post-Camp Call' : isPostCampWrap ? 'Camp Wrap' : isScopeCall ? 'Scope Call' : isIdeaCheckin ? 'Idea Check-in' : isBuildKickoff ? 'Build Kickoff' : isNamingCall ? 'Naming & Next Steps' : isMarketingCall ? 'Marketing & Website' : isFrustratedCall ? 'Pace Call' : isTensraCall ? 'Website & Build Plan' : "You're in the top 50"}
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
              style={{ ...styles.startBtn, background: interviewInfo.color, color: '#0D0F12' }}
            >
              {isCodeInterview ? 'Start Chat →' : isPostCounsellor ? 'Start Call with Beverly →' : isPostAdmission ? 'Start Session with Sophie →' : isDayOneCheckin ? 'Start Check-in with Scout →' : isDayTwoCheckin ? 'Start Review with Coach Nova →' : isDayThreeFollowup ? 'Start Call with Coach Nova →' : isWeekendPlan ? 'Start Weekend Plan with Beverly →' : isPostCampPushback ? 'Start Call with Coach Nova →' : isPostCampWrap ? 'Start Wrap with Coach Nova →' : isScopeCall ? 'Start Scope Call with Coach Nova →' : isIdeaCheckin ? 'Start Check-in with Coach Nova →' : isBuildKickoff ? 'Start Build Kickoff with Coach Nova →' : isNamingCall ? 'Start Call with Coach Nova →' : isMarketingCall ? 'Start Call with Coach Nova →' : isFrustratedCall ? 'Start Call with Coach Nova →' : 'Start Interview →'}
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
    background: '#06060B',
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
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
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
    color: '#fff',
    margin: '0 0 10px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.65)',
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
    color: 'rgba(255,255,255,0.6)',
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
    color: 'rgba(255,255,255,0.55)',
  },
  ruleDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.3)',
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
    color: 'rgba(255,255,255,0.2)',
    margin: 0,
  },
  center: {
    width: '100%',
    minHeight: '100vh',
    background: '#06060B',
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
    border: '3px solid rgba(201,150,58,0.15)',
    borderTop: '3px solid #C9963A',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '16px',
  },
  loadingText: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.4)',
  },
  errorIcon: { fontSize: '48px', marginBottom: '16px' },
  errorTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '24px',
    fontWeight: '700',
    color: '#fff',
    margin: '0 0 12px',
  },
  errorMsg: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.6)',
    margin: '0 0 12px',
  },
  errorHint: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.35)',
    maxWidth: '400px',
    lineHeight: 1.6,
    margin: '0 0 32px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 28px',
    borderRadius: '99px',
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: '14px',
    fontWeight: '500',
    textDecoration: 'none',
  },
}
