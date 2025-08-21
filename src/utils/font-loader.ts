import { FigmaNode } from '../core/types';

// Font loading functions for Figma plugin environment
export async function loadFonts(node: FigmaNode): Promise<void> {
  if (node.type === 'TEXT' && node.fontName) {
    try {
      await figma.loadFontAsync(node.fontName);
    } catch (error) {
      console.warn(`Failed to load font for node ${node.name}:`, error);
    }
  }
  
  if (node.children) {
    for (const child of node.children) {
      await loadFonts(child);
    }
  }
}

// Font CSS generation for web output
export function getEmbeddedFontStyles(): string {
  return `
    /* Custom font declarations - CircularXX TT family with font-weight variations */
    
    @font-face {
      font-family: "CircularXX TT";
      src: url("fonts/CircularXXTT-Thin.ttf") format("truetype");
      font-weight: 100;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "CircularXX TT";
      src: url("fonts/CircularXXTT-ThinItalic.ttf") format("truetype");
      font-weight: 100;
      font-style: italic;
      font-display: swap;
    }
    @font-face {
      font-family: "CircularXX TT";
      src: url("fonts/CircularXXTT-Light.ttf") format("truetype");
      font-weight: 300;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "CircularXX TT";
      src: url("fonts/CircularXXTT-LightItalic.ttf") format("truetype");
      font-weight: 300;
      font-style: italic;
      font-display: swap;
    }
    @font-face {
      font-family: "CircularXX TT";
      src: url("fonts/CircularXXTT-Regular.ttf") format("truetype");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "CircularXX TT";
      src: url("fonts/CircularXXTT-Italic.ttf") format("truetype");
      font-weight: 400;
      font-style: italic;
      font-display: swap;
    }
    @font-face {
      font-family: "CircularXX TT";
      src: url("fonts/CircularXXTT-Book.ttf") format("truetype");
      font-weight: 450;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "CircularXX TT";
      src: url("fonts/CircularXXTT-BookItalic.ttf") format("truetype");
      font-weight: 450;
      font-style: italic;
      font-display: swap;
    }
    @font-face {
      font-family: "CircularXX TT";
      src: url("fonts/CircularXXTT-Medium.ttf") format("truetype");
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "CircularXX TT";
      src: url("fonts/CircularXXTT-MediumItalic.ttf") format("truetype");
      font-weight: 500;
      font-style: italic;
      font-display: swap;
    }
    @font-face {
      font-family: "CircularXX TT";
      src: url("fonts/CircularXXTT-Bold.ttf") format("truetype");
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "CircularXX TT";
      src: url("fonts/CircularXXTT-BoldItalic.ttf") format("truetype");
      font-weight: 700;
      font-style: italic;
      font-display: swap;
    }
    @font-face {
      font-family: "CircularXX TT";
      src: url("fonts/CircularXXTT-Black.ttf") format("truetype");
      font-weight: 900;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "CircularXX TT";
      src: url("fonts/CircularXXTT-BlackItalic.ttf") format("truetype");
      font-weight: 900;
      font-style: italic;
      font-display: swap;
    }
    @font-face {
      font-family: "CircularXX TT";
      src: url("fonts/CircularXXTT-ExtraBlack.ttf") format("truetype");
      font-weight: 950;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "CircularXX TT";
      src: url("fonts/CircularXXTT-ExtraBlackItalic.ttf") format("truetype");
      font-weight: 950;
      font-style: italic;
      font-display: swap;
    }
  `;
}

// Analyze text nodes to determine what fonts are needed
export function analyzeRequiredFonts(nodes: FigmaNode[]): Set<string> {
  const requiredFonts = new Set<string>();
  
  function analyzeNode(node: FigmaNode): void {
    if (node.type === 'TEXT') {
      if (node.fontName && typeof node.fontName === 'object' && node.fontName.family) {
        requiredFonts.add(node.fontName.family);
      } else if (node.fontFamily) {
        requiredFonts.add(node.fontFamily);
      }
    }
    
    if (node.children) {
      node.children.forEach(analyzeNode);
    }
  }
  
  nodes.forEach(analyzeNode);
  return requiredFonts;
}

// Generate font preload links for better performance
export function generateFontPreloadLinks(fontFamilies: Set<string>): string {
  const preloadLinks: string[] = [];
  
  fontFamilies.forEach(family => {
    if (family === 'CircularXX TT') {
      // Add preload links for commonly used weights
      // Note: crossorigin is removed for local file access
      preloadLinks.push(`<link rel="preload" href="fonts/CircularXXTT-Regular.ttf" as="font" type="font/ttf">`);
      preloadLinks.push(`<link rel="preload" href="fonts/CircularXXTT-Medium.ttf" as="font" type="font/ttf">`);
      preloadLinks.push(`<link rel="preload" href="fonts/CircularXXTT-Bold.ttf" as="font" type="font/ttf">`);
    }
  });
  
  return preloadLinks.join('\n  ');
}
