**中文** | [English](README-EN.md)

# 墟境 / Void Citadel

递归虚空建筑与时空涟漪交互体验 - 一个基于 Three.js 的沉浸式 3D 探索项目。

> "空城不见人，但闻人语响"

## 特性

- **第一人称漫游** - WASD 移动，鼠标环顾四周
- **程序化建筑生成** - 基于 Perlin 噪声的递归虚空建筑
- **时空涟漪效果** - 移动时产生动态涟漪，静止时细节浮现
- **体积雾** - 营造深邃虚空氛围
- **无限区块系统** - 动态加载/卸载区块，持续探索

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview
```

## 技术栈

- [Three.js](https://threejs.org/) - 3D 渲染引擎
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [Vite](https://vitejs.dev/) - 构建工具

## 项目结构

```
src/
├── main.ts                 # 应用入口
├── style.css               # 全局样式
├── core/                   # 核心模块
│   ├── Scene.ts            # 场景管理
│   ├── Camera.ts           # 相机控制
│   └── Renderer.ts         # 渲染器配置
├── controls/               # 控制系统
│   └── FirstPersonControls.ts  # 第一人称控制器
├── buildings/              # 建筑生成
│   └── BuildingGenerator.ts    # 程序化建筑生成器
├── effects/                # 视觉效果
│   ├── TemporalRipple.ts   # 时空涟漪效果
│   └── VolumetricFog.ts    # 体积雾效果
└── utils/                  # 工具函数
    ├── ChunkManager.ts     # 区块管理
    └── PerlinNoise.ts      # Perlin 噪声生成
```

## 操作说明

| 按键 | 功能 |
|------|------|
| W/S | 前进/后退 |
| A/D | 左移/右移 |
| 鼠标移动 | 环顾四周 |
| 点击屏幕 | 进入/退出游戏模式 |

## License

MIT
