// SVG conversion utilities for Figma vector nodes
export interface VectorPath {
  data: string;
  windingRule?: string;
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
}

export interface FigmaFill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL';
  color?: FigmaColor;
  opacity?: number;
  gradientStops?: any[];
}

export function colorToRGBA(color: FigmaColor, opacity: number = 1): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function base64Decode(str: string): string {
  if (typeof atob !== 'undefined') {
    return atob(str);
  }
  // Fallback for environments without atob (Figma plugin environment)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let result = '';
  let i = 0;
  
  // Remove any padding
  str = str.replace(/=+$/, '');
  
  while (i < str.length) {
    const e1 = chars.indexOf(str.charAt(i++));
    const e2 = chars.indexOf(str.charAt(i++));
    const e3 = chars.indexOf(str.charAt(i++));
    const e4 = chars.indexOf(str.charAt(i++));
    
    const c1 = (e1 << 2) | (e2 >> 4);
    const c2 = ((e2 & 15) << 4) | (e3 >> 2);
    const c3 = ((e3 & 3) << 6) | e4;
    
    result += String.fromCharCode(c1);
    if (e3 !== 64) result += String.fromCharCode(c2);
    if (e4 !== 64) result += String.fromCharCode(c3);
  }
  
  return result;
}

function getVectorStyles(node: any) {
  const styles = {
    fills: [] as string[],
    strokes: [] as string[],
    strokeWeight: node.strokeWeight || 0,
    gradients: [] as any[]
  };

  // Process fills
  if (node.fills && Array.isArray(node.fills)) {
    styles.fills = node.fills.map((fill: FigmaFill, fillIndex: number) => {
      if (fill.type === 'SOLID' && fill.color) {
        const opacity = fill.opacity ?? 1;
        return colorToRGBA(fill.color, opacity);
      } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
        const gradientId = `gradient-${node.id}-${fillIndex}`;
        styles.gradients.push({
          id: gradientId,
          type: fill.type,
          fill: fill
        });
        return `url(#${gradientId})`;
      }
      return 'none';
    });
  }

  // Process strokes
  if (node.strokes && Array.isArray(node.strokes)) {
    styles.strokes = node.strokes.map((stroke: FigmaFill) => {
      if (stroke.type === 'SOLID' && stroke.color) {
        const opacity = stroke.opacity ?? 1;
        return colorToRGBA(stroke.color, opacity);
      }
      return 'none';
    });
  }

  return styles;
}

function createSVGGradientDefinitions(gradients: any[]): string {
  if (gradients.length === 0) return '';
  
  const defs = gradients.map(gradient => {
    const { id, type, fill } = gradient;
    if (type === 'GRADIENT_LINEAR') {
      const stops = fill.gradientStops?.map((stop: any) => {
        const color = colorToRGBA(stop.color, stop.opacity);
        return `<stop offset="${stop.position}%" stop-color="${color}" />`;
      }).join('') || '';
      return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="0%">${stops}</linearGradient>`;
    } else if (type === 'GRADIENT_RADIAL') {
      const stops = fill.gradientStops?.map((stop: any) => {
        const color = colorToRGBA(stop.color, stop.opacity);
        return `<stop offset="${stop.position}%" stop-color="${color}" />`;
      }).join('') || '';
      return `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">${stops}</radialGradient>`;
    }
    return '';
  }).join('');
  
  return defs ? `<defs>${defs}</defs>` : '';
}

