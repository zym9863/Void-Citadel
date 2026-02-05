import * as THREE from 'three';
import { BuildingGenerator } from '../buildings/BuildingGenerator';
import type { BuildingConfig } from '../buildings/BuildingGenerator';
import { PerlinNoise } from './PerlinNoise';

/**
 * 区块数据
 */
interface Chunk {
    key: string;
    x: number;
    z: number;
    buildings: THREE.Group[];
    particles: THREE.Points | null;
    dissolveProgress: number;  // 0-1, 1表示完全溶解
}

/**
 * 区块管理器
 * 基于观察者位置动态加载/卸载建筑
 * 实现"见即存在，不见即虚无"
 */
export class ChunkManager {
    private scene: THREE.Scene;
    private chunks: Map<string, Chunk> = new Map();
    private noise: PerlinNoise;

    // 区块参数
    private readonly chunkSize = 50;
    private readonly viewDistance = 4;      // 可见区块距离
    private readonly dissolveDistance = 3;  // 开始溶解的距离
    private readonly buildingsPerChunk = 3;

    // 粒子系统
    private particleGeometry: THREE.BufferGeometry;
    private particleMaterial: THREE.PointsMaterial;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.noise = new PerlinNoise(12345);

        // 预创建粒子几何体
        this.particleGeometry = new THREE.BufferGeometry();
        this.particleMaterial = new THREE.PointsMaterial({
            color: 0x8899bb,
            size: 0.15,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
    }

    /**
     * 更新区块
     */
    update(viewerPosition: THREE.Vector3, deltaTime: number): void {
        const currentChunkX = Math.floor(viewerPosition.x / this.chunkSize);
        const currentChunkZ = Math.floor(viewerPosition.z / this.chunkSize);

        // 生成/更新可见区块
        for (let dx = -this.viewDistance; dx <= this.viewDistance; dx++) {
            for (let dz = -this.viewDistance; dz <= this.viewDistance; dz++) {
                const chunkX = currentChunkX + dx;
                const chunkZ = currentChunkZ + dz;
                const key = `${chunkX},${chunkZ}`;
                const distance = Math.sqrt(dx * dx + dz * dz);

                if (!this.chunks.has(key)) {
                    this.createChunk(chunkX, chunkZ);
                }

                // 更新溶解状态
                const chunk = this.chunks.get(key)!;
                this.updateDissolve(chunk, distance, deltaTime);
            }
        }

        // 移除过远的区块
        for (const [key, chunk] of this.chunks) {
            const dx = chunk.x - currentChunkX;
            const dz = chunk.z - currentChunkZ;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance > this.viewDistance + 1) {
                this.removeChunk(key);
            }
        }
    }

    /**
     * 创建区块
     */
    private createChunk(chunkX: number, chunkZ: number): void {
        const key = `${chunkX},${chunkZ}`;
        const chunk: Chunk = {
            key,
            x: chunkX,
            z: chunkZ,
            buildings: [],
            particles: null,
            dissolveProgress: 0
        };

        // 使用噪声确定建筑数量和位置
        const baseSeed = chunkX * 73856093 + chunkZ * 19349663;
        const buildingCount = Math.floor(this.noise.noise2D(chunkX * 0.1, chunkZ * 0.1) * 2 + this.buildingsPerChunk);

        for (let i = 0; i < buildingCount; i++) {
            const seed = baseSeed + i * 83492791;
            const localX = ((seed % 1000) / 1000) * this.chunkSize * 0.8 + this.chunkSize * 0.1;
            const localZ = (((seed * 7) % 1000) / 1000) * this.chunkSize * 0.8 + this.chunkSize * 0.1;

            const config: BuildingConfig = {
                type: BuildingGenerator.getTypeFromSeed(seed),
                position: new THREE.Vector3(
                    chunkX * this.chunkSize + localX,
                    0,
                    chunkZ * this.chunkSize + localZ
                ),
                rotation: (seed % 628) / 100,
                scale: 0.8 + (seed % 40) / 100,
                seed: seed
            };

            const building = BuildingGenerator.generate(config);
            building.userData.originalPosition = building.position.clone();
            building.userData.seed = seed;

            chunk.buildings.push(building);
            this.scene.add(building);
        }

        // 创建粒子系统
        chunk.particles = this.createParticlesForChunk(chunk);
        if (chunk.particles) {
            chunk.particles.visible = false;
            this.scene.add(chunk.particles);
        }

        this.chunks.set(key, chunk);
    }

