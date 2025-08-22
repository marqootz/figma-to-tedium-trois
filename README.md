# Figma Animation Export Plugin

A comprehensive Figma plugin that exports Figma animations (especially countdown sequences) to working HTML with CSS transitions and JavaScript.

## 🆕 Recent Updates

### Hardcoded References Fix (Latest)
The codebase has been refactored to remove all hardcoded element references and replace them with a generic, reusable layout detection system. See [HARDCODED_REFERENCES_FIX.md](./HARDCODED_REFERENCES_FIX.md) for detailed documentation.

**Key Improvements:**
- ✅ Removed hardcoded Frame 1307/1308 logic
- ✅ Implemented generic LayoutDetector system
- ✅ Added PositionCalculator utility
- ✅ Improved logging with configurable levels
- ✅ Added centralized configuration management
- ✅ Works with any Figma design, not just specific hardcoded elements

## 🎯 Key Features

- **Direct JSON Processing**: Reads Figma animation data directly from the API
- **Countdown Animation Support**: Handles 3→2→1 countdown sequences with precise timing
- **Smart Animation Detection**: Automatically detects position changes, alignment changes, and opacity transitions
- **CSS Hardware Acceleration**: Uses CSS transforms for smooth animations
- **Element Registration System**: Maps Figma node IDs to HTML elements for precise targeting
- **Timeout Reaction Handling**: Supports automatic animation chains with configurable delays

## 🏗️ Architecture

### Core Components

- **`src/core/types.ts`** - TypeScript interfaces for Figma data structures
- **`src/core/figma-animation-system.ts`** - Main animation engine that interprets Figma reactions
- **`src/core/easing-functions.ts`** - CSS easing curve mappings for Figma transitions

### HTML Generation

- **`src/html/generator.ts`** - Orchestrates complete HTML output
- **`src/html/element-builder.ts`** - Creates HTML elements with proper data attributes
- **`src/html/style-generator.ts`** - Generates CSS styles from Figma properties
- **`src/html/animation-handler.ts`** - Creates browser-compatible JavaScript

### Figma Integration

- **`src/plugin/main.ts`** - Figma plugin entry point
- **`src/plugin/figma-data-extractor.ts`** - Extracts data from Figma's API
- **`src/plugin/ui.html`** - Plugin user interface

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Plugin

```bash
npm run build
```

### 3. Load in Figma

1. Open Figma
2. Go to Plugins → Development → Import plugin from manifest
3. Select the `manifest.json` file from this project
4. The plugin will appear in your plugins list

### 4. Test the Countdown Animation

Open `examples/countdown-test.html` in your browser to see a working countdown animation that demonstrates the system's capabilities.

## 💡 How It Works

### Animation System Architecture

The system uses a **direct interpretation approach** rather than DOM diffing:

1. **Extract Figma Data**: Plugin reads component variants and their reactions
2. **Register Elements**: Each HTML element gets mapped to its Figma node ID
3. **Execute Animations**: When triggered, the system applies CSS transitions based on detected changes
4. **Chain Reactions**: Timeout reactions automatically trigger the next animation in sequence

### Countdown Animation Workflow

For a 3→2→1 countdown:

```
Variant "3" (visible)
    ↓ (AFTER_TIMEOUT: 0.8s)
Variant "2" (SMART_ANIMATE: 1.02s)
    ↓ (AFTER_TIMEOUT: 0.8s) 
Variant "1" (SMART_ANIMATE: 1.02s)
    ↓ (end)
```

### Key Advantages

1. **No DOM Comparison**: Directly uses Figma's animation data
2. **Predictable Timing**: Exact delays and durations from Figma
3. **Hardware Accelerated**: Uses CSS transforms for smooth performance
4. **Maintainable**: Clear separation between data extraction and animation execution

## 🎨 Supported Animation Types

- **SMART_ANIMATE**: Smooth transitions between variants
- **DISSOLVE**: Fade in/out transitions
- **Position Changes**: translateX/translateY animations
- **Alignment Changes**: Flexbox alignment transitions
- **Opacity Changes**: Fade effects
- **Timeout Reactions**: Automatic animation chaining

## 🔧 Configuration

### Easing Functions

The system maps Figma's easing types to CSS cubic-bezier curves:

- `GENTLE`: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- `QUICK`: `cubic-bezier(0.55, 0.06, 0.68, 0.19)`
- `BOUNCY`: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`
- `SLOW`: `cubic-bezier(0.23, 1, 0.32, 1)`
- `LINEAR`: `linear`

### Animation Properties

The system detects and animates these properties:

- Position (x, y coordinates)
- Alignment (counterAxisAlignItems, primaryAxisAlignItems)
- Opacity
- Color (future support)

## 🧪 Testing

### Run the Example

```bash
# Open the test file in your browser
open examples/countdown-test.html
```

The test demonstrates:
- 3→2→1 countdown sequence
- 0.8s delays between transitions
- 1.02s duration for each animation
- Manual controls for testing

### Development Mode

```bash
npm run dev
```

This starts webpack in watch mode for continuous development.

## 📁 Project Structure

```
figma-animation-plugin/
├── src/
│   ├── core/                    # Core animation system
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── figma-animation-system.ts # Main engine
│   │   └── easing-functions.ts  # CSS easing mappings
│   ├── html/                    # HTML generation
│   │   ├── generator.ts        # Main HTML orchestrator
│   │   ├── element-builder.ts  # Element creation
│   │   ├── style-generator.ts  # CSS generation
│   │   └── animation-handler.ts # Browser JS generation
│   ├── plugin/                  # Figma plugin integration
│   │   ├── main.ts             # Plugin entry point
│   │   ├── figma-data-extractor.ts # Data extraction
│   │   └── ui.html             # Plugin UI
│   └── utils/                   # Utilities
│       ├── logger.ts           # Debugging utilities
│       └── validation.ts       # Data validation
├── examples/                    # Test examples
│   └── countdown-test.html     # Working countdown demo
├── dist/                       # Build output
├── manifest.json               # Figma plugin manifest
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
└── webpack.config.js          # Build configuration
```

## 🐛 Debugging

The system includes comprehensive logging:

```javascript
// Enable debug logging
window.figmaAnimationSystem.setLogLevel(0);

// View registered elements
console.log(window.figmaAnimationSystem.elementRegistry);

// Trace animation execution
window.figmaAnimationSystem.executeAnimation('source-id', 'target-id');
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Built for reliable countdown animations and Figma workflow integration.**


