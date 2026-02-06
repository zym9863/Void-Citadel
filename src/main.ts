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
  private crosshairEl: HTMLElement | null = null;
  private cornerGlyphs: HTMLElement[] = [];

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
    // ── 入口覆盖层 ──
    this.instructionEl = document.createElement('div');
    this.instructionEl.id = 'instructions';
    this.instructionEl.innerHTML = `
      <!-- 装饰竖线 -->
      <div class="ink-line-left"></div>
      <div class="ink-line-right"></div>

      <!-- 水墨粒子 -->
      <div class="ink-particle"></div>
      <div class="ink-particle"></div>
      <div class="ink-particle"></div>
      <div class="ink-particle"></div>
      <div class="ink-particle"></div>
      <div class="ink-particle"></div>
      <div class="ink-particle"></div>
      <div class="ink-particle"></div>

      <!-- 标题组 -->
      <div class="title-group">
        <h1 class="title-main">墟 境</h1>
        <p class="title-sub">VOID CITADEL</p>
      </div>

      <!-- 分隔线 -->
      <div class="divider-ink"></div>

      <!-- 入口提示 -->
      <p class="enter-prompt">点击进入虚空世界</p>

      <!-- 操控提示 -->
      <div class="controls-hint">
        <div class="control-item">
          <span class="control-key">W A S D</span>
          <span class="control-label">移动</span>
        </div>
        <div class="control-item">
          <span class="control-key">鼠标</span>
          <span class="control-label">环顾</span>
        </div>
      </div>

      <!-- 移动端提示 -->
      <p class="mobile-notice">建议在桌面端体验完整效果</p>

      <!-- 底部诗句 -->
      <p class="verse-line">空城不见人，但闻人语响</p>
    `;
    document.body.appendChild(this.instructionEl);

    // 覆盖层点击触发指针锁定
    this.instructionEl.addEventListener('click', () => {
      this.controls.controls.lock();
    });
    this.instructionEl.addEventListener('touchstart', (event) => {
      event.preventDefault();
      this.controls.controls.lock();
    }, { passive: false });

    // ── 自定义准心 ──
    this.crosshairEl = document.createElement('div');
    this.crosshairEl.id = 'crosshair';
    document.body.appendChild(this.crosshairEl);

    // ── 状态 HUD ──
    this.statsEl = document.createElement('div');
    this.statsEl.id = 'stats';
    this.statsEl.innerHTML = '<div class="stat-container"></div>';
    document.body.appendChild(this.statsEl);

    // ── 四角装饰 ──
    const glyphData = [
      { cls: 'top-right', text: '虚' },
      { cls: 'bottom-left', text: '境' },
      { cls: 'bottom-right', text: '幽' },
    ];
    glyphData.forEach(({ cls, text }) => {
      const el = document.createElement('div');
      el.className = `corner-glyph ${cls}`;
      el.textContent = text;
      document.body.appendChild(el);
      this.cornerGlyphs.push(el);
    });

    // ── 锁定/解锁事件 ──
    this.controls.controls.addEventListener('lock', () => {
      if (this.instructionEl) this.instructionEl.classList.add('hidden');
      if (this.statsEl) this.statsEl.classList.add('visible');
      if (this.crosshairEl) this.crosshairEl.classList.add('visible');
      this.cornerGlyphs.forEach(el => el.classList.add('visible'));
    });

    this.controls.controls.addEventListener('unlock', () => {
      if (this.instructionEl) this.instructionEl.classList.remove('hidden');
      if (this.statsEl) this.statsEl.classList.remove('visible');
      if (this.crosshairEl) this.crosshairEl.classList.remove('visible');
      this.cornerGlyphs.forEach(el => el.classList.remove('visible'));
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
      const isStationary = this.temporalRipple.isPlayerStationary();
      const stateText = isStationary ? '静 · 细节浮现' : '动 · 虚空涟漪';
      const activeClass = isStationary ? '' : ' active';
      const container = this.statsEl.querySelector('.stat-container');
      if (container) {
        container.innerHTML = `
          <div class="stat-row">
            <span class="stat-icon${activeClass}"></span>
            <span class="stat-label">区块</span>
            <span class="stat-value">${this.chunkManager.getChunkCount()}</span>
          </div>
          <div class="stat-row">
            <span class="stat-icon${activeClass}"></span>
            <span class="stat-label">状态</span>
            <span class="stat-value">${stateText}</span>
          </div>
        `;
      }
    }

    // 渲染
    this.voidRenderer.render();
  }
}

// 启动应用
new VoidCitadel();
