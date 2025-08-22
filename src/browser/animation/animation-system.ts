import { AnimationChange, VariantInstance } from '../types/animation-types';
import { DOMManipulator } from '../dom/dom-manipulator';
import { ChangeDetector } from '../detection/change-detector';

// AnimationOptions class
export class AnimationOptions {
  constructor(
    public duration: number,
    public easing: string,
    public transitionType: 'SMART_ANIMATE' | 'DISSOLVE' | 'INSTANT'
  ) {}
}

export class FigmaAnimationSystem {
  private elementRegistry = new Map<string, HTMLElement>();
  private nodeRegistry = new Map<string, any>();
  private timeouts = new Set<number>();
  private variantHandler: VariantHandler;

  constructor() {
    this.variantHandler = new VariantHandler();
    console.log('FigmaAnimationSystem initialized');
  }

  registerElement(figmaId: string, element: HTMLElement, node: any): void {
    this.elementRegistry.set(figmaId, element);
    this.nodeRegistry.set(figmaId, node);
    element.setAttribute('data-figma-id', figmaId);
    console.log('Registered element:', figmaId, node.name);
  }

  registerVariantInstances(instances: VariantInstance[]): void {
    this.variantHandler.registerVariantInstances(instances);
  }

  async executeAnimation(sourceId: string, targetId: string): Promise<void> {
    console.log('Executing animation:', sourceId, '→', targetId);
    
    // First check if source is part of a variant instance
    let variantInstance = this.variantHandler.findVariantInstance(sourceId);
    
    // If not found, check if target is a variant (for clicks from instance children to variants)
    if (!variantInstance) {
      variantInstance = this.variantHandler.findVariantInstanceByTarget(targetId);
    }
    
    if (variantInstance) {
      await this.executeVariantAnimation(variantInstance, sourceId, targetId);
      return;
    }
    
    await this.executeElementAnimation(sourceId, targetId);
  }

  private async executeVariantAnimation(variantInstance: VariantInstance, sourceId: string, targetId: string): Promise<void> {
    const sourceElement = this.elementRegistry.get(sourceId);
    const targetElement = this.elementRegistry.get(targetId);
    const sourceNode = this.nodeRegistry.get(sourceId);
    const targetNode = this.nodeRegistry.get(targetId);

    if (!sourceElement || !targetElement || !sourceNode || !targetNode) {
      console.error('Missing variant elements or nodes for animation');
      return;
    }

    // Hide the instance element during variant animation to prevent double visibility
    // We only want to see the variant elements, not the instance template
    const instanceElement = this.elementRegistry.get(variantInstance.instanceId);
    if (instanceElement) {
      instanceElement.style.display = 'none';
    }

    // Determine which node to use for animation options
    // Always use the original source node for animation options (where the reaction is defined)
    let animationSourceNode = sourceNode;
    
    // For the actual animation, we need to animate from the current active variant to the target
    let animationFromElement: HTMLElement = sourceElement;
    let animationFromNode = sourceNode;
    
    if (!variantInstance.variants.includes(sourceId)) {
      // Source is not a variant, so we need to animate from the current active variant to the target
      const currentActiveVariantId = variantInstance.activeVariant;
      animationFromNode = this.nodeRegistry.get(currentActiveVariantId);
      const activeVariantElement = this.elementRegistry.get(currentActiveVariantId);
      
      if (!animationFromNode || !activeVariantElement) {
        console.error('Missing current active variant for animation');
        return;
      }
      
      animationFromElement = activeVariantElement;
    }

    const options = this.getAnimationOptions(animationSourceNode);
    if (!options) {
      console.log('No reaction found, performing instant variant switch');
      this.variantHandler.executeVariantAnimation(
        variantInstance, sourceId, targetId, sourceElement, targetElement, 
        sourceNode, targetNode, { duration: 0, easing: 'linear', transitionType: 'SMART_ANIMATE' }
      );
      return;
    }

    await this.variantHandler.executeVariantAnimation(
      variantInstance, sourceId, targetId, animationFromElement!, targetElement, 
      animationFromNode, targetNode, options
    );

    this.setupTimeoutReactions(targetId);
    this.setupClickReactions(targetId);
  }

