/**
 * Scroll Scrub Video Engine
 * Ported from scroll-world skill (oso95/scroll-world)
 * MIT License - Adapted for The Ark Studio
 */

export interface ScrollScrubOptions {
  videoSrc: string;
  posterSrc?: string;
  container: HTMLElement;
  onProgress?: (progress: number) => void;
  reducedMotionFallback?: boolean;
}

interface FrameCache {
  [time: number]: Blob;
}

export class ScrollScrubVideo {
  private video: HTMLVideoElement;
  private container: HTMLElement;
  private videoSrc: string;
  private posterSrc?: string;
  private onProgress?: (progress: number) => void;
  private reducedMotionFallback: boolean;
  private frameCache: FrameCache = {};
  private isPlaying = false;
  private rafId: number | null = null;
  private targetTime = 0;
  private currentTime = 0;
  private duration = 0;
  private scrollHeight = 0;
  private startY = 0;
  private endY = 0;
  private prefersReducedMotion = false;

  constructor(options: ScrollScrubOptions) {
    this.container = options.container;
    this.videoSrc = options.videoSrc;
    this.posterSrc = options.posterSrc;
    this.onProgress = options.onProgress;
    this.reducedMotionFallback = options.reducedMotionFallback ?? true;
    this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.video = this.createVideoElement();
    this.init();
  }

  private createVideoElement(): HTMLVideoElement {
    const video = document.createElement("video");
    video.src = this.videoSrc;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    video.style.position = "absolute";
    video.style.top = "0";
    video.style.left = "0";
    video.style.zIndex = "0";
    video.style.opacity = this.prefersReducedMotion && this.reducedMotionFallback ? "0" : "1";
    video.setAttribute("aria-hidden", "true");
    return video;
  }

  private async init(): Promise<void> {
    this.container.style.position = "relative";
    this.container.style.overflow = "hidden";
    this.container.appendChild(this.video);

    if (this.posterSrc && this.prefersReducedMotion && this.reducedMotionFallback) {
      this.showPoster();
    }

    await this.waitForMetadata();
    this.duration = this.video.duration;
    this.setupScrollListener();
    this.setupResizeListener();
    this.startRenderLoop();
  }

  private waitForMetadata(): Promise<void> {
    return new Promise((resolve) => {
      if (this.video.readyState >= 1) {
        resolve();
      } else {
        this.video.addEventListener("loadedmetadata", () => resolve(), { once: true });
        this.video.load();
      }
    });
  }

  private showPoster(): void {
    if (!this.posterSrc) return;
    const poster = document.createElement("img");
    poster.src = this.posterSrc;
    poster.alt = "";
    poster.style.width = "100%";
    poster.style.height = "100%";
    poster.style.objectFit = "cover";
    poster.style.position = "absolute";
    poster.style.top = "0";
    poster.style.left = "0";
    poster.style.zIndex = "1";
    this.container.appendChild(poster);
  }

  private setupScrollListener(): void {
    const updateScrollBounds = () => {
      const rect = this.container.getBoundingClientRect();
      this.startY = rect.top + window.scrollY;
      this.endY = this.startY + rect.height;
      this.scrollHeight = rect.height;
    };

    updateScrollBounds();
    window.addEventListener("scroll", updateScrollBounds, { passive: true });
    window.addEventListener("resize", updateScrollBounds, { passive: true });
  }

  private setupResizeListener(): void {
    const handleResize = () => {
      updateScrollBounds();
    };
    window.addEventListener("resize", handleResize, { passive: true });
  }

  private startRenderLoop(): void {
    const tick = () => {
      this.updateTargetTime();
      this.interpolateTime();
      this.seekVideo();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private updateTargetTime(): void {
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const containerCenter = this.startY + this.scrollHeight / 2;
    const scrollCenter = scrollY + viewportHeight / 2;
    const distance = scrollCenter - containerCenter;
    const maxDistance = viewportHeight / 2 + this.scrollHeight / 2;
    const progress = Math.max(0, Math.min(1, 0.5 - distance / (maxDistance * 2)));
    this.targetTime = progress * this.duration;
    this.onProgress?.(progress);
  }

  private interpolateTime(): void {
    const easing = 0.15;
    this.currentTime += (this.targetTime - this.currentTime) * easing;
    if (Math.abs(this.targetTime - this.currentTime) < 0.001) {
      this.currentTime = this.targetTime;
    }
  }

  private async seekVideo(): Promise<void> {
    if (this.prefersReducedMotion && this.reducedMotionFallback) return;

    const target = Math.max(0, Math.min(this.duration, this.currentTime));
    if (Math.abs(this.video.currentTime - target) > 0.05) {
      try {
        this.video.currentTime = target;
      } catch (e) {
        // Ignore seek errors during rapid scrolling
      }
    }
  }

  public destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.video.pause();
    this.video.src = "";
    this.video.remove();
    this.frameCache = {};
  }

  public getProgress(): number {
    return this.currentTime / this.duration;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }
}

/**
 * Hook for React/Preact islands
 */
export function useScrollScrub(videoSrc: string, posterSrc?: string) {
  // This would be used in a React island component
  // For Astro, we use the class directly in a client:load script
}