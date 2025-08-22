export interface FigmaNode {
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
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX';
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX';
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  // Sizing properties
  layoutSizingHorizontal?: 'FIXED' | 'FILL' | 'HUG';
  layoutSizingVertical?: 'FIXED' | 'FILL' | 'HUG';
  // Overflow properties
  overflow?: 'VISIBLE' | 'HIDDEN' | 'SCROLL';
  // Text properties
  characters?: string;
  fontName?: FigmaFontName;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
  letterSpacing?: FigmaLetterSpacing;
  lineHeight?: FigmaLineHeight;
  // Vector properties
  vectorPaths?: VectorPath[];
  effects?: FigmaEffect[];
  // Component properties
  componentProperties?: FigmaComponentProperties;
  mainComponentId?: string;
  variantProperties?: FigmaVariantProperties;
  reactions?: FigmaReaction[];
  children?: FigmaNode[];
}

export interface FigmaFontName {
  family: string;
  style: string;
}

export interface FigmaLetterSpacing {
  value: number;
  unit: 'PIXELS' | 'PERCENT';
}

export interface FigmaLineHeight {
  value: number;
  unit: 'PIXELS' | 'PERCENT' | 'AUTO';
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

export interface FigmaComponentProperties {
  [key: string]: {
    value: string | number | boolean;
    type: 'BOOLEAN' | 'INSTANCE_SWAP' | 'TEXT' | 'VARIANT';
    boundVariables?: Record<string, any>;
  };
}

export interface FigmaVariantProperties {
  [key: string]: string;
}

export interface VectorPath {
  data: string;
  windingRule?: string;
}

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
  filters?: any;
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

export interface AnimationChange {
  property: 'translateX' | 'translateY' | 'opacity' | 'alignment' | 'color';
  sourceValue: unknown;
  targetValue: unknown;
  delta?: number;
}

export interface AnimationOptions {
  duration: number;
  easing: string;
  transitionType: 'SMART_ANIMATE' | 'DISSOLVE' | 'INSTANT';
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


