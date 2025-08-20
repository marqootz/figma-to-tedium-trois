export interface AnimationChange {
    property: string;
    sourceValue: any;
    targetValue: any;
    delta?: number;
    childName?: string;
    childId?: string;
}
export interface AnimationOptions {
    duration: number;
    easing: string;
    transitionType: 'SMART_ANIMATE' | 'DISSOLVE';
}
export interface VariantInstance {
    instanceId: string;
    variants: string[];
    activeVariant: string;
    currentIndex: number;
}
export interface FigmaNodeData {
    id: string;
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    opacity?: number;
    fills?: any[];
    cornerRadius?: number;
    layoutMode?: string;
    counterAxisAlignItems?: string;
    primaryAxisAlignItems?: string;
    itemSpacing?: number;
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
    children?: FigmaNodeData[];
    reactions?: any[];
}
export interface ElementRegistry {
    get(figmaId: string): HTMLElement | undefined;
    set(figmaId: string, element: HTMLElement): void;
    clear(): void;
}
export interface NodeRegistry {
    get(figmaId: string): FigmaNodeData | undefined;
    set(figmaId: string, node: FigmaNodeData): void;
    clear(): void;
}
//# sourceMappingURL=types.d.ts.map