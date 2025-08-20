import { AnimationChange, AnimationOptions } from './types';

export class DOMManipulator {
  /**
   * Apply a change to an element
   */
  static applyChange(element: HTMLElement, change: AnimationChange): void {
    console.log('Applying change:', change.property, '=', change.targetValue);

    switch (change.property) {
      case 'position':
        const { x, y } = change.targetValue;
        element.style.transform = `translate(${x}px, ${y}px)`;
        break;
      case 'size':
        const { width, height } = change.targetValue;
        element.style.width = width + 'px';
        element.style.height = height + 'px';
        break;
      case 'opacity':
        element.style.opacity = change.targetValue.toString();
        break;
      case 'background':
        const fill = change.targetValue[0];
        if (fill && fill.color) {
          const { r, g, b } = fill.color;
          const alpha = fill.opacity || 1;
          element.style.backgroundColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
        }
        break;
      case 'borderRadius':
        element.style.borderRadius = change.targetValue + 'px';
        break;
      case 'childPosition':
        const childElement = element.querySelector(`[data-figma-id="${change.childId}"]`) as HTMLElement;
        if (childElement) {
          const { x, y } = change.targetValue;
          childElement.style.transform = `translate(${x}px, ${y}px)`;
          console.log('Applied child position change to', change.childName, ':', x, y);
        }
        break;
      case 'childSize':
        const sizeChildElement = element.querySelector(`[data-figma-id="${change.childId}"]`) as HTMLElement;
        if (sizeChildElement) {
          const { width, height } = change.targetValue;
          sizeChildElement.style.width = width + 'px';
          sizeChildElement.style.height = height + 'px';
          console.log('Applied child size change to', change.childName, ':', width, height);
        }
        break;
      case 'childOpacity':
        const opacityChildElement = element.querySelector(`[data-figma-id="${change.childId}"]`) as HTMLElement;
        if (opacityChildElement) {
          opacityChildElement.style.opacity = change.targetValue.toString();
          console.log('Applied child opacity change to', change.childName, ':', change.targetValue);
        }
        break;
      case 'alignment':
        const parent = element.parentElement;
        if (parent) {
          const alignMap: Record<string, string> = { 'MIN': 'flex-start', 'CENTER': 'center', 'MAX': 'flex-end' };
          parent.style.alignItems = alignMap[change.targetValue as string] || 'center';
        }
        break;
    }
  }

  /**
   * Setup CSS transitions for an element
   */
  static setupTransitions(element: HTMLElement, changes: AnimationChange[], options: AnimationOptions): void {
    const transitionProperties = this.getTransitionProperties(changes);
    element.style.transition = transitionProperties
      .map(prop => prop + ' ' + options.duration + 's ' + options.easing)
      .join(', ');
  }

  /**
   * Setup transitions for child elements
   */
  static setupChildTransitions(element: HTMLElement, changes: AnimationChange[], options: AnimationOptions): void {
    const childChanges = changes.filter(change => 
      change.property === 'childPosition' || 
      change.property === 'childSize' || 
      change.property === 'childOpacity'
    );
    
    childChanges.forEach(change => {
      const childElement = element.querySelector(`[data-figma-id="${change.childId}"]`) as HTMLElement;
      if (childElement) {
        const childTransitionProps = [];
        if (change.property === 'childPosition' || change.property === 'childSize') {
          childTransitionProps.push('transform');
        }
        if (change.property === 'childOpacity') {
          childTransitionProps.push('opacity');
        }
        if (childTransitionProps.length > 0) {
          childElement.style.transition = childTransitionProps
            .map(prop => prop + ' ' + options.duration + 's ' + options.easing)
            .join(', ');
        }
      }
    });
  }

  /**
   * Apply layout flattening for animation
   */
  static applyLayoutFlattening(element: HTMLElement, _layoutChange: AnimationChange): void {
    const parent = element.parentElement;
    if (parent && parent.style.display === 'flex') {
      const children = Array.from(parent.children) as HTMLElement[];
      children.forEach(child => {
        const rect = child.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        
        child.style.position = 'absolute';
        child.style.left = (rect.left - parentRect.left) + 'px';
        child.style.top = (rect.top - parentRect.top) + 'px';
        child.style.width = rect.width + 'px';
        child.style.height = rect.height + 'px';
      });
      
      parent.style.display = 'block';
    }
  }

  /**
   * Perform instant variant switch
   */
  static performVariantSwitch(sourceElement: HTMLElement, targetElement: HTMLElement): void {
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

  /**
   * Get transition properties for changes
   */
  private static getTransitionProperties(changes: AnimationChange[]): string[] {
    const properties = new Set<string>();
    
    changes.forEach(change => {
      switch (change.property) {
        case 'position':
        case 'size':
        case 'childPosition':
        case 'childSize':
          properties.add('transform');
          break;
        case 'opacity':
        case 'childOpacity':
          properties.add('opacity');
          break;
        case 'background':
          properties.add('background-color');
          break;
        case 'borderRadius':
          properties.add('border-radius');
          break;
        case 'layout':
          properties.add('all');
          break;
      }
    });

    return Array.from(properties);
  }
}
