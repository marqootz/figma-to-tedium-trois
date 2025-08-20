import { 
  FigmaNodeData, 
  AnimationChange, 
  AnimationOptions, 
  VariantInstance
} from './types';
import { ChangeDetector } from './change-detector';
import { DOMManipulator } from './dom-manipulator';
import { VariantHandler } from './variant-handler';

export class FigmaAnimationSystem {
  private elementRegistry: Map<string, HTMLElement> = new Map();
  private nodeRegistry: Map<string, FigmaNodeData> = new Map();
  private timeouts: Set<number> = new Set();
  private variantHandler: VariantHandler = new VariantHandler();

  constructor() {
    console.log('FigmaAnimationSystem initialized');
  }

  /**
   * Register an element with the animation system
   */
  registerElement(figmaId: string, element: HTMLElement, node: FigmaNodeData): void {
    this.elementRegistry.set(figmaId, element);
    this.nodeRegistry.set(figmaId, node);
    element.setAttribute('data-figma-id', figmaId);
    console.log('Registered element:', figmaId, node.name);
  }

  /**
   * Register variant instances
   */
  registerVariantInstances(instances: VariantInstance[]): void {
    this.variantHandler.registerVariantInstances(instances);
  }

  /**
   * Execute animation between two nodes
   */
  async executeAnimation(sourceId: string, targetId: string): Promise<void> {
    console.log('Executing animation:', sourceId, '→', targetId);
    
    // Check if this is a variant animation
    const variantInstance = this.variantHandler.findVariantInstance(sourceId);
    console.log('🔍 Variant instance found for', sourceId, ':', variantInstance ? 'YES' : 'NO');
    
    if (variantInstance) {
      console.log('🎭 Using variant animation path');
      await this.executeVariantAnimation(variantInstance, sourceId, targetId);
      return;
    }
    
    // Fallback to regular element animation
    console.log('🎯 Using regular element animation path');
    await this.executeElementAnimation(sourceId, targetId);
  }

  /**
   * Execute variant animation
   */
  private async executeVariantAnimation(
    variantInstance: VariantInstance,
    sourceId: string,
    targetId: string
  ): Promise<void> {
    const sourceElement = this.elementRegistry.get(sourceId);
    const targetElement = this.elementRegistry.get(targetId);
    const sourceNode = this.nodeRegistry.get(sourceId);
    const targetNode = this.nodeRegistry.get(targetId);

    if (!sourceElement || !targetElement || !sourceNode || !targetNode) {
      console.error('Missing variant elements or nodes for animation');
      return;
    }

    // Get animation configuration from the source node
    const options = this.getAnimationOptions(sourceNode);
    if (!options) {
      console.log('No reaction found, performing instant variant switch');
      this.variantHandler.executeVariantAnimation(
        variantInstance, sourceId, targetId, sourceElement, targetElement, 
        sourceNode, targetNode, { duration: 0, easing: 'linear', transitionType: 'SMART_ANIMATE' }
      );
      return;
    }

    await this.variantHandler.executeVariantAnimation(
      variantInstance, sourceId, targetId, sourceElement, targetElement, 
      sourceNode, targetNode, options
    );

    // Setup timeout reactions for new active variant
    this.setupTimeoutReactions(targetId);
  }

  /**
   * Execute regular element animation
   */
  private async executeElementAnimation(sourceId: string, targetId: string): Promise<void> {
    const sourceElement = this.elementRegistry.get(sourceId);
    const targetElement = this.elementRegistry.get(targetId);
    const sourceNode = this.nodeRegistry.get(sourceId);
    const targetNode = this.nodeRegistry.get(targetId);

    if (!sourceElement || !targetElement || !sourceNode || !targetNode) {
      console.error('Missing elements or nodes for animation');
      return;
    }

    // Get animation configuration
    const options = this.getAnimationOptions(sourceNode);
    if (!options) {
      console.log('No reaction found, performing instant switch');
      DOMManipulator.performVariantSwitch(sourceElement, targetElement);
      return;
    }

    // Detect changes
    const changes = ChangeDetector.detectChanges(sourceNode, targetNode);
    console.log('Animation changes detected:', changes);

    // Execute animation
    switch (options.transitionType) {
      case 'SMART_ANIMATE':
        await this.executeSmartAnimate(sourceElement, targetElement, changes, options);
        break;
      case 'DISSOLVE':
        await this.executeDissolve(sourceElement, targetElement, options);
        break;
      default:
        DOMManipulator.performVariantSwitch(sourceElement, targetElement);
    }

    // Setup timeout reactions for new active variant
    this.setupTimeoutReactions(targetId);
  }

