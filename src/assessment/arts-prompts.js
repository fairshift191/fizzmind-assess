/**
 * Creative Arts Test — Prompts
 * One is randomly selected for each student.
 */
export const ARTS_PROMPTS = [
  {
    id: 'innovation',
    title: 'What Does Innovation Look Like?',
    prompt: 'Create something — a drawing, painting, photo, short video, digital design, or any visual piece — that represents what "innovation" means to you. There are no rules. It could be abstract, literal, weird, beautiful, funny, or all of the above.',
    hint: 'Think about: what does it feel like to invent something new? What colour is a breakthrough? What shape is curiosity?',
  },
  {
    id: 'world-2050',
    title: 'A Day in 2050',
    prompt: 'Imagine the world in 2050. Create a visual piece — drawing, collage, digital art, photo series, or short video — showing a single moment from an ordinary day in that future. What does breakfast look like? How do kids get to school? What do friendships look like?',
    hint: 'The best pieces don\'t show flying cars. They show the small, human details of a changed world.',
  },
  {
    id: 'sound-to-sight',
    title: 'Sound to Sight',
    prompt: 'Listen to a song that gives you strong feelings. Now create a visual piece that captures what that song makes you feel — not what it\'s about, but how it makes you FEEL. Any medium: paint, pencil, digital, photo, video.',
    hint: 'Close your eyes and listen first. What colours come to mind? What shapes? What textures? Now put them on paper (or screen).',
  },
  {
    id: 'hidden-story',
    title: 'The Hidden Story',
    prompt: 'Find an ordinary object in your home — a chair, a cup, a shoe, anything. Create a piece (photo series, short film, drawing, or written story with illustrations) that tells the secret life of that object. What does it dream about? Where has it been? What has it witnessed?',
    hint: 'The most ordinary objects often have the most extraordinary stories. A coffee mug that has heard every family secret. A doorknob that has felt a thousand emotions.',
  },
  {
    id: 'remix',
    title: 'The Remix',
    prompt: 'Take a famous artwork, poster, album cover, or movie scene and remix it. Change the time period, the style, the medium, or the message — but keep something recognizable from the original. Show us your version and explain what you changed and why.',
    hint: 'This is about creative transformation. A Renaissance painting reimagined as street art. A movie poster redesigned for a different audience. Your interpretation matters more than technical perfection.',
  },
]

/**
 * Get a random arts prompt.
 */
export function getRandomArtsPrompt() {
  return ARTS_PROMPTS[Math.floor(Math.random() * ARTS_PROMPTS.length)]
}
