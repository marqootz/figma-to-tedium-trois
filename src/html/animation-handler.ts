import { FigmaNode } from '../core/types';

export class AnimationHandler {
  generateAnimationCode(nodes: FigmaNode[], resolvedInstances?: any[]): string {
    return `
      // Initialize Figma Animation System
      ${this.getAnimationSystemCode()}
      
      document.addEventListener('DOMContentLoaded', function() {
        window.figmaAnimationSystem = new FigmaAnimationSystem();
        
        // Register all nodes and elements
        ${this.generateNodeRegistrations(nodes)}
        
        // Register variant elements if we have resolved instances
        ${resolvedInstances ? this.generateVariantRegistrations(resolvedInstances) : ''}
        
        // Setup initial timeout reactions
        ${this.generateInitialTimeouts(nodes)}
        
        // Setup variant animation system
        ${resolvedInstances ? this.generateVariantAnimationSetup(resolvedInstances) : ''}
        
        console.log('Animation system initialized with ${nodes.length} nodes${resolvedInstances ? ' and ' + resolvedInstances.length + ' resolved instances' : ''}');
      });
    `;
  }

  private getAnimationSystemCode(): string {
    // Return the complete FigmaAnimationSystem class as a string
    // This is a simplified browser-compatible version
    return `
      class FigmaAnimationSystem {
        constructor() {
          this.elementRegistry = new Map();
          this.nodeRegistry = new Map();
          this.timeouts = new Set();
          console.log('FigmaAnimationSystem initialized');
        }
        
        registerElement(figmaId, element, node) {
          this.elementRegistry.set(figmaId, element);
          this.nodeRegistry.set(figmaId, node);
          element.setAttribute('data-figma-id', figmaId);
          console.log('Registered element:', figmaId, node.name);
        }
        
        async executeAnimation(sourceId, targetId) {
          console.log('Executing animation:', sourceId, '→', targetId);
          
          const sourceElement = this.elementRegistry.get(sourceId);
          const targetElement = this.elementRegistry.get(targetId);
          const sourceNode = this.nodeRegistry.get(sourceId);
          const targetNode = this.nodeRegistry.get(targetId);

          if (!sourceElement || !targetElement || !sourceNode || !targetNode) {
            console.error('Missing elements or nodes for animation');
            return;
          }

          // Get animation configuration
          const reaction = sourceNode.reactions && sourceNode.reactions[0];
          if (!reaction) {
            console.log('No reaction found, performing instant switch');
            this.performInstantSwitch(sourceElement, targetElement);
            return;
          }

          const options = {
            duration: reaction.action.transition.duration,
            easing: this.mapFigmaEasing(reaction.action.transition.easing.type),
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
        
        mapFigmaEasing(figmaEasing) {
          const easingMap = {
            'GENTLE': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            'QUICK': 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
            'BOUNCY': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            'SLOW': 'cubic-bezier(0.23, 1, 0.32, 1)',
            'LINEAR': 'linear'
          };
          return easingMap[figmaEasing] || easingMap['GENTLE'];
        }
        
        detectChanges(source, target) {
          const changes = [];

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
        
        async executeSmartAnimate(sourceElement, targetElement, changes, options) {
          return new Promise((resolve) => {
            console.log('Starting SMART_ANIMATE:', options.duration + 's', options.easing);

            // Setup CSS transitions
            const properties = this.getTransitionProperties(changes);
            sourceElement.style.transition = properties
              .map(prop => prop + ' ' + options.duration + 's ' + options.easing)
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
        
        async executeDissolve(sourceElement, targetElement, options) {
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
        
        getTransitionProperties(changes) {
          const properties = new Set();
          
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
        
        applyChange(element, change) {
          console.log('Applying change:', change.property, '=', change.targetValue);

          switch (change.property) {
            case 'translateY':
              element.style.transform = 'translateY(' + change.delta + 'px)';
              break;
            case 'translateX':
              element.style.transform = 'translateX(' + change.delta + 'px)';
              break;
            case 'alignment':
              const parent = element.parentElement;
              if (parent) {
                const alignMap = { 'MIN': 'flex-start', 'CENTER': 'center', 'MAX': 'flex-end' };
                parent.style.alignItems = alignMap[change.targetValue] || 'center';
              }
              break;
            case 'opacity':
              element.style.opacity = change.targetValue.toString();
              break;
          }
        }
        
        performInstantSwitch(sourceElement, targetElement) {
          console.log('Performing instant variant switch');
          
          // Hide all variants in the component set
          const componentSet = sourceElement.closest('[data-component-set]');
          if (componentSet) {
            const variants = componentSet.querySelectorAll('[data-variant]');
            variants.forEach(variant => {
              variant.style.display = 'none';
            });
          }

          // Show target variant
          targetElement.style.display = '';
          targetElement.style.opacity = '1';
          targetElement.style.transform = '';
        }
        
        setupTimeoutReactions(nodeId) {
          const node = this.nodeRegistry.get(nodeId);
          if (!node || !node.reactions) return;

          node.reactions
            .filter(reaction => reaction.trigger.type === 'AFTER_TIMEOUT')
            .forEach(reaction => {
              console.log('Setting up timeout reaction:', reaction.trigger.timeout + 's delay');
              
              const timeout = setTimeout(() => {
                this.executeAnimation(nodeId, reaction.action.destinationId);
              }, (reaction.trigger.timeout || 0) * 1000);
              
              this.timeouts.add(timeout);
            });
        }
        
        clearAllTimeouts() {
          this.timeouts.forEach(timeout => clearTimeout(timeout));
          this.timeouts.clear();
          console.log('All timeout reactions cleared');
        }
        
        destroy() {
          this.clearAllTimeouts();
          this.elementRegistry.clear();
          this.nodeRegistry.clear();
          console.log('FigmaAnimationSystem destroyed');
        }
      }
    `;
  }