export function convertVectorToSVG(node: any): string {
  console.log('Converting vector to SVG:', {
    nodeId: node.id,
    nodeName: node.name,
    hasVectorPaths: !!node.vectorPaths,
    vectorPathsLength: node.vectorPaths?.length || 0,
    hasFills: !!node.fills,
    fillsLength: node.fills?.length || 0
  });
  
  const width = node.width || 0;
  const height = node.height || 0;
  
  if (!width || !height) {
    console.warn('No valid dimensions found for vector node:', {
      nodeId: node.id,
      nodeName: node.name,
      width: node.width,
      height: node.height
    });
    return '';
  }

  const styles = getVectorStyles(node);
  
  // Check for blur effects and add filter definitions
  let blurFilterRef = '';
  
  if (node.effects && Array.isArray(node.effects)) {
    const blur = node.effects.find((effect: any) => effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR');
    if (blur) {
      const filterId = `blur-${node.id}`;
      blurFilterRef = ` filter="url(#${filterId})"`;
    }
  }
  
  if (!node.vectorPaths || !Array.isArray(node.vectorPaths)) {
    console.warn('No vector paths found for vector:', {
      nodeId: node.id,
      nodeName: node.name,
      vectorPaths: node.vectorPaths
    });
    return '';
  }
  
  const paths = node.vectorPaths.map((path: VectorPath, index: number) => {
    console.log('Processing vector path:', {
      pathIndex: index,
      pathData: path.data,
      pathDataLength: path.data?.length || 0
    });
    
    const fill = styles.fills.length === 1 ? styles.fills[0] : (styles.fills[index] || 'none');
    const stroke = styles.strokes.length === 1 ? styles.strokes[0] : (styles.strokes[index] || 'none');
    const strokeWidth = styles.strokeWeight || 0;
    
    // Decode path data from base64
    let decodedPathData = path.data;
    try {
      if (/^[A-Za-z0-9+/=]+$/.test(path.data)) {
        decodedPathData = base64Decode(path.data);
        console.log('Decoded base64 path data:', {
          originalLength: path.data?.length || 0,
          decodedLength: decodedPathData?.length || 0,
          firstChars: decodedPathData?.substring(0, 50) || 'empty'
        });
      }
      
      if (!decodedPathData || decodedPathData.trim() === '') {
        console.warn('Empty decoded path data for path index:', index);
        return '';
      }
      
      const validCommands = ['M', 'L', 'H', 'V', 'C', 'S', 'Q', 'T', 'A', 'Z'];
      const firstChar = decodedPathData.trim().charAt(0).toUpperCase();
      if (!validCommands.includes(firstChar)) {
        console.warn('Invalid SVG path command:', firstChar);
        return '';
      }
      
    } catch (error) {
      console.warn('Error decoding path data:', error);
      decodedPathData = path.data;
    }
    
    return `<path d="${decodedPathData}" 
            fill="${fill}" 
            stroke="${stroke}" 
            stroke-width="${String(strokeWidth)}"
            fill-rule="nonzero"${blurFilterRef} />`;
  }).join('\n    ');
  
  if (!paths) {
    console.warn('No path data found for vector');
    return '';
  }

  // Create gradient definitions if any gradients exist
  const gradientDefs = createSVGGradientDefinitions(styles.gradients);
  
  // Wrap paths in a group element
  const wrappedPaths = `<g id="${node.name.replace(/\s+/g, '_')}">\n    ${paths}\n</g>`;
  
  return gradientDefs + '\n    ' + wrappedPaths;
}

export function convertRectangleToSVG(node: any): string {
  let fillColor = 'none';
  if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === 'SOLID' && fill.color) {
      fillColor = colorToRGBA(fill.color, fill.opacity);
    }
  }
  const rx = node.cornerRadius && typeof node.cornerRadius === 'number' ? node.cornerRadius : 0;
  return `<rect width="${node.width}" height="${node.height}" fill="${fillColor}" rx="${rx}"/>`;
}

export function convertEllipseToSVG(node: any): string {
  let fillColor = 'none';
  if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === 'SOLID' && fill.color) {
      fillColor = colorToRGBA(fill.color, fill.opacity);
    }
  }
  const cx = node.width / 2;
  const cy = node.height / 2;
  const rx = node.width / 2;
  const ry = node.height / 2;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fillColor}"/>`;
}
