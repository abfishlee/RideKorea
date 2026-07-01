export const NeoOutdoors = {
  color: {
    electricCyan: '#22F3FF',
    deepCyan: '#0891B2',
    adventurePink: '#FF3EA5',
    sunsetAmber: '#F59E0B',
    roseGlow: '#FB7185',
    ink: '#0B1220',
    inkSoft: '#0F172A',
    slate: '#475569',
    slateMuted: '#64748B',
    line: '#D8E2EA',
    paper: '#F8FAFC',
    warmPaper: '#FFF8ED',
    white: '#FFFFFF',
    glassDark: 'rgba(15,23,42,0.72)',
    glassLight: 'rgba(255,255,255,0.72)',
    glassBorder: 'rgba(255,255,255,0.34)',
    cyanWash: '#ECFEFF',
    pinkWash: '#FDF2F8',
    amberWash: '#FFFBEB',
  },
  radius: {
    card: 8,
    hud: 12,
    control: 10,
    chip: 999,
    polaroid: 4,
  },
  space: {
    xxs: 4,
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  type: {
    sportNumber: {
      fontWeight: '900' as const,
      fontStyle: 'italic' as const,
      letterSpacing: 0,
    },
    label: {
      fontWeight: '900' as const,
      letterSpacing: 0,
      textTransform: 'uppercase' as const,
    },
    body: {
      fontWeight: '700' as const,
      letterSpacing: 0,
    },
  },
  shadow: {
    glass: {
      shadowColor: '#0B1220',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 8,
    },
    editorial: {
      shadowColor: '#0B1220',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
      elevation: 5,
    },
  },
} as const;

export const NeoRouteColors = {
  planned: NeoOutdoors.color.electricCyan,
  completed: NeoOutdoors.color.deepCyan,
  offRoute: NeoOutdoors.color.adventurePink,
  diarySpot: NeoOutdoors.color.sunsetAmber,
} as const;
