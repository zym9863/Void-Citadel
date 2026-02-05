**English** | [中文](README.md)

# Void Citadel

Recursive void architecture & temporal ripple interactive experience - An immersive 3D exploration project built with Three.js.

> "An empty city with no one in sight, yet echoes of voices linger"

## Features

- **First-Person Exploration** - WASD movement, mouse look
- **Procedural Architecture** - Recursive void buildings powered by Perlin noise
- **Temporal Ripple Effect** - Dynamic ripples emerge while moving, details surface when still
- **Volumetric Fog** - Creates a deep void atmosphere
- **Infinite Chunk System** - Dynamic chunk loading/unloading for endless exploration

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Tech Stack

- [Three.js](https://threejs.org/) - 3D rendering engine
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool

## Project Structure

```
src/
├── main.ts                 # App entry
├── style.css               # Global styles
├── core/                   # Core modules
│   ├── Scene.ts            # Scene management
│   ├── Camera.ts           # Camera control
│   └── Renderer.ts         # Renderer configuration
├── controls/               # Control system
│   └── FirstPersonControls.ts  # First-person controller
├── buildings/              # Building generation
│   └── BuildingGenerator.ts    # Procedural building generator
├── effects/                # Visual effects
│   ├── TemporalRipple.ts   # Temporal ripple effect
│   └── VolumetricFog.ts    # Volumetric fog effect
└── utils/                  # Utilities
    ├── ChunkManager.ts     # Chunk management
    └── PerlinNoise.ts      # Perlin noise generation
```

## Controls

| Key | Action |
|-----|--------|
| W/S | Forward / Backward |
| A/D | Strafe Left / Right |
| Mouse | Look around |
| Click | Enter / Exit game mode |

## License

MIT
