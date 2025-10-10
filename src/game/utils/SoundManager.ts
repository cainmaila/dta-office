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
     * 解析音效路徑（處理 base path）
     */
    private static resolveSoundPath(path: string): string {
        // 如果路徑已經是完整的 URL，直接返回
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }

        // 取得 base path（從 <base> 標籤或使用預設值）
        const baseElement = document.querySelector('base');
        const basePath = baseElement?.getAttribute('href') || '';

        // 移除路徑開頭的斜線（如果有的話）
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;

        // 組合完整路徑
        return `${basePath}${cleanPath}`;
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

            // 解析完整路徑
            const resolvedUrl = this.resolveSoundPath(url);

            // 載入音效
            const audioBuffer = await this.loadSound(resolvedUrl);

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

            console.log(`🔊 Playing sound: ${resolvedUrl}`);
        } catch (error) {
            console.error(`Failed to play sound: ${url}`, error);
        }
    }

    /**
     * 預載音效
     */
    static async preloadSound(url: string): Promise<void> {
        try {
            const resolvedUrl = this.resolveSoundPath(url);
            await this.loadSound(resolvedUrl);
            console.log(`✅ Preloaded sound: ${resolvedUrl}`);
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