  private generateNodeRegistrations(nodes: FigmaNode[]): string {
    return nodes.map(node => {
      const sanitizedId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
      return `
        const element_${sanitizedId} = document.querySelector('[data-figma-id="${node.id}"]');
        if (element_${sanitizedId}) {
          window.figmaAnimationSystem.registerElement(
            '${node.id}',
            element_${sanitizedId},
            ${JSON.stringify(node)}
          );
        } else {
          console.warn('Element not found for node: ${node.id}');
        }
      `;
    }).join('\n');
  }

  private generateInitialTimeouts(nodes: FigmaNode[]): string {
    const nodesWithTimeouts = nodes.filter(node => 
      node.reactions?.some(reaction => reaction.trigger.type === 'AFTER_TIMEOUT')
    );

    return nodesWithTimeouts.map(node => `
      // Setup timeout reactions for ${node.name}
      window.figmaAnimationSystem.setupTimeoutReactions('${node.id}');
    `).join('\n');
  }

  // Generate registrations for variant elements
  private generateVariantRegistrations(resolvedInstances: any[]): string {
    let registrations = '';
    
    resolvedInstances.forEach(instance => {
      const { variants } = instance;
      
      variants.forEach((variant: FigmaNode) => {
        const sanitizedId = variant.id.replace(/[^a-zA-Z0-9]/g, '_');
        registrations += `
        const variant_${sanitizedId} = document.querySelector('[data-figma-id="${variant.id}"]');
        if (variant_${sanitizedId}) {
          window.figmaAnimationSystem.registerElement(
            '${variant.id}',
            variant_${sanitizedId},
            ${JSON.stringify(variant)}
          );
        } else {
          console.warn('Variant element not found: ${variant.id}');
        }
      `;
      });
    });
    
    return registrations;
  }

  // Generate variant animation setup
  private generateVariantAnimationSetup(resolvedInstances: any[]): string {
    let setup = '';
    
    resolvedInstances.forEach(instance => {
      const { instance: instanceNode, variants, activeVariant } = instance;
      
      setup += `
      // Setup variant animation for ${instanceNode.name}
      const instance_${instanceNode.id.replace(/[^a-zA-Z0-9]/g, '_')} = {
        instanceId: '${instanceNode.id}',
        variants: [${variants.map((v: FigmaNode) => `'${v.id}'`).join(', ')}],
        activeVariant: '${activeVariant.id}',
        currentIndex: ${variants.findIndex((v: FigmaNode) => v.id === activeVariant.id)}
      };
      
      // Add variant switching methods to animation system
      window.figmaAnimationSystem.variantInstances = window.figmaAnimationSystem.variantInstances || [];
      window.figmaAnimationSystem.variantInstances.push(instance_${instanceNode.id.replace(/[^a-zA-Z0-9]/g, '_')});
      `;
    });
    
    return setup;
  }
}