    /**
     * 为区块创建粒子
     */
    private createParticlesForChunk(chunk: Chunk): THREE.Points | null {
        if (chunk.buildings.length === 0) return null;

        const particleCount = 500;
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const buildingIndex = i % chunk.buildings.length;
            const building = chunk.buildings[buildingIndex];
            const pos = building.userData.originalPosition as THREE.Vector3;

            positions[i * 3] = pos.x + (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = Math.random() * 15;
            positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 10;

            velocities[i * 3] = (Math.random() - 0.5) * 0.5;
            velocities[i * 3 + 1] = Math.random() * 0.3 + 0.1;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

        return new THREE.Points(geometry, this.particleMaterial.clone());
    }

    /**
     * 更新溶解效果
     */
    private updateDissolve(chunk: Chunk, distance: number, deltaTime: number): void {
        const targetDissolve = distance > this.dissolveDistance
            ? Math.min((distance - this.dissolveDistance) / (this.viewDistance - this.dissolveDistance), 1)
            : 0;

        // 平滑过渡
        chunk.dissolveProgress += (targetDissolve - chunk.dissolveProgress) * deltaTime * 2;

        // 更新建筑透明度
        chunk.buildings.forEach(building => {
            building.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    const material = child.material as THREE.MeshStandardMaterial;
                    if (!material.transparent) {
                        material.transparent = true;
                    }
                    material.opacity = 1 - chunk.dissolveProgress;
                }
            });

            // 建筑上浮效果
            const originalPos = building.userData.originalPosition as THREE.Vector3;
            building.position.y = originalPos.y + chunk.dissolveProgress * 2;
        });

        // 更新粒子
        if (chunk.particles) {
            chunk.particles.visible = chunk.dissolveProgress > 0.1;
            const particleMaterial = chunk.particles.material as THREE.PointsMaterial;
            particleMaterial.opacity = chunk.dissolveProgress * 0.6;

            // 粒子动画
            if (chunk.particles.visible) {
                const positions = chunk.particles.geometry.attributes.position.array as Float32Array;
                const velocities = chunk.particles.geometry.attributes.velocity.array as Float32Array;

                for (let i = 0; i < positions.length / 3; i++) {
                    positions[i * 3 + 1] += velocities[i * 3 + 1] * deltaTime * 5;

                    // 循环
                    if (positions[i * 3 + 1] > 20) {
                        positions[i * 3 + 1] = 0;
                    }
                }
                chunk.particles.geometry.attributes.position.needsUpdate = true;
            }
        }
    }

    /**
     * 移除区块
     */
    private removeChunk(key: string): void {
        const chunk = this.chunks.get(key);
        if (!chunk) return;

        chunk.buildings.forEach(building => {
            this.scene.remove(building);
            building.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                }
            });
        });

        if (chunk.particles) {
            this.scene.remove(chunk.particles);
            chunk.particles.geometry.dispose();
            (chunk.particles.material as THREE.Material).dispose();
        }

        this.chunks.delete(key);
    }

    /**
     * 获取当前区块数
     */
    getChunkCount(): number {
        return this.chunks.size;
    }

    /**
     * 销毁
     */
    dispose(): void {
        for (const key of this.chunks.keys()) {
            this.removeChunk(key);
        }
        this.particleGeometry.dispose();
        this.particleMaterial.dispose();
    }
}
