import { FigmaNode } from '../core/types';
import { BundleGenerator } from '../browser/bundle-generator';

export class AnimationHandler {
  generateAnimationCode(nodes: FigmaNode[], resolvedInstances?: any[]): string {
    return `
      // Initialize Figma Animation System
      ${BundleGenerator.generateBundle()}
      
      ${BundleGenerator.generateInitializationCode(nodes, resolvedInstances)}
    `;
  }
}
