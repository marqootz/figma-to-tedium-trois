import { VariantInstance, FigmaNodeData, AnimationChange, AnimationOptions } from './types';
import { ChangeDetector } from './change-detector';
import { DOMManipulator } from './dom-manipulator';

export class VariantHandler {
  private variantInstances: VariantInstance[] = [];

  /**
   * Register variant instances
   */
  registerVariantInstances(instances: VariantInstance[]): void {
    this.variantInstances = instances;
  }

  /**
   * Find variant instance by node ID
   */
  findVariantInstance(nodeId: string): VariantInstance | null {
    return this.variantInstances.find(instance => 
      instance.variants.includes(nodeId) || instance.instanceId === nodeId
    ) || null;
  }

  /**
   * Execute variant animation
   */
  async executeVariantAnimation(
    variantInstance: VariantInstance,
    sourceId: string,
    targetId: string,
    sourceElement: HTMLElement,
    targetElement: HTMLElement,
    sourceNode: FigmaNodeData,
    targetNode: FigmaNodeData,
    options: AnimationOptions
  ): Promise<void> {
    console.log('🎬 === ANIMATION CYCLE START ===');
    console.log('🎬 Executing variant animation:', sourceId, '→', targetId);
    console.log('🎬 Current activeVariant:', variantInstance.activeVariant);
    
    // Log initial element states
    this.logElementState('SOURCE', sourceId, sourceElement);
    this.logElementState('TARGET', targetId, targetElement);

    // Detect comprehensive changes between variants
    const changes = ChangeDetector.detectChanges(sourceNode, targetNode);
    console.log('🎬 Variant changes detected:', changes);

    // Execute variant animation based on transition type
    switch (options.transitionType) {
      case 'SMART_ANIMATE':
        await this.executeVariantSmartAnimate(
          variantInstance, 
          sourceId, 
          targetId, 
          sourceElement, 
          targetElement, 
          changes, 
          options
        );
        break;
      case 'DISSOLVE':
        await this.executeVariantDissolve(
          variantInstance, 
          sourceId, 
          targetId, 
          sourceElement, 
          targetElement, 
          options
        );
        break;
      default:
        this.performVariantSwitch(variantInstance, sourceId, targetId, sourceElement, targetElement);
    }

    // Update variant instance state
    console.log('🎬 Updating variant instance state...');
    console.log('🎬 Old activeVariant:', variantInstance.activeVariant);
    variantInstance.activeVariant = targetId;
    variantInstance.currentIndex = variantInstance.variants.indexOf(targetId);
    console.log('🎬 New activeVariant:', variantInstance.activeVariant);
    
    // Log final element states after animation
    this.logElementState('SOURCE (after)', sourceId, sourceElement);
    this.logElementState('TARGET (after)', targetId, targetElement);
    
    // CRITICAL: Reset the scene state so the target becomes the new source
    // This ensures each animation cycle is treated as an isolated scene
    console.log('🎬 Animation cycle complete. Target', targetId, 'is now the new source for next animation.');
    console.log('🎬 === ANIMATION CYCLE END ===');
  }

  /**
   * Execute Smart Animate for variants
   */
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
      console.log('🎭 Starting variant SMART_ANIMATE:', options.duration + 's', options.easing);
      
      // Log target element state before reset
      console.log('🎭 Target element BEFORE reset:');
      this.logElementState('TARGET_BEFORE_RESET', targetId, targetElement);

      // Ensure target element is visible and reset to initial state
      console.log('🎭 Resetting target element to initial state...');
      targetElement.style.display = 'block';
      targetElement.style.opacity = '1';
      targetElement.style.transform = '';
      targetElement.style.transition = '';
      
      // Reset child elements of target variant to initial state
      const childElements = targetElement.querySelectorAll('[data-figma-id]') as NodeListOf<HTMLElement>;
      console.log('🎭 Resetting', childElements.length, 'child elements...');
      childElements.forEach(child => {
        child.style.transition = '';
        child.style.transform = '';
        child.style.width = '';
        child.style.height = '';
        child.style.opacity = '';
      });
      
      // Log target element state after reset
      console.log('🎭 Target element AFTER reset:');
      this.logElementState('TARGET_AFTER_RESET', targetId, targetElement);

      // Apply hybrid flattening if layout changes detected
      const layoutChange = changes.find(change => change.property === 'layout');
      if (layoutChange) {
        DOMManipulator.applyLayoutFlattening(targetElement, layoutChange);
      }

      // Setup CSS transitions for all changing properties on target element
      DOMManipulator.setupTransitions(targetElement, changes, options);

