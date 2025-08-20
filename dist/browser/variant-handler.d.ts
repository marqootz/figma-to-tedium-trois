import { VariantInstance, FigmaNodeData, AnimationOptions } from './types';
export declare class VariantHandler {
    private variantInstances;
    /**
     * Register variant instances
     */
    registerVariantInstances(instances: VariantInstance[]): void;
    /**
     * Find variant instance by node ID
     */
    findVariantInstance(nodeId: string): VariantInstance | null;
    /**
     * Execute variant animation
     */
    executeVariantAnimation(variantInstance: VariantInstance, sourceId: string, targetId: string, sourceElement: HTMLElement, targetElement: HTMLElement, sourceNode: FigmaNodeData, targetNode: FigmaNodeData, options: AnimationOptions): Promise<void>;
    /**
     * Execute Smart Animate for variants
     */
    private executeVariantSmartAnimate;
    /**
     * Execute Dissolve animation for variants
     */
    private executeVariantDissolve;
    /**
     * Perform variant switch
     */
    private performVariantSwitch;
    /**
     * Log element visual state for debugging
     */
    private logElementState;
}
//# sourceMappingURL=variant-handler.d.ts.map