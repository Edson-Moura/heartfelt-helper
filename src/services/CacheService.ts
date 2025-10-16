/**
 * Sistema de Cache para respostas comuns
 * Economia estimada: 30% dos custos (respostas repetidas)
 */

interface CachedResponse {
  text: string;
  videoUrl?: string;
  audioUrl?: string;
  timestamp: number;
  hitCount: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  savedCost: number;
}

class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CachedResponse> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, savedCost: 0 };
  
  // Configurações
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 horas
  private readonly MAX_CACHE_SIZE = 100;
  private readonly COST_PER_GENERATION = 0.033; // $0.033 por interação

  // Respostas comuns pré-cacheadas
  private readonly COMMON_RESPONSES = [
    "Hello! I'm Alex, your English tutor. What would you like to talk about today?",
    "That's correct! Well done!",
    "Let me explain that differently.",
    "Could you repeat that, please?",
    "Great job! Keep going!",
    "I didn't quite understand. Can you say it again?",
    "Perfect pronunciation!",
    "Let's practice that again.",
  ];

  private constructor() {
    this.loadFromStorage();
    this.preloadCommonResponses();
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Gera chave de cache baseada no texto
   */
  private generateKey(text: string): string {
    // Normaliza texto (lowercase, remove pontuação extra)
    const normalized = text.toLowerCase().trim().replace(/[.!?]+$/, '');
    return normalized;
  }

  /**
   * Verifica se deve usar cache para esta resposta
   */
  shouldCache(text: string): boolean {
    // Cache apenas respostas curtas e comuns
    const wordCount = text.split(' ').length;
    return wordCount <= 30 && text.length <= 200;
  }

  /**
   * Busca resposta no cache
   */
  get(text: string): CachedResponse | null {
    const key = this.generateKey(text);
    const cached = this.cache.get(key);

    if (!cached) {
      this.stats.misses++;
      return null;
    }

    // Verifica TTL
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Cache hit!
    this.stats.hits++;
    this.stats.savedCost += this.COST_PER_GENERATION;
    cached.hitCount++;
    
    console.log(`🎯 Cache HIT! Saved $${this.COST_PER_GENERATION.toFixed(4)}`);
    console.log(`📊 Cache stats: ${this.getHitRate()}% hit rate, $${this.stats.savedCost.toFixed(2)} saved`);

    return cached;
  }

  /**
   * Armazena resposta no cache
   */
  set(text: string, videoUrl?: string, audioUrl?: string): void {
    if (!this.shouldCache(text)) {
      return;
    }

    const key = this.generateKey(text);
    
    // Limpa cache se atingir tamanho máximo (remove menos usados)
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      text,
      videoUrl,
      audioUrl,
      timestamp: Date.now(),
      hitCount: 0,
    });

    this.saveToStorage();
    console.log(`💾 Cached response: "${text.substring(0, 50)}..."`);
  }

  /**
   * Remove itens menos usados do cache
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].hitCount - b[1].hitCount);
    
    // Remove 20% dos menos usados
    const toRemove = Math.ceil(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Pre-carrega respostas comuns
   */
  private async preloadCommonResponses(): Promise<void> {
    console.log('🔄 Pre-loading common responses...');
    
    // Marca respostas comuns como pré-cacheadas
    this.COMMON_RESPONSES.forEach(response => {
      const key = this.generateKey(response);
      if (!this.cache.has(key)) {
        this.cache.set(key, {
          text: response,
          timestamp: Date.now(),
          hitCount: 0,
        });
      }
    });

    console.log(`✅ Pre-loaded ${this.COMMON_RESPONSES.length} common responses`);
  }

  /**
   * Persiste cache no localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        cache: Array.from(this.cache.entries()),
        stats: this.stats,
      };
      localStorage.setItem('livelesson-cache', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * Carrega cache do localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('livelesson-cache');
      if (data) {
        const parsed = JSON.parse(data);
        this.cache = new Map(parsed.cache);
        this.stats = parsed.stats || this.stats;
        console.log(`✅ Loaded ${this.cache.size} cached responses from storage`);
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  /**
   * Limpa cache expirado
   */
  cleanup(): void {
    const now = Date.now();
    let removed = 0;

    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.TTL) {
        this.cache.delete(key);
        removed++;
      }
    });

    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} expired cache entries`);
      this.saveToStorage();
    }
  }

  /**
   * Estatísticas do cache
   */
  getStats(): CacheStats & { size: number; hitRate: string } {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.getHitRate() + '%',
    };
  }

  private getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : Math.round((this.stats.hits / total) * 100);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, savedCost: 0 };
    localStorage.removeItem('livelesson-cache');
    console.log('🗑️ Cache cleared');
  }
}

export const cacheService = CacheService.getInstance();
