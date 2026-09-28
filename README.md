# Pixel Sandbox - Infinite World Builder

A Minecraft-inspired infinite sandbox game built with React, TypeScript, and HTML5 Canvas.

## 🎮 Features

### Infinite Procedural World
- **Endless exploration**: The world generates infinitely as you move
- **Procedural terrain**: Uses Perlin-like noise for natural-looking landscapes
- **Multiple biomes**: Grass, forests, stone areas, and water bodies
- **Chunk-based loading**: Only renders visible chunks for optimal performance

### Block Building & Breaking
- **Break blocks**: Attack trees, bushes, walls, and pillars to collect resources
- **Place blocks**: Build structures with wood, stone, and leaves
- **Resource collection**: Broken blocks go into your inventory
- **Creative freedom**: Build anything you can imagine

### Inventory System
- **9-slot hotbar**: Quick access to your most-used items
- **Full inventory**: Press `I` to see all collected items
- **Stackable items**: Collect up to 99 of each resource
- **Visual feedback**: See item counts and icons in the hotbar

### Modern Pixel Art
- **Minecraft-style aesthetics**: Clean, blocky pixel art
- **Smooth animations**: Player movement, jumping, and attacking
- **Dynamic lighting**: Tree canopies cast shadows
- **Particle effects**: Breaking blocks creates debris

## 🎯 Controls

### Movement
- **WASD** or **Arrow Keys**: Move in 4 directions
- **K** or **Shift**: Jump

### Building & Breaking
- **Space** or **J**: Attack/Break block in facing direction
- **Q**: Toggle between Break mode and Place mode
- **Mouse Click**: Also attacks/breaks blocks

### Hotbar & Inventory
- **1-9**: Select hotbar slot
- **Z**: Previous hotbar slot
- **X**: Next hotbar slot
- **I**: Open full inventory
- **E**: Interact (for future use)

### Menus
- **ESC**: Pause game / Close menu
- **Mouse**: Click menu buttons (gear icon for settings)

### Settings
- Navigate with **Arrow Keys**
- Adjust volume with **Left/Right**
- Rebind keys by selecting and pressing **Enter**

## 🌍 World Generation

The world uses a sophisticated noise-based generation system:

- **Elevation noise**: Determines terrain height (water, grass, stone)
- **Moisture noise**: Controls vegetation density (forests vs plains)
- **Detail noise**: Adds variation and features (bushes, paths)
- **Chunk system**: 16x16 tile chunks generated on-demand
- **Infinite bounds**: No world edges - explore forever!

## 🎨 Block Types

### Breakable Blocks
- **Trees** → Wood (brown blocks)
- **Bushes** → Leaves (green blocks)
- **Stone Walls** → Stone (gray blocks)
- **Fences** → Wood
- **Pillars** → Stone

### Placeable Blocks
- **Wood**: Creates fence-like structures
- **Stone**: Creates solid walls
- **Leaves**: Creates decorative bush blocks

## 🎯 Gameplay Tips

1. **Start by breaking trees** to collect wood for building
2. **Use Q to toggle** between breaking and placing modes
3. **Face the direction** you want to break/place (WASD to face that way)
4. **Build shelters** before exploring far from spawn
5. **Use the hotbar** (1-9) for quick block switching
6. **Jump with K/Shift** to navigate terrain

## 🛠️ Technical Details

- **Resolution**: 384x216 internal, scaled up with pixel-perfect rendering
- **Frame rate**: 60 FPS fixed timestep
- **Rendering**: HTML5 Canvas with double buffering
- **Audio**: Web Audio API with synthesized sounds
- **Storage**: LocalStorage for settings and keybindings
- **Performance**: Chunk culling, sprite caching, object pooling

## 🎵 Audio

All sounds are procedurally generated:
- Block breaking sounds
- Footstep particles
- UI interaction sounds
- Ambient background music

## 🚀 Future Enhancements

Potential features for expansion:
- Enemy mobs and combat
- Crafting system
- More block types
- Day/night cycle
- Weather effects
- Multiplayer support
- Save/load worlds

---

**Enjoy building your infinite pixel world!** 🏗️✨
