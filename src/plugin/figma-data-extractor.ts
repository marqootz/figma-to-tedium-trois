import { FigmaNode, FigmaFill, FigmaReaction } from '../core/types';

export class FigmaDataExtractor {
  async extractNodes(selection: readonly SceneNode[]): Promise<FigmaNode[]> {
    const nodes: FigmaNode[] = [];
    
    for (const node of selection) {
      const extractedNode = await this.extractNode(node);
      nodes.push(extractedNode);
    }
    
    return nodes;
  }

  private async extractNode(node: SceneNode): Promise<FigmaNode> {
    
    const baseNode: FigmaNode = {
      id: node.id,
      name: node.name,
      type: node.type,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      opacity: 'opacity' in node ? node.opacity : 1,
      fills: this.extractFills(node),
      strokes: this.extractStrokes(node),
      strokeWeight: this.extractStrokeWeight(node),
      cornerRadius: this.extractCornerRadius(node),
      layoutMode: this.extractLayoutMode(node) as any,
      counterAxisAlignItems: this.extractCounterAxisAlignItems(node) as any,
      primaryAxisAlignItems: this.extractPrimaryAxisAlignItems(node) as any,
      itemSpacing: this.extractItemSpacing(node),
      paddingLeft: this.extractPaddingLeft(node),
      paddingRight: this.extractPaddingRight(node),
      paddingTop: this.extractPaddingTop(node),
      paddingBottom: this.extractPaddingBottom(node),
      layoutSizingHorizontal: this.extractLayoutSizingHorizontal(node),
      layoutSizingVertical: this.extractLayoutSizingVertical(node),
      overflow: this.extractOverflow(node),
      characters: this.extractCharacters(node),
      fontName: this.extractFontName(node),
      fontFamily: this.extractFontFamily(node),
      fontSize: this.extractFontSize(node),
      fontWeight: this.extractFontWeight(node),
      textAlignHorizontal: this.extractTextAlignHorizontal(node),
      textAlignVertical: this.extractTextAlignVertical(node),
      letterSpacing: this.extractLetterSpacing(node),
      lineHeight: this.extractLineHeight(node),
      componentProperties: this.extractComponentProperties(node),
      mainComponentId: this.extractMainComponentId(node),
      variantProperties: this.extractVariantProperties(node),
      reactions: this.extractReactions(node),
      vectorPaths: this.extractVectorPaths(node),
      effects: this.extractEffects(node),
      children: [] as FigmaNode[]
    };

    // Extract children recursively
    if ('children' in node && node.children) {
      for (const child of node.children) {
        const extractedChild = await this.extractNode(child);
        baseNode.children!.push(extractedChild);
      }
    }

    return baseNode;
  }

  private extractFills(node: SceneNode): FigmaFill[] {
    if ('fills' in node && node.fills && Array.isArray(node.fills)) {
      return node.fills
        .filter(fill => fill.visible !== false)
        .map(fill => ({
          type: fill.type,
          opacity: fill.opacity,
          color: fill.type === 'SOLID' ? this.extractColor(fill.color) : undefined
        }));
    }
    return [];
  }

  private extractStrokes(node: SceneNode): any[] {
    if ('strokes' in node && node.strokes && Array.isArray(node.strokes)) {
      return node.strokes
        .filter(stroke => stroke.visible !== false)
        .map(stroke => ({
          type: stroke.type,
          opacity: stroke.opacity,
          color: stroke.type === 'SOLID' ? this.extractColor(stroke.color) : undefined
        }));
    }
    return [];
  }

  private extractStrokeWeight(node: SceneNode): number | undefined {
    if ('strokeWeight' in node && typeof node.strokeWeight === 'number') {
      return node.strokeWeight;
    }
    return undefined;
  }

