import { AnimationChange, FigmaNodeData } from './types';
export declare class ChangeDetector {
    /**
     * Detect changes between two Figma nodes
     * @param source The source Figma node data (or current visual state)
     * @param target The target Figma node data
     */
    static detectChanges(source: FigmaNodeData, target: FigmaNodeData): AnimationChange[];
    /**
     * Detect changes in child elements between variants (recursively)
     */
    private static detectChildElementChanges;
    /**
     * Create a recursive map of all child elements with their full paths
     */
    private static createRecursiveChildMap;
    /**
     * Check if fill arrays are different
     */
    private static fillsAreDifferent;
    /**
     * Check if layout properties have changed
     */
    private static layoutHasChanged;
    /**
     * Get layout properties from a node
     */
    private static getLayoutProperties;
    /**
     * Detect vector path changes for SVG elements
     */
    private static detectVectorPathChanges;
}
//# sourceMappingURL=change-detector.d.ts.map