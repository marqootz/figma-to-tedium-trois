import { FigmaNode, AnimationChange, AnimationOptions } from './types';
import { mapFigmaEasing } from './easing-functions';

export class FigmaAnimationSystem {
  private elementRegistry = new Map<string, HTMLElement>();
  private nodeRegistry = new Map<string, FigmaNode>();
  private timeouts = new Set<NodeJS.Timeout>();

  constructor() {
    console.log('FigmaAnimationSystem initialized');
  }

  registerElement(figmaId: string, element: HTMLElement, node: FigmaNode): void {
    this.elementRegistry.set(figmaId, element);
    this.nodeRegistry.set(figmaId, node);
    element.setAttribute('data-figma-id', figmaId);
    
    console.log(`Registered element: ${figmaId} (${node.name})`);
  }

  async executeAnimation(sourceId: string, targetId: string): Promise<void> {
    console.log(`Executing animation: ${sourceId} → ${targetId}`);
    
    const sourceElement = this.elementRegistry.get(sourceId);
    const targetElement = this.elementRegistry.get(targetId);
    const sourceNode = this.nodeRegistry.get(sourceId);
    const targetNode = this.nodeRegistry.get(targetId);

    if (!sourceElement || !targetElement || !sourceNode || !targetNode) {
      console.error('Missing elements or nodes for animation:', {
        sourceElement: !!sourceElement,
        targetElement: !!targetElement,
        sourceNode: !!sourceNode,
        targetNode: !!targetNode
      });
      return;
    }

    // Get animation configuration
    const reaction = sourceNode.reactions?.[0];
    if (!reaction) {
      console.log('No reaction found, performing instant switch');
      this.performInstantSwitch(sourceElement, targetElement);
      return;
    }

    const options: AnimationOptions = {
      duration: reaction.action.transition.duration,
      easing: mapFigmaEasing(reaction.action.transition.easing.type),
      transitionType: reaction.action.transition.type
    };

    // Detect changes
    const changes = this.detectChanges(sourceNode, targetNode);
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
        this.performInstantSwitch(sourceElement, targetElement);
    }

    // Setup timeout reactions for new active variant
    this.setupTimeoutReactions(targetId);
  }

  private detectChanges(source: FigmaNode, target: FigmaNode): AnimationChange[] {
    const changes: AnimationChange[] = [];

    // Position changes (critical for countdown animation)
    if (source.y !== target.y) {
      changes.push({
        property: 'translateY',
        sourceValue: source.y,
        targetValue: target.y,
        delta: target.y - source.y
      });
    }

    if (source.x !== target.x) {
      changes.push({
        property: 'translateX',
        sourceValue: source.x,
        targetValue: target.x,
        delta: target.x - source.x
      });
    }

    // Alignment changes (critical for countdown)
    if (source.counterAxisAlignItems !== target.counterAxisAlignItems) {
      changes.push({
        property: 'alignment',
        sourceValue: source.counterAxisAlignItems,
        targetValue: target.counterAxisAlignItems
      });
    }

    // Opacity changes
    if (source.opacity !== target.opacity) {
      changes.push({
        property: 'opacity',
        sourceValue: source.opacity || 1,
        targetValue: target.opacity || 1
      });
    }

    return changes;
  }

  private async executeSmartAnimate(
    sourceElement: HTMLElement,
    targetElement: HTMLElement,
    changes: AnimationChange[],
    options: AnimationOptions
  ): Promise<void> {
    return new Promise((resolve) => {
      console.log(`Starting SMART_ANIMATE: ${options.duration}s ${options.easing}`);

      // Setup CSS transitions
      const properties = this.getTransitionProperties(changes);
      sourceElement.style.transition = properties
        .map(prop => `${prop} ${options.duration}s ${options.easing}`)
        .join(', ');

      // Apply changes on next frame
      requestAnimationFrame(() => {
        changes.forEach(change => this.applyChange(sourceElement, change));
      });

      // Complete animation
      setTimeout(() => {
        console.log('Animation completed, switching to target');
        this.performInstantSwitch(sourceElement, targetElement);
        resolve();
      }, options.duration * 1000);
    });
  }

  private async executeDissolve(
    sourceElement: HTMLElement,
    targetElement: HTMLElement,
    options: AnimationOptions
  ): Promise<void> {
    return new Promise((resolve) => {
      console.log(`Starting DISSOLVE: ${options.duration}s`);

      sourceElement.style.transition = `opacity ${options.duration}s ${options.easing}`;
      targetElement.style.transition = `opacity ${options.duration}s ${options.easing}`;
      
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

  private getTransitionProperties(changes: AnimationChange[]): string[] {
    const properties = new Set<string>();
    
    changes.forEach(change => {
      switch (change.property) {
        case 'translateX':
        case 'translateY':
          properties.add('transform');
          break;
        case 'alignment':
          properties.add('align-items');
          break;
        default:
          properties.add(change.property);
      }
    });

    return Array.from(properties);
  }

  private applyChange(element: HTMLElement, change: AnimationChange): void {
    console.log(`Applying change: ${change.property} = ${change.targetValue}`);

    switch (change.property) {
      case 'translateY':
        element.style.transform = `translateY(${change.delta}px)`;
        break;
      case 'translateX':
        element.style.transform = `translateX(${change.delta}px)`;
        break;
      case 'alignment':
        const parent = element.parentElement;
        if (parent) {
          const alignMap = { 'MIN': 'flex-start', 'CENTER': 'center', 'MAX': 'flex-end' };
          parent.style.alignItems = alignMap[change.targetValue as keyof typeof alignMap] || 'center';
        }
        break;
      case 'opacity':
        element.style.opacity = change.targetValue.toString();
        break;
    }
  }

  private performInstantSwitch(sourceElement: HTMLElement, targetElement: HTMLElement): void {
    console.log('Performing instant variant switch');
    
    // Hide all variants in the component set
    const componentSet = sourceElement.closest('[data-component-set]');
    if (componentSet) {
      const variants = componentSet.querySelectorAll('[data-variant]');
      variants.forEach(variant => {
        (variant as HTMLElement).style.display = 'none';
      });
    }

    // Show target variant
    targetElement.style.display = '';
    targetElement.style.opacity = '1';
    targetElement.style.transform = '';
  }

  setupTimeoutReactions(nodeId: string): void {
    const node = this.nodeRegistry.get(nodeId);
    if (!node?.reactions) return;

    node.reactions
      .filter(reaction => reaction.trigger.type === 'AFTER_TIMEOUT')
      .forEach(reaction => {
        console.log(`Setting up timeout reaction: ${reaction.trigger.timeout}s delay`);
        
        const timeout = setTimeout(() => {
          this.executeAnimation(nodeId, reaction.action.destinationId);
        }, (reaction.trigger.timeout || 0) * 1000);
        
        this.timeouts.add(timeout);
      });
  }

  clearAllTimeouts(): void {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
    console.log('All timeout reactions cleared');
  }

  destroy(): void {
    this.clearAllTimeouts();
    this.elementRegistry.clear();
    this.nodeRegistry.clear();
    console.log('FigmaAnimationSystem destroyed');
  }
}
