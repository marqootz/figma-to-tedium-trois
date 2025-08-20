import { FigmaNodeData, VariantInstance } from './types';
export declare class FigmaAnimationSystem {
    private elementRegistry;
    private nodeRegistry;
    private timeouts;
    private variantHandler;
    constructor();
    /**
     * Register an element with the animation system
     */
    registerElement(figmaId: string, element: HTMLElement, node: FigmaNodeData): void;
    /**
     * Register variant instances
     */
    registerVariantInstances(instances: VariantInstance[]): void;
    /**
     * Execute animation between two nodes
     */
    executeAnimation(sourceId: string, targetId: string): Promise<void>;
    /**
     * Execute variant animation
     */
    private executeVariantAnimation;
    /**
     * Execute regular element animation
     */
    private executeElementAnimation;
    /**
     * Execute Smart Animate
     */
    private executeSmartAnimate;
    /**
     * Execute Dissolve animation
     */
    private executeDissolve;
    /**
     * Get animation options from node reactions
     */
    private getAnimationOptions;
    /**
     * Map Figma easing to CSS easing
     */
    private mapFigmaEasing;
    /**
     * Setup timeout reactions for a node
     */
    setupTimeoutReactions(nodeId: string): void;
    /**
     * Clear all timeout reactions
     */
    clearAllTimeouts(): void;
    /**
     * Destroy the animation system
     */
    destroy(): void;
}
//# sourceMappingURL=animation-system.d.ts.map