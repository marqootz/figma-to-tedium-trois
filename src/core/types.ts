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
  // Text properties
  characters?: string;
  fontName?: any;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
  letterSpacing?: any;
  lineHeight?: any;
  // Component properties
  componentProperties?: any;
  mainComponentId?: string;
  variantProperties?: any;
  reactions?: FigmaReaction[];
  children?: FigmaNode[];
}

export interface FigmaReaction {
  trigger: {
    type: 'ON_CLICK' | 'ON_PRESS' | 'AFTER_TIMEOUT' | 'ON_DRAG';
    timeout?: number;
  };
  action: {
    type: 'NODE';
    destinationId: string;
    navigation: 'CHANGE_TO';
    transition: {
      type: 'SMART_ANIMATE' | 'DISSOLVE' | 'MOVE_IN' | 'MOVE_OUT';
      easing: {
        type: 'GENTLE' | 'QUICK' | 'BOUNCY' | 'SLOW' | 'LINEAR';
      };
      duration: number;
    };
  };
}

export interface FigmaFill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL';
  color?: FigmaColor;
  opacity?: number;
  gradientStops?: FigmaGradientStop[];
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
}

export interface FigmaGradientStop {
  position: number;
  color: FigmaColor;
}

export interface AnimationChange {
  property: 'translateX' | 'translateY' | 'opacity' | 'alignment' | 'color';
  sourceValue: any;
  targetValue: any;
  delta?: number;
}

export interface AnimationOptions {
  duration: number;
  easing: string;
  transitionType: string;
}


