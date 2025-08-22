# Hardcoded References Fix

## Overview

This document describes the refactoring that removed hardcoded element references from the codebase and replaced them with a generic, reusable layout detection system.

## Issues Fixed

### 1. Hardcoded Frame References
**Before:**
```typescript
// Hardcoded element names and positions
if (sourceChild.name === 'Frame 1307' && 
    sourceChild.x === 0 && targetChild.x === 2535.125) {
  // Hardcoded calculations
  const childWidth = targetChild.width || 84;
  const actualTargetX = targetParentWidth - childWidth; // 346 - 84 = 262
}
```

**After:**
```typescript
// Generic layout detection
const layoutChange = LayoutDetector.detectLayoutChanges(source, target, sourceChild, targetChild);
if (layoutChange) {
  // Use calculated position based on layout properties
  return layoutChange;
}
```

### 2. Hardcoded Position Calculations
**Before:**
```typescript
// Hardcoded position adjustments
if (node.name === 'Frame 1307' && node.x === 2535.125) {
  const parentWidth = 346;
  const childWidth = node.width || 84;
  const adjustedX = parentWidth - childWidth; // 346 - 84 = 262
}
```

**After:**
```typescript
// Generic position calculation
const adjustment = PositionCalculator.calculateAdjustedPosition(node, parent);
return { x: adjustment.x, y: adjustment.y };
```

## New Architecture

### 1. LayoutDetector (`src/core/layout-detector.ts`)
Generic layout change detection system that works with any Figma design:

```typescript
export class LayoutDetector {
  static detectLayoutChanges(
    source: FigmaNode, 
    target: FigmaNode, 
    sourceChild: FigmaNode, 
    targetChild: FigmaNode
  ): LayoutChange | null
}
```

**Features:**
- Detects alignment changes in parent containers
- Handles parent size changes affecting child positioning
- Uses configurable layout rules instead of hardcoded logic
- Works with any Figma design structure

### 2. PositionCalculator (`src/utils/position-calculator.ts`)
Generic position calculation utility:

```typescript
export class PositionCalculator {
  static calculateAdjustedPosition(
    node: FigmaNode, 
    parent?: FigmaNode
  ): PositionAdjustment
}
```

**Features:**
- Calculates layout-driven position adjustments
- Handles relative positioning cases
- Detects inconsistent positioning
- Provides reasoning for adjustments

### 3. Logger (`src/utils/logger.ts`)
Improved logging system with configurable levels:

```typescript
export class Logger {
  static configure(config: Partial<LogConfig>): void
  static enableDebugMode(enabled: boolean): void
  static layout(message: string, ...args: any[]): void
  static animation(message: string, ...args: any[]): void
  static variant(message: string, ...args: any[]): void
}
```

### 4. ConfigManager (`src/core/config.ts`)
Centralized configuration management:

```typescript
export class ConfigManager {
  isDebugEnabled(): boolean
  isLayoutLoggingEnabled(): boolean
  isAnimationLoggingEnabled(): boolean
  isPositionAdjustmentEnabled(): boolean
}
```

## Usage Examples

### Basic Layout Detection
```typescript
import { LayoutDetector } from '../core/layout-detector';

// Detect layout changes between two nodes
const layoutChange = LayoutDetector.detectLayoutChanges(
  sourceNode, 
  targetNode, 
  sourceChild, 
  targetChild
);

if (layoutChange) {
  console.log('Layout change detected:', layoutChange.type);
  // Handle the layout change
}
```

### Position Calculation
```typescript
import { PositionCalculator } from '../utils/position-calculator';

// Calculate adjusted position for a node
const adjustment = PositionCalculator.calculateAdjustedPosition(node, parent);
console.log('Position adjustment:', adjustment.reason);
// Use adjustment.x and adjustment.y
```

### Configuration
```typescript
import { configManager } from '../core/config';
import { Logger } from '../utils/logger';

// Enable debug mode
configManager.updateConfig({
  debug: {
    enabled: true,
    enableLayoutLogging: true,
    enableAnimationLogging: true
  }
});

// Configure logger
Logger.configure({
  level: LogLevel.DEBUG,
  enableDebugMode: true
});
```

## Benefits

### 1. **Reusability**
- Works with any Figma design, not just specific hardcoded elements
- Generic algorithms that adapt to different layout structures

### 2. **Maintainability**
- No more hardcoded element names or positions
- Centralized layout detection logic
- Easy to extend with new layout rules

### 3. **Debugging**
- Configurable logging levels
- Specialized logging for different components
- Performance monitoring capabilities

### 4. **Flexibility**
- Configurable behavior through ConfigManager
- Easy to enable/disable features
- Extensible rule-based system

## Migration Guide

### For Existing Code
1. Replace hardcoded element checks with `LayoutDetector.detectLayoutChanges()`
2. Replace hardcoded position calculations with `PositionCalculator.calculateAdjustedPosition()`
3. Replace `console.log` statements with appropriate Logger methods
4. Use ConfigManager for feature toggles

### For New Features
1. Add new layout rules to `LayoutDetector.layoutRules`
2. Use `PositionCalculator` for any position adjustments
3. Use `Logger` for all logging needs
4. Configure behavior through `ConfigManager`

## Testing

The new system should be tested with:
1. Different Figma designs (not just the original hardcoded case)
2. Various layout configurations (HORIZONTAL, VERTICAL, different alignments)
3. Different sizing strategies (FILL, HUG, FIXED)
4. Edge cases (empty containers, single children, etc.)

## Future Improvements

1. **More Layout Rules**: Add rules for SPACE_BETWEEN, SPACE_AROUND, etc.
2. **Performance Optimization**: Cache layout calculations for better performance
3. **Visual Debugging**: Add visual indicators for layout changes in development mode
4. **Unit Tests**: Comprehensive test suite for layout detection algorithms
