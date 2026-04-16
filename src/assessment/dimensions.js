/**
 * Summer Camp Assessment — Data Constants
 */

export const CAMPS = [
  { id: 'kl-weekend', name: 'Malaysia Weekend', country: 'Malaysia', emoji: '\u{1F332}', duration: '2 days', description: 'Overnight camp in Kuala Lumpur — perfect first Fizzmind experience. June 7–8, $299.' },
  { id: 'kl-short', name: 'Malaysia Short', country: 'Malaysia', emoji: '\u{1F332}', duration: '4 days', description: 'Short immersive in Kuala Lumpur — real projects and friendships. June 11–14, $999.' },
  { id: 'kl-full', name: 'Malaysia Full', country: 'Malaysia', emoji: '\u{1F332}', duration: '8 days', description: 'The complete Fizzmind Malaysia experience in Kuala Lumpur. June 16–23, $1,799.' },
  { id: 'dubai', name: 'Dubai', country: 'UAE', emoji: '\u{1F3D9}\u{FE0F}', duration: '1 week', description: 'Futuristic city meets desert adventure. Two cohorts: June 28 and July 6. $2,499.' },
  { id: 'riyadh', name: 'Riyadh AI Summit', country: 'Saudi Arabia', emoji: '\u{1F1F8}\u{1F1E6}', duration: '1 week', description: 'AI capital of the world, timed with AI summit season. July 14–20, $2,499.' },
  { id: 'sg', name: 'Singapore', country: 'Singapore', emoji: '\u{1F981}', duration: '1 week', description: 'Asia\'s innovation hub — robotics labs, smart city, and multicultural exchange. July 22–28, $2,499.' },
  { id: 'estonia', name: 'Estonia', country: 'Estonia', emoji: '\u{1F1EA}\u{1F1EA}', duration: '1 week', description: 'Europe\'s most digital nation — startup culture, medieval meets tech. August 3–9, $2,499.' },
  { id: 'usa', name: 'USA', country: 'USA', emoji: '\u{1F31E}', duration: '2 weeks', description: 'The flagship — Silicon Valley or New York City. The deepest, most ambitious camp. August 11–24, $3,999.' },
]

export const TRACKS = [
  { id: 'stem', name: 'STEM & AI', emoji: '\u{1F52C}', description: 'Build robots, train AI models, code in Python, drone racing, 3D printing, hardware hacking — real projects, not textbooks', color: '#3B82F6' },
  { id: 'arts', name: 'Creative Arts', emoji: '\u{1F3A8}', description: 'Filmmaking, street art, music production, digital design, improv comedy, photography adventures — create and perform', color: '#EC4899' },
  { id: 'business', name: 'Business & Entrepreneurship', emoji: '\u{1F680}', description: 'Build a real business in one week, pitch to judges, debate tournaments, social impact projects — lead by doing', color: '#F59E0B' },
]

export const DIMENSIONS = [
  { id: 'age_grade', name: 'Age & Grade', icon: '\u{1F393}', maxScore: 10, description: 'Age appropriateness and academic level' },
  { id: 'interests', name: 'Interests & Passions', icon: '\u{2B50}', maxScore: 10, description: 'What excites and motivates the student' },
  { id: 'projects', name: 'Projects & Accomplishments', icon: '\u{1F680}', maxScore: 10, description: 'What they have built, created, or achieved — depth and sophistication of hands-on work' },
  { id: 'collaboration', name: 'Collaboration Style', icon: '\u{1F91D}', maxScore: 10, description: 'How they work with and relate to others' },
  { id: 'language', name: 'Language Proficiency', icon: '\u{1F4AC}', maxScore: 10, description: 'Communication skills and language abilities' },
  { id: 'experience', name: 'Camp & Travel Experience', icon: '\u{1F30D}', maxScore: 10, description: 'Prior camp, travel, or independence experience' },
  { id: 'motivation', name: 'Motivation & Why Us', icon: '\u{1F525}', maxScore: 10, description: 'Why they want to join THIS camp, clarity of goals, what they seek, what they would contribute' },
  { id: 'independence', name: 'Independence & Comfort', icon: '\u{1F4AA}', maxScore: 10, description: 'Comfort level being away from home and trying new things' },
]
