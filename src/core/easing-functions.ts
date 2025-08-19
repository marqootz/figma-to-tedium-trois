export function mapFigmaEasing(figmaEasing: string): string {
  const easingMap: Record<string, string> = {
    'GENTLE': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'QUICK': 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
    'BOUNCY': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    'SLOW': 'cubic-bezier(0.23, 1, 0.32, 1)',
    'LINEAR': 'linear'
  };
  
  return easingMap[figmaEasing] || easingMap['GENTLE'];
}

export function getFigmaEasings(): Record<string, string> {
  return {
    'GENTLE': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'QUICK': 'cubic-bezier(0.55, 0.06, 0.68, 0.19)', 
    'BOUNCY': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    'SLOW': 'cubic-bezier(0.23, 1, 0.32, 1)',
    'LINEAR': 'linear'
  };
}


