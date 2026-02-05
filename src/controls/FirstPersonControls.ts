import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { VoidCamera } from '../core/Camera';

/**
 * 第一人称控制器
 * WASD移动 + 鼠标旋转视角
 */
export class FirstPersonControls {
    public controls: PointerLockControls;
    private camera: VoidCamera;

    // 移动状态
    private moveForward = false;
    private moveBackward = false;
    private moveLeft = false;
    private moveRight = false;

    // 移动参数
    private readonly moveSpeed = 15.0;
    private readonly dampingFactor = 0.85;

    private velocity: THREE.Vector3;
    private direction: THREE.Vector3;

    // 上一帧位置，用于计算移动速度
    private lastPosition: THREE.Vector3;
    private movementDelta: THREE.Vector3;

    constructor(camera: VoidCamera, domElement: HTMLElement) {
        this.camera = camera;
        this.controls = new PointerLockControls(camera.camera, domElement);

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.lastPosition = camera.camera.position.clone();
        this.movementDelta = new THREE.Vector3();

        this.setupEventListeners(domElement);
    }

    private setupEventListeners(domElement: HTMLElement): void {
        // 点击锁定鼠标
        domElement.addEventListener('click', () => {
            this.controls.lock();
        });

        // 键盘控制
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    private onKeyDown(event: KeyboardEvent): void {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = true;
                break;
        }
    }

    private onKeyUp(event: KeyboardEvent): void {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = false;
                break;
        }
    }

    /**
     * 更新控制器
     */
    update(deltaTime: number): void {
        if (!this.controls.isLocked) return;

        // 保存上一帧位置
        this.lastPosition.copy(this.camera.camera.position);

        // 应用阻尼
        this.velocity.x *= this.dampingFactor;
        this.velocity.z *= this.dampingFactor;

        // 计算移动方向
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        // 应用移动
        if (this.moveForward || this.moveBackward) {
            this.velocity.z -= this.direction.z * this.moveSpeed * deltaTime;
        }
        if (this.moveLeft || this.moveRight) {
            this.velocity.x -= this.direction.x * this.moveSpeed * deltaTime;
        }

        // 移动相机
        this.controls.moveRight(-this.velocity.x);
        this.controls.moveForward(-this.velocity.z);

        // 计算移动增量
        this.movementDelta.subVectors(this.camera.camera.position, this.lastPosition);

        // 更新相机移动状态
        this.camera.updateMovementState(this.movementDelta);
    }

    /**
     * 获取移动增量
     */
    getMovementDelta(): THREE.Vector3 {
        return this.movementDelta.clone();
    }

    /**
     * 是否锁定
     */
    isLocked(): boolean {
        return this.controls.isLocked;
    }
}
