import { AnimationChange, AnimationOptions } from './types';
export declare class DOMManipulator {
    /**
     * Apply a change to an element
     */
    static applyChange(element: HTMLElement, change: AnimationChange): void;
    /**
     * Setup CSS transitions for an element
     */
    static setupTransitions(element: HTMLElement, changes: AnimationChange[], options: AnimationOptions): void;
    /**
     * Setup transitions for child elements
     */
    static setupChildTransitions(element: HTMLElement, changes: AnimationChange[], options: AnimationOptions): void;
    /**
     * Apply layout flattening for animation
     */
    static applyLayoutFlattening(element: HTMLElement, _layoutChange: AnimationChange): void;
    /**
     * Perform instant variant switch
     */
    static performVariantSwitch(sourceElement: HTMLElement, targetElement: HTMLElement): void;
    /**
     * Get transition properties for changes
     */
    private static getTransitionProperties;
}
//# sourceMappingURL=dom-manipulator.d.ts.map