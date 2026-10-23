export interface CharDef {
  id: number
  name: string
  emoji: string
  abilityName: string
  abilityDesc: string
  abilityIcon: string
  // Stats 0-100
  power: number
  speed: number
  special: number
  // Visual
  colorHex: string
  bodyColor: string
  darkColor: string
  glowHex: string
  accentHex: string
  particleColor: string
  trailColor: string
  // Geometry hints
  bodyType: 'rocky' | 'wispy' | 'spiky' | 'crystal'
  scale: number
  abilityCooldown: number // ms
}

export const CHARS: CharDef[] = [
  {
    id: 0,
    name: 'Rock Titan',
    emoji: '🪨',
    abilityName: 'Earth Shatter',
    abilityDesc: 'Slams the ground — shockwave fires ball like a meteor with massive power',
    abilityIcon: '💥',
    power: 90,
    speed: 50,
    special: 80,
    colorHex: '#8B6914',
    bodyColor: '#6b5418',
    darkColor: '#3a2e0a',
    glowHex: '#c8a040',
    accentHex: '#ffcc44',
    particleColor: '#c8a040',
    trailColor: '#8B6914',
    bodyType: 'rocky',
    scale: 1.3,
    abilityCooldown: 8000,
  },
  {
    id: 1,
    name: 'Shadow Beast',
    emoji: '👁️',
    abilityName: 'Void Strike',
    abilityDesc: 'Teleports then fires a shadow-clone ball that splits into three',
    abilityIcon: '👁️',
    power: 70,
    speed: 95,
    special: 95,
    colorHex: '#6622cc',
    bodyColor: '#4a1a99',
    darkColor: '#200040',
    glowHex: '#aa44ff',
    accentHex: '#cc66ff',
    particleColor: '#aa44ff',
    trailColor: '#6622cc',
    bodyType: 'wispy',
    scale: 1.0,
    abilityCooldown: 6000,
  },
  {
    id: 2,
    name: 'Fire Imp',
    emoji: '🔥',
    abilityName: 'Inferno Blast',
    abilityDesc: 'Ball ignites — leaves fire trail and explodes on bounce',
    abilityIcon: '🔥',
    power: 85,
    speed: 80,
    special: 75,
    colorHex: '#ff4400',
    bodyColor: '#cc2200',
    darkColor: '#440800',
    glowHex: '#ff8800',
    accentHex: '#ffaa00',
    particleColor: '#ff6600',
    trailColor: '#ff2200',
    bodyType: 'spiky',
    scale: 0.85,
    abilityCooldown: 7000,
  },
  {
    id: 3,
    name: 'Ice Golem',
    emoji: '❄️',
    abilityName: 'Blizzard Spike',
    abilityDesc: 'Freezes opponent for 2 seconds — ball encases in deadly ice shard',
    abilityIcon: '❄️',
    power: 65,
    speed: 60,
    special: 90,
    colorHex: '#44aaff',
    bodyColor: '#2266bb',
    darkColor: '#001830',
    glowHex: '#88ddff',
    accentHex: '#ccf0ff',
    particleColor: '#88ddff',
    trailColor: '#4488ff',
    bodyType: 'crystal',
    scale: 1.2,
    abilityCooldown: 9000,
  },
]
