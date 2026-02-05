import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/**
 * 渲染器配置
 * WebGL渲染器 + 后处理效果
 */
export class VoidRenderer {
    public renderer: THREE.WebGLRenderer;
    public composer: EffectComposer;
    private bloomPass: UnrealBloomPass;

    constructor(canvas: HTMLCanvasElement, scene: THREE.Scene, camera: THREE.Camera) {
        // WebGL渲染器配置
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.8;

        // 后处理效果管道
        this.composer = new EffectComposer(this.renderer);

        // 渲染通道
        const renderPass = new RenderPass(scene, camera);
        this.composer.addPass(renderPass);

        // 辉光效果 - 营造梦幻感
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.5,  // 强度
            0.4,  // 半径
            0.85  // 阈值
        );
        this.composer.addPass(this.bloomPass);
    }

    /**
     * 渲染帧
     */
    render(): void {
        this.composer.render();
    }

    /**
     * 调整渲染器尺寸
     */
    resize(width: number, height: number): void {
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);
    }

    /**
     * 更新辉光强度（基于移动状态）
     */
    updateBloom(intensity: number): void {
        this.bloomPass.strength = intensity;
    }

    /**
     * 销毁渲染器
     */
    dispose(): void {
        this.renderer.dispose();
        this.composer.dispose();
    }
}
