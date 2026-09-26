/**
 * Every word on the site lives here, so it can be proofread in one place.
 *
 * Malayalam strings are in `ml` fields and are rendered with
 * data-verify="malayalam" until a native reader has confirmed them.
 * When confirmed, set MALAYALAM_VERIFIED = true.
 */
export const MALAYALAM_VERIFIED = true

export const event = {
  title: 'Onam Sadhya',
  dayLabel: 'Saturday, 10 October',
  timeLabel: '11 am',
  /** ISO start/end in IST, used for the calendar file. */
  startIST: '2026-10-10T11:00:00+05:30',
  endIST: '2026-10-10T15:00:00+05:30',
  venue: 'Confident Bellatrix',
  addressLines: ['Billapura Cross, Sarjapura', 'Bangalore'],
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Confident Bellatrix, Billapura Cross, Sarjapura, Bangalore'),
  food: 'A traditional Onam Sadhya, served on banana leaf. Vegetarian.',
  dress: 'Traditional Kerala attire: kasavu mundu, set-saree, or whatever makes you feel festive.',
  /** Google Form link goes here. Until then RSVP opens this site in a new tab. */
  rsvpUrl: null as string | null,
}

export const copy = {
  backwater: {
    kicker: 'Onam came and went.',
    headline: 'Every year, Kerala waits for one guest.',
    turn: 'This year, we waited a little longer. For you.',
  },
  paddy: {
    line: 'Come the long way. Past the paddy, under the palms.',
  },
  padippura: {
    lintel: { ml: 'സ്വാഗതം', roman: 'swaagatham', en: 'welcome' },
  },
  pookalam: {
    intro: 'For ten mornings, the courtyard gets a new ring of flowers.',
    outro: 'On the last morning, it is finished. Now it only needs guests.',
    days: [
      { en: 'Atham', ml: 'അത്തം' },
      { en: 'Chithira', ml: 'ചിത്തിര' },
      { en: 'Chothi', ml: 'ചോതി' },
      { en: 'Vishakham', ml: 'വിശാഖം' },
      { en: 'Anizham', ml: 'അനിഴം' },
      { en: 'Thriketta', ml: 'തൃക്കേട്ട' },
      { en: 'Moolam', ml: 'മൂലം' },
      { en: 'Pooradam', ml: 'പൂരാടം' },
      { en: 'Uthradam', ml: 'ഉത്രാടം' },
      { en: 'Thiruvonam', ml: 'തിരുവോണം' },
    ],
  },
  nadumuttam: {
    lead: 'Under the open sky in the middle of the house, the news:',
    beamLead: 'You are invited to an',
  },
  row: {
    intro: 'Everything arrives in its order.',
    song: { ml: 'മാനുഷരെല്ലാരുമൊന്നുപോലെ', roman: 'Maanusharellaarum onnupole', en: 'Everyone, as one.' },
    songNote: 'From the old Onam song about Maveli’s time, when all people were equal.',
    /** One line per leaf in the row; the leaf shows everything served up to that point. */
    stages: [
      'Salt, chips and pappadam go down first.',
      'Then the pickles, and a small banana at the corner.',
      'The first curries arrive, left to right.',
      'Avial, olan, kaalan, erissery.',
      'Rice, with parippu and a spoon of ghee.',
      'Sambar over the rice. Then the payasam.',
    ],
    emptyPlace: 'One place is still empty.',
  },
  yourLeaf: {
    line: 'And this one is yours.',
    foldNote: 'In Kerala, you fold your leaf towards you when you’ve eaten well. We’re counting on it.',
    cardKicker: 'You’re invited to an',
    rsvp: 'RSVP',
    maps: 'Open in Maps',
    calendar: 'Add to calendar',
    signoff: { ml: 'ഓണാശംസകൾ', roman: 'Onashamsakal', en: 'Happy Onam, a little late.' },
  },
  chrome: {
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    details: 'Invitation details',
  },
}

/**
 * The Sadhya, in serving order. `stage` is the leaf in the row where the item
 * first appears (0-based). Positions are in the diner's frame on a leaf whose
 * tip points to the diner's left: x 0 (tip) → 1000 (cut end), y 0 (far edge) → 400 (near edge).
 */
