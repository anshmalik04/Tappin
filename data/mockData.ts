export type HeatLevel = 'hot' | 'warm' | 'mild' | 'quiet';

export interface Venue {
  id: string;
  name: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  heatLevel: HeatLevel;
  cover: string;
  peakHours: string;
  vibe: string;
  tags: string[];
  distance: string;
  hours: string;
  demographics: { label: string; percentage: number }[];
  traffic: { hour: string; level: number }[];
  coverInfo: string;
}

export interface User {
  id: string;
  name: string;
  age: number;
  bio: string;
  initial: string;
  personality: string[];
  musicTaste: string[];
  matchPercent: number;
  currentVenue?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface ChatThread {
  userId: string;
  messages: Message[];
  meetupSpot?: string;
}

export interface Event {
  id: string;
  name: string;
  time: string;
  interestedCount: number;
  distance: string;
  venue: string;
}

export const venues: Venue[] = [
  {
    id: '1',
    name: "McGillin's Olde Ale House",
    type: 'Bar',
    address: '1310 Drury St, Philadelphia, PA',
    latitude: 39.9515,
    longitude: -75.1627,
    heatLevel: 'hot',
    cover: '$5',
    peakHours: '9–11pm',
    vibe: 'Lively',
    tags: ['🔥 Hot right now', '21-28 avg', '♫ DJ set'],
    distance: '0.3 mi',
    hours: 'Open until 2am',
    demographics: [
      { label: '21-25', percentage: 45 },
      { label: '26-30', percentage: 35 },
      { label: '31+', percentage: 20 },
    ],
    traffic: [
      { hour: '6pm', level: 20 },
      { hour: '7pm', level: 35 },
      { hour: '8pm', level: 55 },
      { hour: '9pm', level: 80 },
      { hour: '10pm', level: 95 },
      { hour: '11pm', level: 90 },
      { hour: '12am', level: 75 },
      { hour: '1am', level: 50 },
      { hour: '2am', level: 25 },
    ],
    coverInfo: '$5 before 10pm · $10 after · Free entry with guest list',
  },
  {
    id: '2',
    name: 'Yards Brewing Company',
    type: 'Bar & Brewery',
    address: '500 Spring Garden St, Philadelphia, PA',
    latitude: 39.9612,
    longitude: -75.1455,
    heatLevel: 'warm',
    cover: 'Free',
    peakHours: '8–10pm',
    vibe: 'Chill',
    tags: ['🌡 Warming up', '25-35 avg', '🍺 Craft beers'],
    distance: '1.1 mi',
    hours: 'Open until 1am',
    demographics: [
      { label: '21-25', percentage: 30 },
      { label: '26-30', percentage: 45 },
      { label: '31+', percentage: 25 },
    ],
    traffic: [
      { hour: '6pm', level: 30 },
      { hour: '7pm', level: 45 },
      { hour: '8pm', level: 70 },
      { hour: '9pm', level: 75 },
      { hour: '10pm', level: 65 },
      { hour: '11pm', level: 50 },
      { hour: '12am', level: 35 },
      { hour: '1am', level: 15 },
      { hour: '2am', level: 5 },
    ],
    coverInfo: 'Free entry all night',
  },
  {
    id: '3',
    name: 'Coda',
    type: 'Club',
    address: '1323 Sansom St, Philadelphia, PA',
    latitude: 39.9495,
    longitude: -75.1600,
    heatLevel: 'hot',
    cover: '$10',
    peakHours: '10pm–1am',
    vibe: 'Electric',
    tags: ['🔥 Packed', '21-26 avg', '♫ EDM'],
    distance: '0.5 mi',
    hours: 'Open until 3am',
    demographics: [
      { label: '21-25', percentage: 60 },
      { label: '26-30', percentage: 30 },
      { label: '31+', percentage: 10 },
    ],
    traffic: [
      { hour: '6pm', level: 5 },
      { hour: '7pm', level: 10 },
      { hour: '8pm', level: 25 },
      { hour: '9pm', level: 55 },
      { hour: '10pm', level: 85 },
      { hour: '11pm', level: 98 },
      { hour: '12am', level: 95 },
      { hour: '1am', level: 80 },
      { hour: '2am', level: 55 },
    ],
    coverInfo: '$10 all night · VIP table reservations available',
  },
  {
    id: '4',
    name: 'Strangelove\'s',
    type: 'Bar',
    address: '216 S 11th St, Philadelphia, PA',
    latitude: 39.9460,
    longitude: -75.1589,
    heatLevel: 'mild',
    cover: 'Free',
    peakHours: '8–10pm',
    vibe: 'Relaxed',
    tags: ['😴 Mild activity', '25-35 avg', '🍺 Craft beers'],
    distance: '0.8 mi',
    hours: 'Open until 1am',
    demographics: [
      { label: '21-25', percentage: 25 },
      { label: '26-30', percentage: 40 },
      { label: '31+', percentage: 35 },
    ],
    traffic: [
      { hour: '6pm', level: 15 },
      { hour: '7pm', level: 25 },
      { hour: '8pm', level: 45 },
      { hour: '9pm', level: 50 },
      { hour: '10pm', level: 40 },
      { hour: '11pm', level: 30 },
      { hour: '12am', level: 20 },
      { hour: '1am', level: 10 },
      { hour: '2am', level: 5 },
    ],
    coverInfo: 'Free entry all night',
  },
  {
    id: '5',
    name: 'Bourbon & Branch',
    type: 'Bar',
    address: '705 N 2nd St, Philadelphia, PA',
    latitude: 39.9624,
    longitude: -75.1393,
    heatLevel: 'quiet',
    cover: 'Free',
    peakHours: '9–11pm',
    vibe: 'Quiet',
    tags: ['😶 Quiet night', '28-40 avg', '🥃 Whiskey bar'],
    distance: '1.5 mi',
    hours: 'Open until 12am',
    demographics: [
      { label: '21-25', percentage: 15 },
      { label: '26-30', percentage: 35 },
      { label: '31+', percentage: 50 },
    ],
    traffic: [
      { hour: '6pm', level: 10 },
      { hour: '7pm', level: 15 },
      { hour: '8pm', level: 20 },
      { hour: '9pm', level: 25 },
      { hour: '10pm', level: 20 },
      { hour: '11pm', level: 15 },
      { hour: '12am', level: 10 },
      { hour: '1am', level: 5 },
      { hour: '2am', level: 0 },
    ],
    coverInfo: 'Free entry all night',
  },
];

export const users: User[] = [
  {
    id: '1',
    name: 'Alex M.',
    age: 26,
    bio: 'Music lover and night owl. Always looking for the next great show.',
    initial: 'A',
    personality: ['Adventurous', 'Night Owl', 'Creative', 'Social Butterfly'],
    musicTaste: ['Indie Rock', 'Jazz', 'Alternative'],
    matchPercent: 87,
    currentVenue: "McGillin's Olde Ale House",
  },
  {
    id: '2',
    name: 'Jordan K.',
    age: 24,
    bio: 'Philly native exploring the best bars and clubs. Coffee by day, cocktails by night.',
    initial: 'J',
    personality: ['Outgoing', 'Foodie', 'Explorer'],
    musicTaste: ['Hip Hop', 'R&B', 'Pop'],
    matchPercent: 72,
    currentVenue: 'Coda',
  },
  {
    id: '3',
    name: 'Sam T.',
    age: 28,
    bio: 'Craft beer enthusiast. Weekend warrior. Dog dad.',
    initial: 'S',
    personality: ['Laid Back', 'Outdoorsy', 'Funny'],
    musicTaste: ['Folk', 'Indie', 'Classic Rock'],
    matchPercent: 64,
    currentVenue: 'Yards Brewing Company',
  },
];

export const chatThreads: { [userId: string]: ChatThread } = {
  '1': {
    userId: '1',
    meetupSpot: 'DJ Set Area',
    messages: [
      {
        id: 'm1',
        senderId: '1',
        text: 'Hey! Are you at McGillins right now?',
        timestamp: '9:42 PM',
      },
      {
        id: 'm2',
        senderId: 'me',
        text: 'Yeah just got here! It\'s packed tonight 🔥',
        timestamp: '9:43 PM',
      },
      {
        id: 'm3',
        senderId: '1',
        text: 'Nice! I\'m near the DJ set area. Want to meet up?',
        timestamp: '9:44 PM',
      },
      {
        id: 'm4',
        senderId: 'me',
        text: 'Sounds good, heading there now',
        timestamp: '9:45 PM',
      },
      {
        id: 'm5',
        senderId: '1',
        text: 'I\'m wearing a blue jacket, should be easy to spot!',
        timestamp: '9:46 PM',
      },
    ],
  },
};

export const events: Event[] = [
  {
    id: 'e1',
    name: 'Rooftop Jazz Night',
    time: 'Tonight · 8PM',
    interestedCount: 124,
    distance: '0.4 mi',
    venue: 'The Rooftop at Cira Green',
  },
  {
    id: 'e2',
    name: 'Friday Night DJ Battle',
    time: 'Tonight · 10PM',
    interestedCount: 89,
    distance: '0.7 mi',
    venue: 'Coda',
  },
];