  private async executeElementAnimation(sourceId: string, targetId: string): Promise<void> {
    const sourceElement = this.elementRegistry.get(sourceId);
    const targetElement = this.elementRegistry.get(targetId);
    const sourceNode = this.nodeRegistry.get(sourceId);
    const targetNode = this.nodeRegistry.get(targetId);

    if (!sourceElement || !targetElement || !sourceNode || !targetNode) {
      console.error('Missing elements or nodes for animation');
      return;
    }

    const options = this.getAnimationOptions(sourceNode);
    if (!options) {
      console.log('No reaction found, performing instant switch');
      DOMManipulator.performVariantSwitch(sourceElement, targetElement);
      return;
    }

    const changes = ChangeDetector.detectChanges(sourceNode, targetNode);
    console.log('Animation changes detected:', changes);

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

    this.setupTimeoutReactions(targetId);
    this.setupClickReactions(targetId);
  }

  private async executeSmartAnimate(sourceElement: HTMLElement, targetElement: HTMLElement, changes: AnimationChange[], options: AnimationOptions): Promise<void> {
    return new Promise((resolve) => {
      console.log('Starting SMART_ANIMATE:', options.duration + 's', options.easing);

      DOMManipulator.setupTransitions(sourceElement, changes, options);

      // Apply changes immediately to avoid frame delay
      changes.forEach(change => DOMManipulator.applyChange(sourceElement, change));

      setTimeout(() => {
        console.log('Animation completed, switching to target');
        DOMManipulator.performVariantSwitch(sourceElement, targetElement);
        resolve();
      }, options.duration * 1000);
    });
  }