export type DishKind = 'salt' | 'upperi' | 'varatti' | 'pappadam' | 'pickle' | 'pazham' | 'curry' | 'rice' | 'parippu' | 'ghee' | 'sambar' | 'payasam'
export interface Dish { id: string; name: string; ml?: string; kind: DishKind; stage: number; x: number; y: number; r: number; color: string; fleck?: string }

export const sadhya: Dish[] = [
  { id: 'salt', name: 'Salt', kind: 'salt', stage: 0, x: 150, y: 70, r: 14, color: '#f7f5ef' },
  { id: 'upperi', name: 'Banana chips', ml: 'ഉപ്പേരി', kind: 'upperi', stage: 0, x: 225, y: 85, r: 38, color: '#e9b82e' },
  { id: 'varatti', name: 'Sharkara varatti', kind: 'varatti', stage: 0, x: 305, y: 75, r: 30, color: '#8a4a1c' },
  { id: 'pappadam', name: 'Pappadam', kind: 'pappadam', stage: 0, x: 175, y: 215, r: 64, color: '#eadcb4' },
  { id: 'naranga', name: 'Lime pickle', kind: 'pickle', stage: 1, x: 120, y: 140, r: 20, color: '#c28a1e', fleck: '#6b3d12' },
  { id: 'manga', name: 'Mango pickle', kind: 'pickle', stage: 1, x: 380, y: 70, r: 22, color: '#b8431c', fleck: '#e3a04a' },
  { id: 'puliinji', name: 'Puli inji', kind: 'pickle', stage: 1, x: 445, y: 72, r: 20, color: '#5a2413', fleck: '#c8762a' },
  { id: 'pazham', name: 'Banana', ml: 'പഴം', kind: 'pazham', stage: 1, x: 150, y: 330, r: 58, color: '#e8c33f' },
  { id: 'kichadi', name: 'Kichadi', kind: 'curry', stage: 2, x: 515, y: 80, r: 30, color: '#e9e2cf', fleck: '#8aa447' },
  { id: 'pachadi', name: 'Pineapple pachadi', kind: 'curry', stage: 2, x: 585, y: 78, r: 30, color: '#e3b62c', fleck: '#7a2a4a' },
  { id: 'thoran', name: 'Thoran', kind: 'curry', stage: 2, x: 655, y: 84, r: 32, color: '#6f9a34', fleck: '#f1ead6' },
  { id: 'avial', name: 'Avial', kind: 'curry', stage: 3, x: 730, y: 88, r: 36, color: '#e6dcb8', fleck: '#d9722a' },
  { id: 'olan', name: 'Olan', kind: 'curry', stage: 3, x: 805, y: 84, r: 30, color: '#f0ecde', fleck: '#9bbf6a' },
  { id: 'kaalan', name: 'Kaalan', kind: 'curry', stage: 3, x: 870, y: 92, r: 30, color: '#e2b640', fleck: '#8a5a1a' },
  { id: 'erissery', name: 'Erissery', kind: 'curry', stage: 3, x: 925, y: 150, r: 30, color: '#d9782a', fleck: '#3a1a10' },
  { id: 'rice', name: 'Matta rice', ml: 'ചോറ്', kind: 'rice', stage: 4, x: 560, y: 262, r: 110, color: '#ead6c2', fleck: '#a14f2e' },
  { id: 'parippu', name: 'Parippu', kind: 'parippu', stage: 4, x: 480, y: 250, r: 46, color: '#e6b83a' },
  { id: 'ghee', name: 'Ghee', kind: 'ghee', stage: 4, x: 470, y: 244, r: 13, color: '#f5d77a' },
  { id: 'sambar', name: 'Sambar', kind: 'sambar', stage: 5, x: 640, y: 282, r: 56, color: '#b8561e', fleck: '#e8c070' },
  { id: 'payasam', name: 'Ada pradhaman', kind: 'payasam', stage: 5, x: 820, y: 270, r: 60, color: '#8a5424', fleck: '#e9d3a8' },
]

export const SADHYA_STAGES = 6
