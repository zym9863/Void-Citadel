import { VoidScene } from './core/Scene';
import { VoidCamera } from './core/Camera';
import { VoidRenderer } from './core/Renderer';
import { FirstPersonControls } from './controls/FirstPersonControls';
import { ChunkManager } from './utils/ChunkManager';
import { TemporalRipple } from './effects/TemporalRipple';
import { VolumetricFog } from './effects/VolumetricFog';
import './style.css';

/**
 * 墟境 - Void Citadel
 * 递归虚空建筑与时空涟漪交互体验
 */
class VoidCitadel {
  // 核心模块
  private voidScene: VoidScene;
  private voidCamera: VoidCamera;
  private voidRenderer: VoidRenderer;
  private controls: FirstPersonControls;

  // 效果系统
  private chunkManager: ChunkManager;
  private temporalRipple: TemporalRipple;
  private volumetricFog: VolumetricFog;

  // 时间
  private clock: { getDelta: () => number; getElapsedTime: () => number };
  private lastTime: number = 0;

  // UI元素
  private instructionEl: HTMLElement | null = null;
  private statsEl: HTMLElement | null = null;

  constructor() {
    // 创建画布
    const canvas = document.createElement('canvas');
    canvas.id = 'void-canvas';
    document.getElementById('app')!.appendChild(canvas);

    // 初始化核心模块
    this.voidScene = new VoidScene();
    this.voidCamera = new VoidCamera(window.innerWidth / window.innerHeight);
    this.voidRenderer = new VoidRenderer(canvas, this.voidScene.scene, this.voidCamera.camera);
    this.controls = new FirstPersonControls(this.voidCamera, canvas);

    // 初始化效果系统
    this.chunkManager = new ChunkManager(this.voidScene.scene);
    this.temporalRipple = new TemporalRipple(this.voidScene.scene);
    this.volumetricFog = new VolumetricFog(this.voidScene.scene);

    // 时间管理
    this.clock = {
      getDelta: () => {
        const now = performance.now() / 1000;
        const delta = now - this.lastTime;
        this.lastTime = now;
        return Math.min(delta, 0.1); // 限制最大帧时间
      },
      getElapsedTime: () => performance.now() / 1000
    };
    this.lastTime = performance.now() / 1000;

    // 创建UI
    this.createUI();

    // 事件监听
    this.setupEventListeners();

    // 开始渲染循环
    this.animate();
  }

  private createUI(): void {
    // 操作提示
    this.instructionEl = document.createElement('div');
    this.instructionEl.id = 'instructions';
    this.instructionEl.innerHTML = `
      <h1>墟 境</h1>
      <p>点击进入虚空世界</p>
      <p class="hint">WASD 移动 | 鼠标 环顾</p>
      <p class="quote">"空城不见人，但闻人语响"</p>
    `;
    document.body.appendChild(this.instructionEl);

    // 覆盖层点击时也触发指针锁定
    this.instructionEl.addEventListener('click', () => {
      this.controls.controls.lock();
    });
    this.instructionEl.addEventListener('touchstart', (event) => {
      event.preventDefault();
      this.controls.controls.lock();
    }, { passive: false });

    // 状态信息
    this.statsEl = document.createElement('div');
    this.statsEl.id = 'stats';
    this.statsEl.style.display = 'none';
    document.body.appendChild(this.statsEl);

    // 控制器锁定事件
    this.controls.controls.addEventListener('lock', () => {
      if (this.instructionEl) this.instructionEl.style.display = 'none';
      if (this.statsEl) this.statsEl.style.display = 'block';
    });

    this.controls.controls.addEventListener('unlock', () => {
      if (this.instructionEl) this.instructionEl.style.display = 'flex';
      if (this.statsEl) this.statsEl.style.display = 'none';
    });
  }

  private setupEventListeners(): void {
    // 窗口调整
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.voidCamera.updateAspect(width / height);
      this.voidRenderer.resize(width, height);
      this.temporalRipple.resize(width, height);
    });
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();
    const playerPosition = this.voidCamera.getPosition();
    const playerSpeed = this.voidCamera.speed;

    // 更新控制器
    this.controls.update(deltaTime);

    // 更新效果系统
    this.chunkManager.update(playerPosition, deltaTime);
    this.temporalRipple.update(deltaTime, playerSpeed);
    this.volumetricFog.update(deltaTime, playerPosition);

    // 更新场景
    this.voidScene.update(deltaTime);

    // 基于移动状态调整辉光
    const bloomIntensity = 0.3 + playerSpeed * 0.5;
    this.voidRenderer.updateBloom(Math.min(bloomIntensity, 1.0));

    // 更新状态显示
    if (this.statsEl && this.controls.isLocked()) {
      const state = this.temporalRipple.isPlayerStationary() ? '静止 - 细节浮现' : '移动 - 虚空涟漪';
      this.statsEl.innerHTML = `
        <div>区块: ${this.chunkManager.getChunkCount()}</div>
        <div>状态: ${state}</div>
      `;
    }

    // 渲染
    this.voidRenderer.render();
  }
}

// 启动应用
new VoidCitadel();
