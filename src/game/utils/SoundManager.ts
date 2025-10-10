/**
 * 音效管理器
 * 提供簡單的音效播放功能
 */
export class SoundManager {
    private static audioContext: AudioContext | null = null;
    private static soundCache: Map<string, AudioBuffer> = new Map();

    /**
     * 初始化 Audio Context
     */
    private static getAudioContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }

    /**
     * 載入音效檔案
     */
    private static async loadSound(url: string): Promise<AudioBuffer> {
        // 檢查快取
        if (this.soundCache.has(url)) {
            return this.soundCache.get(url)!;
        }

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioContext = this.getAudioContext();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // 快取音效
            this.soundCache.set(url, audioBuffer);
            return audioBuffer;
        } catch (error) {
            console.error(`Failed to load sound: ${url}`, error);
            throw error;
        }
    }

    /**
     * 播放音效
     * @param url 音效檔案路徑
     * @param volume 音量 (0.0 - 1.0)
     */
    static async playSound(url: string, volume: number = 1.0): Promise<void> {
        try {
            const audioContext = this.getAudioContext();

            // 確保 AudioContext 已啟動（處理瀏覽器自動播放政策）
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // 載入音效
            const audioBuffer = await this.loadSound(url);

            // 建立音源
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;

            // 建立音量控制
            const gainNode = audioContext.createGain();
            gainNode.gain.value = Math.max(0, Math.min(1, volume));

            // 連接節點
            source.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // 播放
            source.start(0);

            console.log(`🔊 Playing sound: ${url}`);
        } catch (error) {
            console.error(`Failed to play sound: ${url}`, error);
        }
    }

    /**
     * 預載音效
     */
    static async preloadSound(url: string): Promise<void> {
        try {
            await this.loadSound(url);
            console.log(`✅ Preloaded sound: ${url}`);
        } catch (error) {
            console.error(`Failed to preload sound: ${url}`, error);
        }
    }

    /**
     * 預載多個音效
     */
    static async preloadSounds(urls: string[]): Promise<void> {
        await Promise.all(urls.map(url => this.preloadSound(url)));
    }

    /**
     * 清除快取
     */
    static clearCache(): void {
        this.soundCache.clear();
    }

    /**
     * 清除特定音效快取
     */
    static clearSound(url: string): void {
        this.soundCache.delete(url);
    }
}
