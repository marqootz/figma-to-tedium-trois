import { AnimationChange, StyleChange } from '../types/animation-types';

export class DOMManipulator {
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
      case 'sizing':
        const { horizontal, vertical } = change.targetValue;
        
        // Apply horizontal sizing
        if (horizontal) {
          switch (horizontal) {
            case 'FILL':
              element.style.width = '100%';
              break;
            case 'HUG':
              element.style.width = 'fit-content';
              break;
            case 'FIXED':
              // Width should already be set, no change needed
              break;
          }
        }
        
        // Apply vertical sizing
        if (vertical) {
          switch (vertical) {
            case 'FILL':
              element.style.height = '100%';
              break;
            case 'HUG':
              element.style.height = 'fit-content';
              break;
            case 'FIXED':
              // Height should already be set, no change needed
              break;
          }
        }
        break;
      case 'childPosition':
        // Try to find the child by the change.childId
        let childElement = element.querySelector(`[data-figma-id="${change.childId}"]`) as HTMLElement;
        
        if (!childElement) {
          // If not found, try to find by name path instead
          const pathParts = change.childName?.split('/') || [];
          const childName = pathParts[pathParts.length - 1]; // Get the last part
          const allChildrenWithName = element.querySelectorAll(`[data-figma-name="${childName}"]`);
          if (allChildrenWithName.length > 0) {
            childElement = allChildrenWithName[0] as HTMLElement; // Take the first match
          }
        }
        
