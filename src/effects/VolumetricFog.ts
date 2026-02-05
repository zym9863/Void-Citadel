import * as THREE from 'three';

/**
 * 体积雾效果
 * 营造空城寂寥的氛围
 */
export class VolumetricFog {
    private scene: THREE.Scene;
    private fogParticles: THREE.Points;
    private fogMaterial: THREE.ShaderMaterial;
    private time: number = 0;

    constructor(scene: THREE.Scene) {
        this.scene = scene;

        // 创建雾粒子
        const particleCount = 2000;
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const opacities = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // 在大范围内分布雾粒子
            positions[i * 3] = (Math.random() - 0.5) * 300;
            positions[i * 3 + 1] = Math.random() * 30;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 300;

            sizes[i] = Math.random() * 8 + 4;
            opacities[i] = Math.random() * 0.3 + 0.1;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

        // 雾着色器
        this.fogMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0x4466aa) },
                uPlayerPosition: { value: new THREE.Vector3() }
            },
            vertexShader: `
        attribute float size;
        attribute float opacity;
        
        uniform float uTime;
        uniform vec3 uPlayerPosition;
        
        varying float vOpacity;
        varying float vDistanceToPlayer;
        
        void main() {
          vOpacity = opacity;
          
          vec3 pos = position;
          
          // 雾的有机运动
          pos.x += sin(uTime * 0.1 + position.z * 0.01) * 2.0;
          pos.y += sin(uTime * 0.15 + position.x * 0.01) * 1.0;
          pos.z += cos(uTime * 0.12 + position.y * 0.01) * 2.0;
          
          // 计算到玩家的距离
          vDistanceToPlayer = distance(pos, uPlayerPosition);
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
            fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        
        varying float vOpacity;
        varying float vDistanceToPlayer;
        
        void main() {
          // 圆形粒子
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          
          if (dist > 0.5) discard;
          
          // 柔和边缘
          float alpha = smoothstep(0.5, 0.0, dist) * vOpacity;
          
          // 玩家附近的雾淡化
          float playerFade = smoothstep(10.0, 30.0, vDistanceToPlayer);
          alpha *= playerFade;
          
          // 颜色随时间微微变化
          vec3 color = uColor + vec3(
            sin(uTime * 0.1) * 0.02,
            cos(uTime * 0.12) * 0.02,
            sin(uTime * 0.08) * 0.03
          );
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.fogParticles = new THREE.Points(geometry, this.fogMaterial);
        this.scene.add(this.fogParticles);
    }

    /**
     * 更新雾效果
     */
    update(deltaTime: number, playerPosition: THREE.Vector3): void {
        this.time += deltaTime;
        this.fogMaterial.uniforms.uTime.value = this.time;
        this.fogMaterial.uniforms.uPlayerPosition.value.copy(playerPosition);

        // 雾粒子跟随玩家（无限雾效果）
        const positions = this.fogParticles.geometry.attributes.position.array as Float32Array;
        const range = 150;

        for (let i = 0; i < positions.length / 3; i++) {
            // X轴循环
            if (positions[i * 3] < playerPosition.x - range) {
                positions[i * 3] += range * 2;
            } else if (positions[i * 3] > playerPosition.x + range) {
                positions[i * 3] -= range * 2;
            }

            // Z轴循环
            if (positions[i * 3 + 2] < playerPosition.z - range) {
                positions[i * 3 + 2] += range * 2;
            } else if (positions[i * 3 + 2] > playerPosition.z + range) {
                positions[i * 3 + 2] -= range * 2;
            }
        }

        this.fogParticles.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * 设置雾颜色
     */
    setColor(color: THREE.Color): void {
        this.fogMaterial.uniforms.uColor.value = color;
    }

    /**
     * 销毁
     */
    dispose(): void {
        this.scene.remove(this.fogParticles);
        this.fogParticles.geometry.dispose();
        this.fogMaterial.dispose();
    }
}