      // Setup transitions for child elements that will be animated
      DOMManipulator.setupChildTransitions(targetElement, changes, options);

      // Apply changes on next frame to target element
      requestAnimationFrame(() => {
        console.log('🎭 Applying animation changes to target element...');
        changes.forEach(change => {
          console.log('🎭 Applying change:', change.property, change.targetValue);
          DOMManipulator.applyChange(targetElement, change);
        });
        
        // Log target element state after animation changes applied
        console.log('🎭 Target element AFTER animation changes:');
        this.logElementState('TARGET_AFTER_CHANGES', targetId, targetElement);
      });

      // Complete animation
      setTimeout(() => {
        console.log('🎭 Variant animation completed, switching to target');
        this.performVariantSwitch(variantInstance, sourceId, targetId, sourceElement, targetElement);
        resolve();
      }, options.duration * 1000);
    });
  }

  /**
   * Execute Dissolve animation for variants
   */
  private async executeVariantDissolve(
    variantInstance: VariantInstance,
    sourceId: string,
    targetId: string,
    _sourceElement: HTMLElement,
    targetElement: HTMLElement,
    options: AnimationOptions
  ): Promise<void> {
    return new Promise((resolve) => {
      console.log('Starting variant DISSOLVE:', options.duration + 's');

      _sourceElement.style.transition = 'opacity ' + options.duration + 's ' + options.easing;
      targetElement.style.transition = 'opacity ' + options.duration + 's ' + options.easing;
      
      // Show target with 0 opacity
      targetElement.style.display = 'block';
      targetElement.style.opacity = '0';

      requestAnimationFrame(() => {
        _sourceElement.style.opacity = '0';
        targetElement.style.opacity = '1';
      });

      setTimeout(() => {
        this.performVariantSwitch(variantInstance, sourceId, targetId, _sourceElement, targetElement);
        resolve();
      }, options.duration * 1000);
    });
  }

  /**
   * Perform variant switch
   */
  private performVariantSwitch(
    variantInstance: VariantInstance,
    sourceId: string,
    targetId: string,
    sourceElement: HTMLElement,
    targetElement: HTMLElement
  ): void {
    console.log('🔄 === VARIANT SWITCH START ===');
    console.log('🔄 Performing variant switch:', sourceId, '→', targetId);
    
    // Reset the source element to its original state before hiding it
    // This ensures it's clean when it becomes a target again
    if (sourceElement) {
      console.log('🔄 Resetting source element to original state:', sourceId);
      sourceElement.style.transition = '';
      sourceElement.style.transform = '';
      sourceElement.style.opacity = '';
      
      // Reset child elements of source variant to original state
      const sourceChildElements = sourceElement.querySelectorAll('[data-figma-id]') as NodeListOf<HTMLElement>;
      sourceChildElements.forEach(child => {
        child.style.transition = '';
        child.style.transform = '';
        child.style.opacity = '';
      });
    }
    
    // Hide all variants
    variantInstance.variants.forEach(variantId => {
      const element = document.querySelector(`[data-figma-id="${variantId}"]`) as HTMLElement;
      if (element) {
        element.style.display = 'none';
      }
    });

    // Show target variant
    if (targetElement) {
      targetElement.style.display = 'block';
      targetElement.style.opacity = '1';
      targetElement.style.transform = '';
    }
  }

  /**
   * Log element visual state for debugging
   */
  private logElementState(label: string, elementId: string, element: HTMLElement): void {
    const computedStyle = window.getComputedStyle(element);
    console.log(`🔍 ${label} Element ${elementId} state:`, {
      display: element.style.display || computedStyle.display,
      opacity: element.style.opacity || computedStyle.opacity,
      transform: element.style.transform || computedStyle.transform,
      transition: element.style.transition || computedStyle.transition,
      width: element.style.width || computedStyle.width,
      height: element.style.height || computedStyle.height,
      offsetWidth: element.offsetWidth,
      offsetHeight: element.offsetHeight,
      visible: element.offsetParent !== null
    });
    
    // Log child element states for key elements
    const childElements = element.querySelectorAll('[data-figma-id]');
    if (childElements.length > 0) {
      console.log(`🔍 ${label} Child elements:`, Array.from(childElements).slice(0, 3).map(child => {
        const childEl = child as HTMLElement;
        const childComputed = window.getComputedStyle(childEl);
        return {
          id: childEl.getAttribute('data-figma-id'),
          transform: childEl.style.transform || childComputed.transform,
          width: childEl.style.width || childComputed.width,
          height: childEl.style.height || childComputed.height
        };
      }));
    }
  }
}
