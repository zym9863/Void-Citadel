import * as THREE from 'three';

/**
 * 场景管理器
 * 创建并配置墟境的核心场景，包含环境光照和背景
 */
export class VoidScene {
  public scene: THREE.Scene;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;

  constructor() {
    this.scene = new THREE.Scene();

    // 渐变虚空背景色 - 深邃的暗蓝紫色
    this.scene.background = new THREE.Color(0x0a0a12);

    // 配置体积雾 - 营造空城氛围
    this.scene.fog = new THREE.FogExp2(0x0a0a12, 0.015);

    // 冷色调环境光 - 空灵寂寥感
    this.ambientLight = new THREE.AmbientLight(0x4466aa, 0.3);
    this.scene.add(this.ambientLight);

    // 淡色月光方向光
    this.directionalLight = new THREE.DirectionalLight(0x8899bb, 0.5);
    this.directionalLight.position.set(50, 100, 50);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(this.directionalLight);
  }

  /**
   * 更新场景状态
   */
  update(_deltaTime: number): void {
    // 可扩展：动态光照变化等
  }

  /**
   * 添加对象到场景
   */
  add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /**
   * 从场景移除对象
   */
  remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }
}
