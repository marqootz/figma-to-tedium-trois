// Browser-side animation type definitions
// Extracted from BundleGenerator for better organization

export class AnimationChange {
  constructor(
    public property: string,
    public sourceValue: any,
    public targetValue: any,
    public delta?: number,
    public childName?: string,
    public childId?: string
  ) {}
}

export interface AnimationOptions {
  duration: number;
  easing: string;
  transitionType: 'SMART_ANIMATE' | 'DISSOLVE' | 'INSTANT';
}

export interface VariantInstance {
  instanceId: string;
  variants: string[];
  activeVariant: string;
  currentIndex: number;
}

export interface FigmaNodeData {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
  fills?: FigmaFill[];
  strokes?: FigmaFill[];
  strokeWeight?: number;
  cornerRadius?: number;
  layoutMode?: string;
  counterAxisAlignItems?: string;
  primaryAxisAlignItems?: string;
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  vectorPaths?: VectorPath[];
  effects?: FigmaEffect[];
  children?: FigmaNodeData[];
  reactions?: FigmaReaction[];
}

export interface VectorPath {
  data: string;
  windingRule?: string;
}

export interface StyleChange {
  type: 'transform' | 'size' | 'opacity' | 'backgroundColor' | 'borderRadius' | 'fill' | 'childSize';
  value?: string;
  width?: number;
  height?: number;
  target: Element;
}

// Import core types for consistency
export interface FigmaFill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE' | 'VIDEO';
  visible?: boolean;
  opacity?: number;
  color?: FigmaColor;
  blendMode?: string;
  gradientHandlePositions?: FigmaGradientStop[];
  gradientStops?: FigmaGradientStop[];
  scaleMode?: string;
  imageTransform?: number[][];
  scalingFactor?: number;
  rotation?: number;
  filters?: unknown;
  gifHash?: string;
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface FigmaGradientStop {
  position: number;
  color: FigmaColor;
}

export interface FigmaEffect {
  type: 'INNER_SHADOW' | 'DROP_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  visible: boolean;
  radius?: number;
  color?: FigmaColor;
  blendMode?: string;
  offset?: { x: number; y: number };
  spread?: number;
}

export interface FigmaReaction {
  trigger: {
    type: 'ON_CLICK' | 'ON_PRESS' | 'AFTER_TIMEOUT' | 'ON_DRAG';
    timeout?: number;
  };
  action: {
    type: 'NAVIGATE' | 'OVERLAY' | 'BACK' | 'CLOSE' | 'OPEN_URL';
    destinationId?: string;
    transition?: {
      type: 'SMART_ANIMATE' | 'DISSOLVE' | 'INSTANT';
      duration: number;
      easing: {
        type: 'GENTLE' | 'QUICK' | 'BOUNCY' | 'SLOW' | 'LINEAR' | 'EASE_IN_AND_OUT_BACK' | 'EASE_OUT';
      };
    };
  };
}