        if (childElement) {
          // Calculate relative delta instead of absolute position
          const deltaX = change.targetValue.x - change.sourceValue.x;
          const deltaY = change.targetValue.y - change.sourceValue.y;
          childElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
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
      case 'childBackground':
        const backgroundChildElement = element.querySelector(`[data-figma-id="${change.childId}"]`) as HTMLElement;
        if (backgroundChildElement) {
          const fill = change.targetValue[0];
          if (fill && fill.color) {
            const { r, g, b } = fill.color;
            const alpha = fill.opacity || 1;
            backgroundChildElement.style.backgroundColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
            console.log('Applied child background change to', change.childName, ':', `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`);
          }
        }
        break;
    }
  }

  static prepareChange(element: HTMLElement, change: AnimationChange): StyleChange | null {
    switch (change.property) {
      case 'position':
        const { x, y } = change.targetValue;
        return { type: 'transform', value: `translate(${x}px, ${y}px)`, target: element };
      case 'size':
        const { width, height } = change.targetValue;
        return { type: 'size', width, height, target: element };
      case 'opacity':
        return { type: 'opacity', value: change.targetValue.toString(), target: element };
      case 'background':
        const fill = change.targetValue[0];
        if (fill && fill.color) {
          const { r, g, b } = fill.color;
          const alpha = fill.opacity || 1;
          return { type: 'backgroundColor', value: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`, target: element };
        }
        return null;
      case 'borderRadius':
        return { type: 'borderRadius', value: change.targetValue + 'px', target: element };
      case 'childPosition':
        const childElement = element.querySelector(`[data-figma-id="${change.childId}"]`) as HTMLElement;
        if (childElement) {
          const deltaX = change.targetValue.x - change.sourceValue.x;
          const deltaY = change.targetValue.y - change.sourceValue.y;
          return { type: 'transform', value: `translate(${deltaX}px, ${deltaY}px)`, target: childElement };
        }
        return null;
      case 'childSize':
        const sizeChildElement = element.querySelector(`[data-figma-id="${change.childId}"]`) as HTMLElement;
        if (sizeChildElement) {
          const { width, height } = change.targetValue;
          return { type: 'childSize', width, height, target: sizeChildElement };
        }
        return null;
      case 'childOpacity':
        const opacityChildElement = element.querySelector(`[data-figma-id="${change.childId}"]`) as HTMLElement;
        if (opacityChildElement) {
          return { type: 'opacity', value: change.targetValue.toString(), target: opacityChildElement };
        }
        return null;
      case 'childBackground':
        const backgroundChildElement = element.querySelector(`[data-figma-id="${change.childId}"]`) as HTMLElement;
        if (backgroundChildElement) {
          const fill = change.targetValue[0];
          if (fill && fill.color) {
            const { r, g, b } = fill.color;
            const alpha = fill.opacity || 1;
            return { type: 'backgroundColor', value: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`, target: backgroundChildElement };
          }
        }
        return null;
      case 'childFill':
        const fillChildElement = element.querySelector(`[data-figma-id="${change.childId}"]`) as HTMLElement;
        if (fillChildElement) {
          // For SVG elements, we need to traverse: svg > g > path
          const pathElement = fillChildElement.querySelector('g path') || fillChildElement.querySelector('path');
          if (pathElement) {
            const fill = change.targetValue[0];
            if (fill && fill.color) {
              const { r, g, b } = fill.color;
              const alpha = fill.opacity || 1;
              return { type: 'fill', value: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`, target: pathElement };
            }
          }
        }
        return null;
      default:
        return null;
    }
  }

  static applyStyleChange(_element: HTMLElement, styleChange: StyleChange): void {
    switch (styleChange.type) {
      case 'transform':
        (styleChange.target as HTMLElement).style.transform = styleChange.value || '';
        break;
      case 'size':
        if (styleChange.width !== undefined) {
          (styleChange.target as HTMLElement).style.width = styleChange.width + 'px';
        }
        if (styleChange.height !== undefined) {
          (styleChange.target as HTMLElement).style.height = styleChange.height + 'px';
        }
        break;
      case 'opacity':
        (styleChange.target as HTMLElement).style.opacity = styleChange.value || '';
        break;
      case 'backgroundColor':
        console.log('🎨 Applying background color to element:', styleChange.target.getAttribute('data-figma-id'), 'value:', styleChange.value);
        (styleChange.target as HTMLElement).style.backgroundColor = styleChange.value || '';
        break;
      case 'fill':
        console.log('🎨 Applying fill color to path element:', styleChange.target.tagName, 'value:', styleChange.value);
        (styleChange.target as SVGElement).style.fill = styleChange.value || '';
        break;
      case 'borderRadius':
        (styleChange.target as HTMLElement).style.borderRadius = styleChange.value || '';
        break;
      case 'childSize':
        if (styleChange.width !== undefined) {
          (styleChange.target as HTMLElement).style.width = styleChange.width + 'px';
        }
        if (styleChange.height !== undefined) {
          (styleChange.target as HTMLElement).style.height = styleChange.height + 'px';
        }
        break;
    }
  }

  static setupTransitions(element: HTMLElement, changes: AnimationChange[], options: any): void {
    const transitionProperties = this.getTransitionProperties(changes);
    const transitionString = transitionProperties
      .map(prop => prop + ' ' + options.duration + 's ' + options.easing)
      .join(', ');
    
    console.log('🎬 Setting up transitions for element:', element.getAttribute('data-figma-id'));
    console.log('🎬 Transition properties:', transitionProperties);
    console.log('🎬 Transition string:', transitionString);
    
    element.style.transition = transitionString;
  }

  static setupChildTransitions(element: HTMLElement, changes: AnimationChange[], options: any): void {
    const childChanges = changes.filter(change => 
      change.property === 'childPosition' || 
      change.property === 'childSize' || 
      change.property === 'childOpacity' ||
      change.property === 'childBackground' ||
      change.property === 'childFill'
    );
    
    childChanges.forEach(change => {
      const childElement = element.querySelector(`[data-figma-id="${change.childId}"]`) as HTMLElement;
      if (childElement) {
        const childTransitionProps: string[] = [];
        if (change.property === 'childPosition' || change.property === 'childSize') {
          childTransitionProps.push('transform');
        }
        if (change.property === 'childOpacity') {
          childTransitionProps.push('opacity');
        }
        if (change.property === 'childBackground') {
          childTransitionProps.push('background-color');
        }
        if (change.property === 'childFill') {
          childTransitionProps.push('fill');
        }
        if (childTransitionProps.length > 0) {
          childElement.style.transition = childTransitionProps
            .map(prop => prop + ' ' + options.duration + 's ' + options.easing)
            .join(', ');
        }
      }
    });
  }

  static getTransitionProperties(changes: AnimationChange[]): string[] {
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
        case 'childBackground':
          properties.add('background-color');
          break;
        case 'childFill':
          properties.add('fill');
          break;
        case 'background':
          properties.add('background-color');
          break;
        case 'borderRadius':
          properties.add('border-radius');
          break;
        case 'sizing':
          properties.add('width');
          properties.add('height');
          break;
        case 'layout':
          properties.add('all');
          break;
      }
    });

    return Array.from(properties);
  }

  static applyLayoutFlattening(element: HTMLElement, _layoutChange: any): void {
    const parent = element.parentElement;
    if (parent && parent.style.display === 'flex') {
      const children = Array.from(parent.children);
      children.forEach(child => {
        const rect = (child as HTMLElement).getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        
        (child as HTMLElement).style.position = 'absolute';
        (child as HTMLElement).style.left = (rect.left - parentRect.left) + 'px';
        (child as HTMLElement).style.top = (rect.top - parentRect.top) + 'px';
        (child as HTMLElement).style.width = rect.width + 'px';
        (child as HTMLElement).style.height = rect.height + 'px';
      });
      
      parent.style.display = 'block';
    }
  }

  static performVariantSwitch(sourceElement: HTMLElement, targetElement: HTMLElement): void {
    console.log('Performing instant variant switch');
    
    const componentSet = sourceElement.closest('[data-component-set]');
    if (componentSet) {
      const variants = componentSet.querySelectorAll('[data-variant]');
      variants.forEach(variant => {
        (variant as HTMLElement).style.display = 'none';
      });
    }

    targetElement.style.display = '';
    targetElement.style.opacity = '1';
    targetElement.style.transform = '';
  }
}
