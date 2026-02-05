import * as THREE from 'three';

/**
 * 相机控制器
 * 透视相机配置，支持第一人称视角
 */
export class VoidCamera {
    public camera: THREE.PerspectiveCamera;
    public velocity: THREE.Vector3;
    public direction: THREE.Vector3;

    // 移动状态
    public isMoving: boolean = false;
    public speed: number = 0;

    constructor(aspect: number) {
        // 透视相机 - 70度视野营造沉浸感
        this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 1000);
        this.camera.position.set(0, 5, 0);

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
    }

    /**
     * 更新相机宽高比
     */
    updateAspect(aspect: number): void {
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }

    /**
     * 获取相机位置
     */
    getPosition(): THREE.Vector3 {
        return this.camera.position.clone();
    }

    /**
     * 获取相机前方向
     */
    getForward(): THREE.Vector3 {
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        return forward;
    }

    /**
     * 更新移动状态
     */
    updateMovementState(velocity: THREE.Vector3): void {
        this.speed = velocity.length();
        this.isMoving = this.speed > 0.01;
    }
}