  private extractCornerRadius(node: SceneNode): number | undefined {
    if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
      return node.cornerRadius;
    }
    return undefined;
  }

  private extractLayoutMode(node: SceneNode): string | undefined {
    if ('layoutMode' in node && node.layoutMode) {
      return node.layoutMode;
    }
    return undefined;
  }

  private extractCounterAxisAlignItems(node: SceneNode): string | undefined {
    if ('counterAxisAlignItems' in node && node.counterAxisAlignItems && node.counterAxisAlignItems !== figma.mixed) {
      return node.counterAxisAlignItems as string;
    }
    return undefined;
  }

  private extractPrimaryAxisAlignItems(node: SceneNode): string | undefined {
    if ('primaryAxisAlignItems' in node && node.primaryAxisAlignItems && node.primaryAxisAlignItems !== figma.mixed) {
      return node.primaryAxisAlignItems as string;
    }
    return undefined;
  }

  private extractItemSpacing(node: SceneNode): number | undefined {
    if ('itemSpacing' in node && typeof node.itemSpacing === 'number') {
      return node.itemSpacing;
    }
    return undefined;
  }

  private extractPaddingLeft(node: SceneNode): number | undefined {
    if ('paddingLeft' in node && typeof node.paddingLeft === 'number') {
      return node.paddingLeft;
    }
    return undefined;
  }

  private extractPaddingRight(node: SceneNode): number | undefined {
    if ('paddingRight' in node && typeof node.paddingRight === 'number') {
      return node.paddingRight;
    }
    return undefined;
  }

  private extractPaddingTop(node: SceneNode): number | undefined {
    if ('paddingTop' in node && typeof node.paddingTop === 'number') {
      return node.paddingTop;
    }
    return undefined;
  }

  private extractPaddingBottom(node: SceneNode): number | undefined {
    if ('paddingBottom' in node && typeof node.paddingBottom === 'number') {
      return node.paddingBottom;
    }
    return undefined;
  }

  private extractLayoutSizingHorizontal(node: SceneNode): 'FIXED' | 'FILL' | 'HUG' | undefined {
    if ('layoutSizingHorizontal' in node && node.layoutSizingHorizontal && (node.layoutSizingHorizontal as any) !== figma.mixed) {
      return node.layoutSizingHorizontal as 'FIXED' | 'FILL' | 'HUG';
    }
    return undefined;
  }

  private extractLayoutSizingVertical(node: SceneNode): 'FIXED' | 'FILL' | 'HUG' | undefined {
    if ('layoutSizingVertical' in node && node.layoutSizingVertical && (node.layoutSizingVertical as any) !== figma.mixed) {
      return node.layoutSizingVertical as 'FIXED' | 'FILL' | 'HUG';
    }
    return undefined;
  }

  private extractOverflow(node: SceneNode): 'VISIBLE' | 'HIDDEN' | 'SCROLL' | undefined {
    if ('clipsContent' in node && typeof node.clipsContent === 'boolean') {
      return node.clipsContent ? 'HIDDEN' : 'VISIBLE';
    }
    return undefined;
  }

  private extractCharacters(node: SceneNode): string | undefined {
    if ('characters' in node && node.characters) {
      return node.characters;
    }
    // Only log when we expect characters but don't find them
    if (node.type === 'TEXT') {
      console.log('⚠️ TEXT node missing characters:', node.name);
    }
    return undefined;
  }

  private extractFontName(node: SceneNode): any | undefined {
    if ('fontName' in node && node.fontName && node.fontName !== figma.mixed) {
      return node.fontName;
    }
    return undefined;
  }

  private extractFontFamily(node: SceneNode): string | undefined {
    if ('fontName' in node && node.fontName && node.fontName !== figma.mixed && 'family' in node.fontName) {
      return node.fontName.family;
    }
    return undefined;
  }

  private extractFontSize(node: SceneNode): number | undefined {
    if ('fontSize' in node && typeof node.fontSize === 'number') {
      return node.fontSize;
    }
    return undefined;
  }

  private extractFontWeight(node: SceneNode): number | undefined {
    if ('fontWeight' in node && typeof node.fontWeight === 'number') {
      return node.fontWeight;
    }
    return undefined;
  }

  private extractTextAlignHorizontal(node: SceneNode): string | undefined {
    if ('textAlignHorizontal' in node && node.textAlignHorizontal && (node.textAlignHorizontal as any) !== figma.mixed) {
      return node.textAlignHorizontal as string;
    }
    return undefined;
  }

  private extractTextAlignVertical(node: SceneNode): string | undefined {
    if ('textAlignVertical' in node && node.textAlignVertical && (node.textAlignVertical as any) !== figma.mixed) {
      return node.textAlignVertical as string;
    }
    return undefined;
  }

  private extractLetterSpacing(node: SceneNode): any | undefined {
    if ('letterSpacing' in node && node.letterSpacing) {
      return node.letterSpacing;
    }
    return undefined;
  }

  private extractLineHeight(node: SceneNode): any | undefined {
    if ('lineHeight' in node && node.lineHeight) {
      return node.lineHeight;
    }
    return undefined;
  }

  private extractComponentProperties(node: SceneNode): any | undefined {
    if ('componentProperties' in node && node.componentProperties && node.componentProperties !== figma.mixed) {
      return node.componentProperties;
    }
    return undefined;
  }

  private extractMainComponentId(node: SceneNode): string | undefined {
    if ('mainComponentId' in node && node.mainComponentId && node.mainComponentId !== figma.mixed) {
      return node.mainComponentId as string;
    }
    return undefined;
  }

  private extractVariantProperties(node: SceneNode): any | undefined {
    if ('variantProperties' in node && node.variantProperties) {
      return node.variantProperties;
    }
    return undefined;
  }

  private extractReactions(node: SceneNode): FigmaReaction[] {
    if ('reactions' in node && node.reactions && Array.isArray(node.reactions)) {
      return node.reactions.map(reaction => ({
        trigger: {
          type: reaction.trigger.type,
          timeout: reaction.trigger.type === 'AFTER_TIMEOUT' ? reaction.trigger.timeout : undefined
        },
        action: {
          type: reaction.action.type,
          destinationId: reaction.action.type === 'NODE' ? reaction.action.destinationId : undefined,
          navigation: reaction.action.type === 'NODE' ? reaction.action.navigation : undefined,
          transition: reaction.action.type === 'NODE' ? {
            type: reaction.action.transition.type,
            duration: reaction.action.transition.duration,
            easing: reaction.action.transition.easing
          } : {
            type: 'SMART_ANIMATE' as const,
            duration: 0.3,
            easing: { type: 'GENTLE' as const }
          }
        }
      }));
    }
    return [];
  }

  private extractVectorPaths(node: SceneNode): any[] {
    if ('vectorPaths' in node && node.vectorPaths && Array.isArray(node.vectorPaths)) {
      return node.vectorPaths.map(path => ({
        data: path.data,
        windingRule: path.windingRule
      }));
    }
    return [];
  }

  private extractEffects(node: SceneNode): any[] {
    if ('effects' in node && node.effects && Array.isArray(node.effects)) {
      return node.effects
        .filter(effect => effect.visible !== false)
        .map(effect => ({
          type: effect.type,
          radius: effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR' ? effect.radius : undefined,
          color: effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW' ? this.extractColor(effect.color) : undefined,
          offset: effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW' ? effect.offset : undefined,
          spread: effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW' ? effect.spread : undefined
        }));
    }
    return [];
  }

  private extractColor(color: RGB): { r: number; g: number; b: number } {
    return {
      r: color.r,
      g: color.g,
      b: color.b
    };
  }

  // Enhanced method to resolve instances and find their component sets
  async resolveInstancesAndComponentSets(nodes: FigmaNode[]): Promise<{
    instance: FigmaNode;
    mainComponent: FigmaNode;
    componentSet: FigmaNode;
    variants: FigmaNode[];
    activeVariant: FigmaNode;
  }[]> {
    const resolvedInstances: {
      instance: FigmaNode;
      mainComponent: FigmaNode;
      componentSet: FigmaNode;
      variants: FigmaNode[];
      activeVariant: FigmaNode;
    }[] = [];

    console.log('Starting instance resolution for', nodes.length, 'nodes');
    
    for (const node of nodes) {
      console.log('Checking node:', node.id, node.type, node.mainComponentId);
      
      if (node.type === 'INSTANCE' && node.mainComponentId) {
        console.log('Found INSTANCE node:', node.id, 'with mainComponentId:', node.mainComponentId);
        try {
          const resolved = await this.resolveInstance(node);
          if (resolved) {
            console.log('Successfully resolved instance:', node.id, 'with', resolved.variants.length, 'variants');
            resolvedInstances.push(resolved);
          } else {
            console.warn('Instance resolution returned null for:', node.id);
          }
        } catch (error) {
          console.warn('Failed to resolve instance:', node.id, error);
        }
      }
    }

    console.log('Instance resolution complete. Found', resolvedInstances.length, 'resolved instances');

    return resolvedInstances;
  }

  // Alternative method that works with the original selection
  async resolveInstancesFromSelection(selection: readonly SceneNode[]): Promise<{
    instance: FigmaNode;
    mainComponent: FigmaNode;
    componentSet: FigmaNode;
    variants: FigmaNode[];
    activeVariant: FigmaNode;
  }[]> {
    const resolvedInstances: {
      instance: FigmaNode;
      mainComponent: FigmaNode;
      componentSet: FigmaNode;
      variants: FigmaNode[];
      activeVariant: FigmaNode;
    }[] = [];

    console.log('Starting instance resolution from selection for', selection.length, 'nodes');
    
    for (const node of selection) {
      console.log('Checking selection node:', node.id, node.type);
      
      if (node.type === 'INSTANCE') {
        const instanceNode = node as InstanceNode;
        console.log('Found INSTANCE node:', instanceNode.id);
        
        try {
          const mainComponent = await (instanceNode as any).getMainComponentAsync();
          if (mainComponent) {
            const resolved = await this.resolveInstanceFromSelection(instanceNode, mainComponent);
            if (resolved) {
              console.log('Successfully resolved instance:', instanceNode.id, 'with', resolved.variants.length, 'variants');
              resolvedInstances.push(resolved);
            } else {
              console.warn('Instance resolution returned null for:', instanceNode.id);
            }
          } else {
            console.warn('Instance has no mainComponent:', instanceNode.id);
          }
        } catch (error) {
          console.warn('Failed to get mainComponent for instance:', instanceNode.id, error);
        }
      }
    }

    console.log('Instance resolution from selection complete. Found', resolvedInstances.length, 'resolved instances');

    return resolvedInstances;
  }

  // Resolve a single instance to its component set and variants
  private async resolveInstance(instance: FigmaNode): Promise<{
    instance: FigmaNode;
    mainComponent: FigmaNode;
    componentSet: FigmaNode;
    variants: FigmaNode[];
    activeVariant: FigmaNode;
  } | null> {
    if (!instance.mainComponentId) {
      return null;
    }

    try {
      // Get the main component from Figma
      const mainComponent = figma.getNodeById(instance.mainComponentId) as ComponentNode;
      if (!mainComponent) {
        console.warn('Main component not found:', instance.mainComponentId);
        return null;
      }

      // Find the parent component set
      const componentSet = mainComponent.parent;
      if (!componentSet || (componentSet as any).type !== 'COMPONENT_SET') {
        console.warn('Component set not found for main component:', instance.mainComponentId);
        return null;
      }

      // Extract all variants from the component set
      const variants: FigmaNode[] = [];
      for (const variant of (componentSet as any).children) {
        if (variant.type === 'COMPONENT') {
          const variantNode = await this.extractNode(variant);
          variants.push(variantNode);
        }
      }

      // Find the active variant based on instance properties
      const activeVariant = this.findActiveVariant(instance, variants);
      if (!activeVariant) {
        console.warn('Active variant not found for instance:', instance.id);
        return null;
      }

      // Extract the component set and main component
      const componentSetNode = await this.extractNode(componentSet as any);
      const mainComponentNode = await this.extractNode(mainComponent);

      // Propagate sizing properties from instance to component set and variants
      const propagatedData = this.propagateSizingProperties(instance, componentSetNode, variants);

      return {
        instance,
        mainComponent: mainComponentNode,
        componentSet: propagatedData.componentSet,
        variants: propagatedData.variants,
        activeVariant: propagatedData.activeVariant
      };

    } catch (error) {
      console.error('Error resolving instance:', instance.id, error);
      return null;
    }
  }

  // Resolve a single instance from the original selection
  private async resolveInstanceFromSelection(instanceNode: InstanceNode, mainComponent: ComponentNode): Promise<{
    instance: FigmaNode;
    mainComponent: FigmaNode;
    componentSet: FigmaNode;
    variants: FigmaNode[];
    activeVariant: FigmaNode;
  } | null> {
    try {
      // Use the provided main component
      console.log('Main component found:', mainComponent.id, mainComponent.name);

      // Find the parent component set
      const componentSet = mainComponent.parent;
      if (!componentSet || (componentSet as any).type !== 'COMPONENT_SET') {
        console.warn('Component set not found for main component:', mainComponent.id);
        return null;
      }

      console.log('Component set found:', (componentSet as any).id, (componentSet as any).name);

      // Extract all variants from the component set
      const variants: FigmaNode[] = [];
      for (const variant of (componentSet as any).children) {
        if (variant.type === 'COMPONENT') {
          console.log('Found variant:', variant.id, variant.name);
          const variantNode = await this.extractNode(variant);
          variants.push(variantNode);
        }
      }

      console.log('Extracted', variants.length, 'variants');

      // Find the active variant based on instance properties
      const activeVariant = this.findActiveVariantFromInstance(instanceNode, variants);
      if (!activeVariant) {
        console.warn('Active variant not found for instance:', instanceNode.id);
        return null;
      }

      console.log('Active variant found:', activeVariant.id);

      // Extract the component set and main component
      const componentSetNode = await this.extractNode(componentSet as any);
      const mainComponentNode = await this.extractNode(mainComponent);
      const instanceNodeData = await this.extractNode(instanceNode);

      // Propagate sizing properties from instance to component set and variants
      const propagatedData = this.propagateSizingProperties(instanceNodeData, componentSetNode, variants);

      return {
        instance: instanceNodeData,
        mainComponent: mainComponentNode,
        componentSet: propagatedData.componentSet,
        variants: propagatedData.variants,
        activeVariant: propagatedData.activeVariant
      };

    } catch (error) {
      console.error('Error resolving instance from selection:', instanceNode.id, error);
      return null;
    }
  }

  // Find the active variant based on instance variant properties
  private findActiveVariantFromInstance(instanceNode: InstanceNode, variants: FigmaNode[]): FigmaNode | null {
    if (!(instanceNode as any).variantProperties || Object.keys((instanceNode as any).variantProperties).length === 0) {
      // If no variant properties, return the first variant
      return variants[0] || null;
    }

    console.log('Instance variant properties:', (instanceNode as any).variantProperties);

    // Find variant that matches the instance's variant properties
    for (const variant of variants) {
      if (this.variantPropertiesMatch((instanceNode as any).variantProperties, (variant as any).variantProperties)) {
        return variant;
      }
    }

    // If no exact match, return the first variant
    return variants[0] || null;
  }

  // Find the active variant based on instance variant properties
  private findActiveVariant(instance: FigmaNode, variants: FigmaNode[]): FigmaNode | null {
    if (!instance.variantProperties) {
      // If no variant properties, return the first variant
      return variants[0] || null;
    }

    // Find variant that matches the instance's variant properties
    for (const variant of variants) {
      if (this.variantPropertiesMatch(instance.variantProperties, variant.variantProperties)) {
        return variant;
      }
    }

    // If no exact match, return the first variant
    return variants[0] || null;
  }

  // Check if variant properties match
  private variantPropertiesMatch(instanceProps: any, variantProps: any): boolean {
    if (!instanceProps || !variantProps) {
      return false;
    }

    for (const [key, value] of Object.entries(instanceProps)) {
      if (variantProps[key] !== value) {
        return false;
      }
    }

    return true;
  }

  // Helper method to find component sets
  findComponentSets(nodes: FigmaNode[]): FigmaNode[] {
    return nodes.filter(node => node.type === 'COMPONENT_SET');
  }

  // Helper method to trace animation chains
  traceAnimationChain(startNodeId: string, nodes: FigmaNode[]): string[] {
    const chain: string[] = [startNodeId];
    const visited = new Set<string>();
    let currentId = startNodeId;
    
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      
      const currentNode = nodes.find(n => n.id === currentId);
      if (!currentNode?.reactions) break;
      
      const timeoutReaction = currentNode.reactions.find(r => r.trigger.type === 'AFTER_TIMEOUT');
      if (!timeoutReaction) break;
      
      currentId = timeoutReaction.action.destinationId || '';
      if (currentId && !chain.includes(currentId)) {
        chain.push(currentId);
      } else {
        break; // Avoid infinite loops
      }
    }
    
    return chain;
  }

  // Propagate sizing properties from instance to component set and variants
  private propagateSizingProperties(
    instance: FigmaNode, 
    componentSet: FigmaNode, 
    variants: FigmaNode[]
  ): {
    componentSet: FigmaNode;
    variants: FigmaNode[];
    activeVariant: FigmaNode;
  } {
    console.log('Propagating sizing properties from instance:', instance.id);
    console.log('Instance sizing - Horizontal:', instance.layoutSizingHorizontal, 'Vertical:', instance.layoutSizingVertical);
    console.log('Instance dimensions - Width:', instance.width, 'Height:', instance.height);

    // Create a copy of the component set with propagated sizing properties and dimensions
    const propagatedComponentSet: FigmaNode = {
      ...componentSet,
      layoutSizingHorizontal: instance.layoutSizingHorizontal || componentSet.layoutSizingHorizontal,
      layoutSizingVertical: instance.layoutSizingVertical || componentSet.layoutSizingVertical,
      // Propagate actual dimensions from instance
      width: instance.width,
      height: instance.height
    };

    // Create copies of variants with propagated sizing properties and dimensions
    const propagatedVariants: FigmaNode[] = variants.map(variant => {
      const propagatedVariant = {
        ...variant,
        layoutSizingHorizontal: instance.layoutSizingHorizontal || variant.layoutSizingHorizontal,
        layoutSizingVertical: instance.layoutSizingVertical || variant.layoutSizingVertical,
        // Propagate actual dimensions from instance
        width: instance.width,
        height: instance.height
      };

      // Also propagate dimensions to children if they have FILL sizing
      if (propagatedVariant.children) {
        propagatedVariant.children = this.propagateChildDimensions(propagatedVariant.children, instance);
      }

      return propagatedVariant;
    });

    // Find the active variant based on instance variant properties
    const activeVariant = this.findActiveVariant(instance, propagatedVariants) || propagatedVariants[0] || variants[0];

    console.log('Propagated sizing and dimensions to component set and', propagatedVariants.length, 'variants');

    return {
      componentSet: propagatedComponentSet,
      variants: propagatedVariants,
      activeVariant
    };
  }

  // Helper method to propagate dimensions to children with FILL sizing
  private propagateChildDimensions(children: FigmaNode[], instance: FigmaNode): FigmaNode[] {
    return children.map(child => {
      const propagatedChild = { ...child };

      // If child has FILL horizontal sizing, use instance width
      if (child.layoutSizingHorizontal === 'FILL') {
        propagatedChild.width = instance.width;
      }

      // If child has FILL vertical sizing, use instance height
      if (child.layoutSizingVertical === 'FILL') {
        propagatedChild.height = instance.height;
      }

      // Recursively propagate to nested children
      if (propagatedChild.children) {
        propagatedChild.children = this.propagateChildDimensions(propagatedChild.children, instance);
      }

      return propagatedChild;
    });
  }
}
