import * as THREE from 'three';

/**
 * 时空涟漪效果
 * 基于用户移动产生视觉扭曲和有机运动
 */
export class TemporalRipple {
    private scene: THREE.Scene;
    private time: number = 0;

    // 涟漪参数
    private rippleIntensity: number = 0;
    private targetIntensity: number = 0;

    // 后处理材质
    public rippleMaterial: THREE.ShaderMaterial;
    private rippleMesh: THREE.Mesh;

    // 状态
    private isStationary: boolean = true;
    private stationaryTime: number = 0;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        // 创建时空涟漪着色器材质
        this.rippleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uIntensity: { value: 0 },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                uPlayerSpeed: { value: 0 },
                uStationaryTime: { value: 0 }
            },
            vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        uniform float uTime;
        uniform float uIntensity;
        
        void main() {
          vUv = uv;
          vPosition = position;
          
          vec3 pos = position;
          
          // 基于时间和强度的顶点扭曲
          float wave = sin(pos.x * 0.5 + uTime) * cos(pos.z * 0.5 + uTime * 0.7);
          pos.y += wave * uIntensity * 0.5;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
            fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        uniform float uPlayerSpeed;
        uniform float uStationaryTime;
        uniform vec2 uResolution;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        // Perlin噪声函数
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          
          i = mod289(i);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          
          vec4 s0 = floor(b0) * 2.0 + 1.0;
          vec4 s1 = floor(b1) * 2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          
          vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
          
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          
          vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          
          vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
        }
        
        void main() {
          vec2 uv = vUv;
          
          // 时空涟漪效果
          float noise1 = snoise(vec3(uv * 3.0, uTime * 0.2)) * 0.5 + 0.5;
          float noise2 = snoise(vec3(uv * 5.0, uTime * 0.3 + 100.0)) * 0.5 + 0.5;
          
          // 涟漪扭曲
          float ripple = sin(length(uv - 0.5) * 20.0 - uTime * 2.0) * uIntensity;
          
          // 颜色计算 - 空灵的蓝紫色调
          vec3 baseColor = vec3(0.1, 0.12, 0.2);
          vec3 rippleColor = vec3(0.3, 0.4, 0.6);
          vec3 glowColor = vec3(0.5, 0.6, 0.9);
          
          // 混合噪声和涟漪
          float blend = noise1 * noise2 * (1.0 + uIntensity);
          vec3 color = mix(baseColor, rippleColor, blend * 0.5);
          
          // 移动时的动态效果
          color += glowColor * ripple * uPlayerSpeed * 0.3;
          
          // 静止时的细节浮现
          float detailReveal = smoothstep(0.0, 3.0, uStationaryTime);
          color += vec3(0.05, 0.08, 0.12) * detailReveal * noise1;
          
          // 边缘发光
          float edge = 1.0 - length(uv - 0.5) * 1.5;
          color += glowColor * edge * uIntensity * 0.2;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
            transparent: true,
            side: THREE.DoubleSide
        });

        // 创建地面涟漪网格
        const geometry = new THREE.PlaneGeometry(500, 500, 100, 100);
        this.rippleMesh = new THREE.Mesh(geometry, this.rippleMaterial);
        this.rippleMesh.rotation.x = -Math.PI / 2;
        this.rippleMesh.position.y = -0.5;
        this.scene.add(this.rippleMesh);
    }

    /**
     * 更新时空涟漪
     */
    update(deltaTime: number, playerSpeed: number): void {
        this.time += deltaTime;

        // 更新静止状态
        if (playerSpeed < 0.01) {
            this.isStationary = true;
            this.stationaryTime += deltaTime;
        } else {
            this.isStationary = false;
            this.stationaryTime = 0;
        }

        // 计算目标涟漪强度
        this.targetIntensity = Math.min(playerSpeed * 2, 1.0);

        // 平滑过渡
        this.rippleIntensity += (this.targetIntensity - this.rippleIntensity) * deltaTime * 3;

        // 更新着色器参数
        this.rippleMaterial.uniforms.uTime.value = this.time;
        this.rippleMaterial.uniforms.uIntensity.value = this.rippleIntensity;
        this.rippleMaterial.uniforms.uPlayerSpeed.value = playerSpeed;
        this.rippleMaterial.uniforms.uStationaryTime.value = this.stationaryTime;
    }

    /**
     * 调整尺寸
     */
    resize(width: number, height: number): void {
        this.rippleMaterial.uniforms.uResolution.value.set(width, height);
    }

    /**
     * 获取当前涟漪强度
     */
    getIntensity(): number {
        return this.rippleIntensity;
    }

    /**
     * 是否处于静止状态
     */
    isPlayerStationary(): boolean {
        return this.isStationary;
    }

    /**
     * 销毁
     */
    dispose(): void {
        this.scene.remove(this.rippleMesh);
        this.rippleMesh.geometry.dispose();
        this.rippleMaterial.dispose();
    }
}
