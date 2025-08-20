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
    console.log('Executing variant animation:', sourceId, '→', targetId);

    // Detect comprehensive changes between variants
    const changes = ChangeDetector.detectChanges(sourceNode, targetNode);
    console.log('Variant changes detected:', changes);

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
    variantInstance.activeVariant = targetId;
    variantInstance.currentIndex = variantInstance.variants.indexOf(targetId);
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
      console.log('Starting variant SMART_ANIMATE:', options.duration + 's', options.easing);

      // Apply hybrid flattening if layout changes detected
      const layoutChange = changes.find(change => change.property === 'layout');
      if (layoutChange) {
        DOMManipulator.applyLayoutFlattening(sourceElement, layoutChange);
      }

      // Setup CSS transitions for all changing properties
      DOMManipulator.setupTransitions(sourceElement, changes, options);

      // Setup transitions for child elements that will be animated
      DOMManipulator.setupChildTransitions(sourceElement, changes, options);

      // Apply changes on next frame
      requestAnimationFrame(() => {
        changes.forEach(change => DOMManipulator.applyChange(sourceElement, change));
      });

      // Complete animation
      setTimeout(() => {
        console.log('Variant animation completed, switching to target');
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
    _sourceElement: HTMLElement,
    targetElement: HTMLElement
  ): void {
    console.log('Performing variant switch:', sourceId, '→', targetId);
    
    // Hide all variants in the instance and reset their states
    variantInstance.variants.forEach(variantId => {
      const element = document.querySelector(`[data-figma-id="${variantId}"]`) as HTMLElement;
      if (element) {
        element.style.display = 'none';
        // Reset any applied transitions and transforms
        element.style.transition = '';
        element.style.transform = '';
        
        // Reset child elements as well
        const childElements = element.querySelectorAll('[data-figma-id]') as NodeListOf<HTMLElement>;
        childElements.forEach(child => {
          child.style.transition = '';
          child.style.transform = '';
        });
      }
    });

    // Show target variant with clean state
    if (targetElement) {
      targetElement.style.display = 'block';
      targetElement.style.opacity = '1';
      targetElement.style.transform = '';
      targetElement.style.transition = '';
      
      // Reset child elements of target variant
      const childElements = targetElement.querySelectorAll('[data-figma-id]') as NodeListOf<HTMLElement>;
      childElements.forEach(child => {
        child.style.transition = '';
        child.style.transform = '';
      });
    }
  }
}