  /**
   * Execute Smart Animate
   */
  private async executeSmartAnimate(
    sourceElement: HTMLElement,
    targetElement: HTMLElement,
    changes: AnimationChange[],
    options: AnimationOptions
  ): Promise<void> {
    return new Promise((resolve) => {
      console.log('Starting SMART_ANIMATE:', options.duration + 's', options.easing);

      // Setup CSS transitions
      DOMManipulator.setupTransitions(sourceElement, changes, options);

      // Apply changes on next frame
      requestAnimationFrame(() => {
        changes.forEach(change => DOMManipulator.applyChange(sourceElement, change));
      });

      // Complete animation
      setTimeout(() => {
        console.log('Animation completed, switching to target');
        DOMManipulator.performVariantSwitch(sourceElement, targetElement);
        resolve();
      }, options.duration * 1000);
    });
  }

  /**
   * Execute Dissolve animation
   */
  private async executeDissolve(
    sourceElement: HTMLElement,
    targetElement: HTMLElement,
    options: AnimationOptions
  ): Promise<void> {
    return new Promise((resolve) => {
      console.log('Starting DISSOLVE:', options.duration + 's');

      sourceElement.style.transition = 'opacity ' + options.duration + 's ' + options.easing;
      targetElement.style.transition = 'opacity ' + options.duration + 's ' + options.easing;
      
      // Show target with 0 opacity
      targetElement.style.display = '';
      targetElement.style.opacity = '0';

      requestAnimationFrame(() => {
        sourceElement.style.opacity = '0';
        targetElement.style.opacity = '1';
      });

      setTimeout(() => {
        sourceElement.style.display = 'none';
        resolve();
      }, options.duration * 1000);
    });
  }

  /**
   * Get animation options from node reactions
   */
  private getAnimationOptions(node: FigmaNodeData): AnimationOptions | null {
    const reaction = node.reactions && node.reactions[0];
    if (!reaction) return null;

    return {
      duration: reaction.action.transition.duration,
      easing: this.mapFigmaEasing(reaction.action.transition.easing.type),
      transitionType: reaction.action.transition.type
    };
  }

  /**
   * Map Figma easing to CSS easing
   */
  private mapFigmaEasing(figmaEasing: string): string {
    const easingMap: Record<string, string> = {
      'GENTLE': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      'QUICK': 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
      'BOUNCY': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      'SLOW': 'cubic-bezier(0.23, 1, 0.32, 1)',
      'LINEAR': 'linear'
    };
    return easingMap[figmaEasing] || easingMap['GENTLE'];
  }

  /**
   * Setup timeout reactions for a node
   */
  setupTimeoutReactions(nodeId: string): void {
    const node = this.nodeRegistry.get(nodeId);
    if (!node || !node.reactions) return;

    node.reactions
      .filter(reaction => reaction.trigger.type === 'AFTER_TIMEOUT')
      .forEach(reaction => {
        console.log('Setting up timeout reaction:', reaction.trigger.timeout + 's delay');
        
        const timeout = setTimeout(() => {
          this.executeAnimation(nodeId, reaction.action.destinationId);
        }, (reaction.trigger.timeout || 0) * 1000);
        
        this.timeouts.add(timeout as any);
      });
  }

  /**
   * Clear all timeout reactions
   */
  clearAllTimeouts(): void {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
    console.log('All timeout reactions cleared');
  }

  /**
   * Destroy the animation system
   */
  destroy(): void {
    this.clearAllTimeouts();
    this.elementRegistry.clear();
    this.nodeRegistry.clear();
    console.log('FigmaAnimationSystem destroyed');
  }
}