  private async executeDissolve(sourceElement: HTMLElement, targetElement: HTMLElement, options: AnimationOptions): Promise<void> {
    return new Promise((resolve) => {
      console.log('Starting DISSOLVE:', options.duration + 's');

      sourceElement.style.transition = 'opacity ' + options.duration + 's ' + options.easing;
      targetElement.style.transition = 'opacity ' + options.duration + 's ' + options.easing;
      
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

  private getAnimationOptions(node: any): AnimationOptions | null {
    const reaction = node.reactions && node.reactions[0];
    if (!reaction) {
      return null;
    }

    return new AnimationOptions(
      reaction.action.transition.duration,
      this.mapFigmaEasing(reaction.action.transition.easing.type),
      reaction.action.transition.type
    );
  }

  private mapFigmaEasing(figmaEasing: string): string {
    const easingMap: Record<string, string> = {
      'GENTLE': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      'QUICK': 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
      'BOUNCY': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      'SLOW': 'cubic-bezier(0.23, 1, 0.32, 1)',
      'LINEAR': 'linear',
      'EASE_IN_AND_OUT_BACK': 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
      'EASE_OUT': 'cubic-bezier(0, 0, 0.2, 1)'
    };
    return easingMap[figmaEasing] || easingMap['GENTLE'];
  }

  setupTimeoutReactions(nodeId: string): void {
    const node = this.nodeRegistry.get(nodeId);
    if (!node || !node.reactions) return;

    node.reactions
      .filter((reaction: any) => reaction.trigger.type === 'AFTER_TIMEOUT')
      .forEach((reaction: any) => {
        console.log('Setting up timeout reaction:', reaction.trigger.timeout + 's delay');
        
        const timeout = setTimeout(() => {
          this.executeAnimation(nodeId, reaction.action.destinationId);
        }, (reaction.trigger.timeout || 0) * 1000);
        
        this.timeouts.add(timeout as unknown as number);
      });
  }

  setupClickReactions(nodeId: string): void {
    console.log('🔍 Setting up click reactions for node:', nodeId);
    const node = this.nodeRegistry.get(nodeId);
    if (!node || !node.reactions) {
      console.log('🔍 No node or reactions found for:', nodeId);
      return;
    }

    const element = this.elementRegistry.get(nodeId);
    if (!element) {
      console.warn('Element not found for click setup:', nodeId);
      return;
    }

    node.reactions
      .filter((reaction: any) => reaction.trigger.type === 'ON_CLICK' || reaction.trigger.type === 'ON_PRESS')
      .forEach((reaction: any) => {
        console.log('Setting up click reaction for:', nodeId, '→', reaction.action.destinationId);
        
        // Add click event listener
        element.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          console.log('Click detected on:', nodeId, 'triggering animation to:', reaction.action.destinationId);
          this.executeAnimation(nodeId, reaction.action.destinationId);
        });
        
        // Add visual feedback for clickable elements
        element.style.cursor = 'pointer';
        element.style.userSelect = 'none';
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

// VariantHandler class
export class VariantHandler {
  private variantInstances: VariantInstance[] = [];

  registerVariantInstances(instances: VariantInstance[]): void {
    this.variantInstances = instances;
  }

  findVariantInstance(nodeId: string): VariantInstance | null {
    return this.variantInstances.find(instance => 
      instance.variants.includes(nodeId) || instance.instanceId === nodeId
    ) || null;
  }

  findVariantInstanceByTarget(targetId: string): VariantInstance | null {
    return this.variantInstances.find(instance => 
      instance.variants.includes(targetId)
    ) || null;
  }

  async executeVariantAnimation(
    variantInstance: VariantInstance,
    sourceId: string,
    targetId: string,
    sourceElement: HTMLElement,
    targetElement: HTMLElement,
    sourceNode: any,
    targetNode: any,
    options: AnimationOptions
  ): Promise<void> {
    console.log('Executing variant animation:', sourceId, '→', targetId);

    const changes = ChangeDetector.detectChanges(sourceNode, targetNode);
    console.log('Variant changes detected:', changes);

    switch (options.transitionType) {
      case 'SMART_ANIMATE':
        await this.executeVariantSmartAnimate(variantInstance, sourceId, targetId, sourceElement, targetElement, changes, options);
        break;
      case 'DISSOLVE':
        await this.executeVariantDissolve(variantInstance, sourceId, targetId, sourceElement, targetElement, options);
        break;
      default:
        this.performVariantSwitch(variantInstance, sourceId, targetId, sourceElement, targetElement);
    }

    variantInstance.activeVariant = targetId;
    variantInstance.currentIndex = variantInstance.variants.indexOf(targetId);
  }

  private async executeVariantSmartAnimate(
    variantInstance: VariantInstance,
    sourceId: string,
    targetId: string,
    sourceElement: HTMLElement,
    targetElement: HTMLElement,
    changes: AnimationChange[],
    options: AnimationOptions
  ): Promise<void> {
    return new Promise((resolve) => {
      console.log('🎬 Smart animate:', options.duration + 's');

      const layoutChange = changes.find(change => change.property === 'layout');
      if (layoutChange) {
        DOMManipulator.applyLayoutFlattening(sourceElement, layoutChange);
      }

      // Capture original source state before applying changes
      const originalSourceState = this.captureElementState(sourceElement);

      // Setup transitions
      DOMManipulator.setupTransitions(sourceElement, changes, options);
      DOMManipulator.setupChildTransitions(sourceElement, changes, options);

      // Collect all style changes
      const styleChanges: any[] = [];
      changes.forEach(change => {
        const styleChange = DOMManipulator.prepareChange(sourceElement, change);
        if (styleChange) {
          styleChanges.push(styleChange);
        }
      });

      // Apply all changes simultaneously
      requestAnimationFrame(() => {
        console.log('🎬 Applying changes to element:', sourceElement.getAttribute('data-figma-id'));
        styleChanges.forEach(styleChange => {
          console.log('🎬 Applying change:', styleChange.type, '=', styleChange.value);
          DOMManipulator.applyStyleChange(sourceElement, styleChange);
        });
      });

      setTimeout(() => {
        // Restore source element state before switching variants
        this.restoreElementState(sourceElement, originalSourceState);
        
        console.log('🎬 Smart animate complete, switching variants');
        this.performVariantSwitch(variantInstance, sourceId, targetId, sourceElement, targetElement);
        resolve();
      }, options.duration * 1000);
    });
  }

  private async executeVariantDissolve(
    variantInstance: VariantInstance,
    sourceId: string,
    targetId: string,
    sourceElement: HTMLElement,
    targetElement: HTMLElement,
    options: AnimationOptions
  ): Promise<void> {
    return new Promise((resolve) => {
      console.log('🎬 Variant dissolve:', options.duration + 's');

      sourceElement.style.transition = 'opacity ' + options.duration + 's ' + options.easing;
      targetElement.style.transition = 'opacity ' + options.duration + 's ' + options.easing;
      
      targetElement.style.display = '';
      targetElement.style.opacity = '0';

      requestAnimationFrame(() => {
        sourceElement.style.opacity = '0';
        targetElement.style.opacity = '1';
      });

      setTimeout(() => {
        this.performVariantSwitch(variantInstance, sourceId, targetId, sourceElement, targetElement);
        resolve();
      }, options.duration * 1000);
    });
  }

  private performVariantSwitch(
    variantInstance: VariantInstance,
    sourceId: string,
    targetId: string,
    sourceElement: HTMLElement,
    targetElement: HTMLElement
  ): void {
    console.log('🔄 Variant switch:', sourceId, '→', targetId);
    
    // Log target element state BEFORE switch (simplified to avoid DOM queries)
    console.log('🔄 Target BEFORE switch:', {
      display: targetElement.style.display,
      opacity: targetElement.style.opacity
    });
    
    // Reset source element
    if (sourceElement) {
      sourceElement.style.transition = '';
      sourceElement.style.transform = '';
      sourceElement.style.opacity = '';
      
      // Reset child elements
      const sourceChildElements = sourceElement.querySelectorAll('[data-figma-id]');
      sourceChildElements.forEach(child => {
        (child as HTMLElement).style.transition = '';
        (child as HTMLElement).style.transform = '';
        (child as HTMLElement).style.opacity = '';
      });
    }
    
    // Hide all variants
    variantInstance.variants.forEach(variantId => {
      const element = document.querySelector(`[data-figma-id="${variantId}"]`) as HTMLElement;
      if (element) {
        element.style.display = 'none';
      }
    });

    // Show target variant - CRITICAL: Set both display AND opacity with !important
    if (targetElement) {
      targetElement.style.setProperty('display', 'block', 'important');
      targetElement.style.setProperty('opacity', '1', 'important');
      targetElement.style.transform = '';
      
      // Log target element state AFTER switch (simplified to avoid DOM queries)
      console.log('🔄 Target AFTER switch:', {
        display: targetElement.style.display,
        opacity: targetElement.style.opacity
      });
    }
  }

  private captureElementState(element: HTMLElement): any {
    const state = {
      element: {
        transition: element.style.transition,
        transform: element.style.transform,
        opacity: element.style.opacity,
        backgroundColor: element.style.backgroundColor
      },
      children: [] as any[]
    };

    // Capture child element states
    const childElements = element.querySelectorAll('[data-figma-id]');
    childElements.forEach(child => {
      const childElement = child as HTMLElement;
      const childState = {
        id: childElement.getAttribute('data-figma-id'),
        style: {
          transition: childElement.style.transition,
          transform: childElement.style.transform,
          opacity: childElement.style.opacity,
          backgroundColor: childElement.style.backgroundColor,
          fill: childElement.style.fill
        },
        isPath: childElement.tagName === 'path',
        element: childElement // Direct reference for path elements
      };
      state.children.push(childState);
    });

    return state;
  }

  private restoreElementState(element: HTMLElement, state: any): void {
    // Restore element state
    element.style.transition = state.element.transition;
    element.style.transform = state.element.transform;
    element.style.opacity = state.element.opacity;
    element.style.backgroundColor = state.element.backgroundColor;

    // Restore child element states
    state.children.forEach((childState: any) => {
      const childElement = childState.isPath ? childState.element : 
        element.querySelector(`[data-figma-id="${childState.id}"]`) as HTMLElement;
      
      if (childElement) {
        childElement.style.transition = childState.style.transition;
        childElement.style.transform = childState.style.transform;
        childElement.style.opacity = childState.style.opacity;
        childElement.style.backgroundColor = childState.style.backgroundColor;
        childElement.style.fill = childState.style.fill;
      }
    });
  }
}
