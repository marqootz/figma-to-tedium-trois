import { FigmaNodeData } from './types';
export declare class BundleGenerator {
    /**
     * Generate the complete browser bundle as a string
     */
    static generateBundle(): string;
    /**
     * Generate initialization code for the animation system
     */
    static generateInitializationCode(nodes: FigmaNodeData[], resolvedInstances?: any[]): string;
    private static getTypesCode;
    private static getChangeDetectorCode;
    private static getDOMManipulatorCode;
    private static getVariantHandlerCode;
    private static getAnimationSystemCode;
    private static generateNodeRegistrations;
    private static generateVariantRegistrations;
    private static generateInitialTimeouts;
    private static generateVariantAnimationSetup;
}
//# sourceMappingURL=bundle-generator.d.ts.map