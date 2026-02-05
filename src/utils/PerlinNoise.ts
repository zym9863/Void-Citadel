/**
 * Perlin噪声工具
 * 用于生成有机运动和程序化内容
 */
export class PerlinNoise {
    private permutation: number[];

    constructor(seed: number = Math.random() * 10000) {
        this.permutation = this.generatePermutation(seed);
    }

    private generatePermutation(seed: number): number[] {
        const perm: number[] = [];
        for (let i = 0; i < 256; i++) {
            perm[i] = i;
        }

        // Fisher-Yates 洗牌
        let random = seed;
        for (let i = 255; i > 0; i--) {
            random = (random * 16807) % 2147483647;
            const j = random % (i + 1);
            [perm[i], perm[j]] = [perm[j], perm[i]];
        }

        // 扩展到512以避免取模
        return [...perm, ...perm];
    }

    private fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    private lerp(a: number, b: number, t: number): number {
        return a + t * (b - a);
    }

    private grad(hash: number, x: number, y: number, z: number): number {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    /**
     * 3D Perlin噪声
     */
    noise3D(x: number, y: number, z: number): number {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);

        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);

        const p = this.permutation;
        const A = p[X] + Y;
        const AA = p[A] + Z;
        const AB = p[A + 1] + Z;
        const B = p[X + 1] + Y;
        const BA = p[B] + Z;
        const BB = p[B + 1] + Z;

        return this.lerp(
            this.lerp(
                this.lerp(this.grad(p[AA], x, y, z), this.grad(p[BA], x - 1, y, z), u),
                this.lerp(this.grad(p[AB], x, y - 1, z), this.grad(p[BB], x - 1, y - 1, z), u),
                v
            ),
            this.lerp(
                this.lerp(this.grad(p[AA + 1], x, y, z - 1), this.grad(p[BA + 1], x - 1, y, z - 1), u),
                this.lerp(this.grad(p[AB + 1], x, y - 1, z - 1), this.grad(p[BB + 1], x - 1, y - 1, z - 1), u),
                v
            ),
            w
        );
    }

    /**
     * 2D Perlin噪声
     */
    noise2D(x: number, y: number): number {
        return this.noise3D(x, y, 0);
    }

    /**
     * 分形布朗运动 (FBM)
     * 多层叠加的噪声，产生更自然的效果
     */
    fbm(x: number, y: number, z: number, octaves: number = 4, lacunarity: number = 2.0, gain: number = 0.5): number {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            value += amplitude * this.noise3D(x * frequency, y * frequency, z * frequency);
            maxValue += amplitude;
            amplitude *= gain;
            frequency *= lacunarity;
        }

        return value / maxValue;
    }
}
