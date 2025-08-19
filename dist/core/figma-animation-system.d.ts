import { FigmaNode } from './types';
export declare class FigmaAnimationSystem {
    private elementRegistry;
    private nodeRegistry;
    private timeouts;
    constructor();
    registerElement(figmaId: string, element: HTMLElement, node: FigmaNode): void;
    executeAnimation(sourceId: string, targetId: string): Promise<void>;
    private detectChanges;
    private executeSmartAnimate;
    private executeDissolve;
    private getTransitionProperties;
    private applyChange;
    private performInstantSwitch;
    setupTimeoutReactions(nodeId: string): void;
    clearAllTimeouts(): void;
    destroy(): void;
}
//# sourceMappingURL=figma-animation-system.d.ts.map