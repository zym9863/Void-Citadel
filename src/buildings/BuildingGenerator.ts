import * as THREE from 'three';

/**
 * 建筑类型常量
 */
export const BuildingType = {
    PAVILION: 'pavilion',     // 亭
    TERRACE: 'terrace',       // 台
    TOWER: 'tower',           // 楼
    CHAMBER: 'chamber'        // 阁
} as const;

export type BuildingType = typeof BuildingType[keyof typeof BuildingType];

/**
 * 建筑配置接口
 */
export interface BuildingConfig {
    type: BuildingType;
    position: THREE.Vector3;
    rotation: number;
    scale: number;
    seed: number;
}

/**
 * 古典中式建筑生成器
 */
export class BuildingGenerator {
    private static readonly ROOF_MATERIAL = new THREE.MeshStandardMaterial({
        color: 0x2a2a3a,
        roughness: 0.7,
        metalness: 0.1
    });

    private static readonly PILLAR_MATERIAL = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.8,
        metalness: 0
    });

    private static readonly BASE_MATERIAL = new THREE.MeshStandardMaterial({
        color: 0x4a4a5a,
        roughness: 0.9,
        metalness: 0
    });

    /**
     * 生成建筑群组
     */
    static generate(config: BuildingConfig): THREE.Group {
        const group = new THREE.Group();

        switch (config.type) {
            case BuildingType.PAVILION:
                this.createPavilion(group, config);
                break;
            case BuildingType.TERRACE:
                this.createTerrace(group, config);
                break;
            case BuildingType.TOWER:
                this.createTower(group, config);
                break;
            case BuildingType.CHAMBER:
                this.createChamber(group, config);
                break;
        }

        group.position.copy(config.position);
        group.rotation.y = config.rotation;
        group.scale.setScalar(config.scale);

        return group;
    }

    /**
     * 创建亭子
     */
    private static createPavilion(group: THREE.Group, _config: BuildingConfig): void {
        // 基座
        const baseGeom = new THREE.CylinderGeometry(3, 3.5, 0.5, 6);
        const base = new THREE.Mesh(baseGeom, this.BASE_MATERIAL);
        base.position.y = 0.25;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // 柱子 (6根)
        const pillarGeom = new THREE.CylinderGeometry(0.15, 0.18, 4, 8);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const pillar = new THREE.Mesh(pillarGeom, this.PILLAR_MATERIAL);
            pillar.position.set(
                Math.cos(angle) * 2.5,
                2.5,
                Math.sin(angle) * 2.5
            );
            pillar.castShadow = true;
            group.add(pillar);
        }

        // 飞檐屋顶
        const roofGeom = new THREE.ConeGeometry(4, 2, 6);
        const roof = new THREE.Mesh(roofGeom, this.ROOF_MATERIAL);
        roof.position.y = 5.5;
        roof.castShadow = true;
        group.add(roof);

        // 屋顶尖
        const topGeom = new THREE.SphereGeometry(0.3, 8, 8);
        const top = new THREE.Mesh(topGeom, this.PILLAR_MATERIAL);
        top.position.y = 6.7;
        group.add(top);
    }

    /**
     * 创建台
     */
    private static createTerrace(group: THREE.Group, _config: BuildingConfig): void {
        // 多层平台
        const layers = 3;
        for (let i = 0; i < layers; i++) {
            const size = 8 - i * 2;
            const height = 1;
            const terraceGeom = new THREE.BoxGeometry(size, height, size);
            const terrace = new THREE.Mesh(terraceGeom, this.BASE_MATERIAL);
            terrace.position.y = i * height + height / 2;
            terrace.castShadow = true;
            terrace.receiveShadow = true;
            group.add(terrace);
        }

        // 栏杆柱
        const railGeom = new THREE.CylinderGeometry(0.1, 0.1, 1, 4);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const rail = new THREE.Mesh(railGeom, this.PILLAR_MATERIAL);
            rail.position.set(
                Math.cos(angle) * 2.5,
                3.5,
                Math.sin(angle) * 2.5
            );
            group.add(rail);
        }
    }

    /**
     * 创建楼
     */
    private static createTower(group: THREE.Group, config: BuildingConfig): void {
        const floors = 3 + Math.floor(config.seed % 3);

        for (let i = 0; i < floors; i++) {
            const floorScale = 1 - i * 0.1;
            const floorHeight = 3;
            const yOffset = i * floorHeight;

            // 楼层主体
            const bodyGeom = new THREE.BoxGeometry(5 * floorScale, floorHeight * 0.7, 5 * floorScale);
            const body = new THREE.Mesh(bodyGeom, this.BASE_MATERIAL);
            body.position.y = yOffset + floorHeight * 0.35;
            body.castShadow = true;
            body.receiveShadow = true;
            group.add(body);

            // 楼层角柱
            const cornerPillarGeom = new THREE.CylinderGeometry(0.12, 0.15, floorHeight * 0.8, 6);
            const corners = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            corners.forEach(([x, z]) => {
                const pillar = new THREE.Mesh(cornerPillarGeom, this.PILLAR_MATERIAL);
                pillar.position.set(
                    x * 2.3 * floorScale,
                    yOffset + floorHeight * 0.4,
                    z * 2.3 * floorScale
                );
                pillar.castShadow = true;
                group.add(pillar);
            });

            // 飞檐
            const roofGeom = new THREE.BoxGeometry(6 * floorScale, 0.3, 6 * floorScale);
            const roof = new THREE.Mesh(roofGeom, this.ROOF_MATERIAL);
            roof.position.y = yOffset + floorHeight * 0.85;
            roof.castShadow = true;
            group.add(roof);
        }

        // 顶部尖塔
        const spireGeom = new THREE.ConeGeometry(0.4, 2, 6);
        const spire = new THREE.Mesh(spireGeom, this.ROOF_MATERIAL);
        spire.position.y = floors * 3 + 1;
        group.add(spire);
    }

    /**
     * 创建阁
     */
    private static createChamber(group: THREE.Group, _config: BuildingConfig): void {
        // 八角形基座
        const baseGeom = new THREE.CylinderGeometry(4, 4.5, 1, 8);
        const base = new THREE.Mesh(baseGeom, this.BASE_MATERIAL);
        base.position.y = 0.5;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // 八根柱子
        const pillarGeom = new THREE.CylinderGeometry(0.2, 0.22, 5, 8);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const pillar = new THREE.Mesh(pillarGeom, this.PILLAR_MATERIAL);
            pillar.position.set(
                Math.cos(angle) * 3.5,
                3.5,
                Math.sin(angle) * 3.5
            );
            pillar.castShadow = true;
            group.add(pillar);
        }

        // 双层飞檐屋顶
        const roof1Geom = new THREE.ConeGeometry(5, 1.5, 8);
        const roof1 = new THREE.Mesh(roof1Geom, this.ROOF_MATERIAL);
        roof1.position.y = 6.5;
        roof1.castShadow = true;
        group.add(roof1);

        const roof2Geom = new THREE.ConeGeometry(3.5, 2, 8);
        const roof2 = new THREE.Mesh(roof2Geom, this.ROOF_MATERIAL);
        roof2.position.y = 8;
        roof2.castShadow = true;
        group.add(roof2);

        // 宝顶
        const topGeom = new THREE.SphereGeometry(0.4, 8, 8);
        const top = new THREE.Mesh(topGeom, this.PILLAR_MATERIAL);
        top.position.y = 9.2;
        group.add(top);
    }

    /**
     * 根据位置确定性生成建筑类型
     */
    static getTypeFromSeed(seed: number): BuildingType {
        const types = Object.values(BuildingType);
        return types[Math.floor(seed) % types.length];
    }
}
