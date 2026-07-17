import { AfterViewInit, Component, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { ActualInput, Renderer } from './renderer';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    class: 'absolute inset-0'
  }
})
export class App implements AfterViewInit, OnDestroy {
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  private readonly renderer = inject(Renderer)

  private readonly error = signal("");

  private readonly fps = 33.21;
  private lastFrame = 0;
  private intervalId: any;
  private destroyed = false;


  private started = false;
  private startTime = 0;
  private inputs: ActualInput[] = [];
  private readonly keysDown = new Set<string>();

  ngAfterViewInit() {
    const canvas = this.canvas()?.nativeElement;
    if (!canvas) {
      this.error.set("Canvas not found");
      return;
    }

    this.renderer.prepare(canvas);
    this.intervalId = setInterval(() => this.updateLoop(), 1000 / this.fps);
    window.requestAnimationFrame(this.renderLoop);
  }
  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private mapKeyCode(key: string): string | null {
    switch (key) {
      case 'w':
      case 'a':
      case 's':
      case 'r':
        return key;
      case ' ':
        return '\u2423';
    }
    // console.log(`Key ${key} is not mapped`);
    return null;
  }

  protected onKeydown(event: KeyboardEvent) {
    const time = performance.now();

    const key = this.mapKeyCode(event.key);
    if (!key) {
      return;
    }


    if (!this.started || time - this.startTime > this.fps * 75) {
      this.started = true;
      this.startTime = this.lastFrame;
      this.inputs = [];
      this.keysDown.clear();
    }

    if (this.keysDown.has(key)) {
      return;
    }

    this.keysDown.add(key);

    this.inputs.push({
      key: key,
      pressed: true,
      time: time - this.startTime,
    });

    // console.log(`Key: ${key}, Time: ${time}, Last frame: ${this.lastFrame}, Delta: ${time - this.lastFrame}`);
  }

  protected onKeyup(event: KeyboardEvent) {
    const time = performance.now();

    const key = this.mapKeyCode(event.key);
    if (!key) {
      return;
    }

    if (!this.keysDown.has(key)) {
      return;
    }
    this.keysDown.delete(key);

    if (!this.started) {
      return;
    }

    this.inputs.push({
      key: key,
      pressed: false,
      time: time - this.startTime,
    });
  }



  private updateLoop() {
    this.lastFrame = performance.now();
  }

  private renderLoop = () => {
    if (this.destroyed) {
      return;
    }

    const canvas = this.canvas()?.nativeElement;
    if (!canvas) {
      this.error.set("Canvas not found");
      return;
    }

    const now = performance.now();
    const sinceStart = now - this.startTime;

    this.renderer.render(canvas, this.inputs, sinceStart, this.fps);

    window.requestAnimationFrame(this.renderLoop);
  }
}
