declare module 'pcm-stream-player' {
    export class FUPCMPlayer {
        constructor(options: {
            encoding: '16bitInt' | 'float32';
            channels: number;
            sampleRate: number;
            flushingTime?: number;
        });
        feed(data: Int16Array | Float32Array): void;
        destroy(): void;
    }
}
