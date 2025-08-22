import { LogLevel } from '../utils/logger';

export interface PluginConfig {
  debug: {
    enabled: boolean;
    logLevel: LogLevel;
    enableLayoutLogging: boolean;
    enableAnimationLogging: boolean;
    enableVariantLogging: boolean;
  };
  animation: {
    defaultDuration: number;
    defaultEasing: string;
    enableSmartAnimate: boolean;
  };
  layout: {
    enablePositionAdjustment: boolean;
    enableLayoutDetection: boolean;
  };
}

export const defaultConfig: PluginConfig = {
  debug: {
    enabled: false,
    logLevel: LogLevel.INFO,
    enableLayoutLogging: false,
    enableAnimationLogging: false,
    enableVariantLogging: false,
  },
  animation: {
    defaultDuration: 0.3,
    defaultEasing: 'ease-out',
    enableSmartAnimate: true,
  },
  layout: {
    enablePositionAdjustment: true,
    enableLayoutDetection: true,
  },
};

export class ConfigManager {
  private static instance: ConfigManager;
  private config: PluginConfig = { ...defaultConfig };

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  getConfig(): PluginConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<PluginConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  isDebugEnabled(): boolean {
    return this.config.debug.enabled;
  }

  isLayoutLoggingEnabled(): boolean {
    return this.config.debug.enabled && this.config.debug.enableLayoutLogging;
  }

  isAnimationLoggingEnabled(): boolean {
    return this.config.debug.enabled && this.config.debug.enableAnimationLogging;
  }

  isVariantLoggingEnabled(): boolean {
    return this.config.debug.enabled && this.config.debug.enableVariantLogging;
  }

  getLogLevel(): LogLevel {
    return this.config.debug.logLevel;
  }

  getDefaultAnimationDuration(): number {
    return this.config.animation.defaultDuration;
  }

  getDefaultEasing(): string {
    return this.config.animation.defaultEasing;
  }

  isSmartAnimateEnabled(): boolean {
    return this.config.animation.enableSmartAnimate;
  }

  isPositionAdjustmentEnabled(): boolean {
    return this.config.layout.enablePositionAdjustment;
  }

  isLayoutDetectionEnabled(): boolean {
    return this.config.layout.enableLayoutDetection;
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();
