import { Service } from "@angular/core";

interface ReplayEvent {
    frame: number;
    key: string;
    type: 'down' | 'up';
}

export interface ActualInput {
    key: string;
    pressed: boolean;
    time: number;
}

@Service()
export class Renderer {
    private readonly blockSize = 16;
    private readonly inputs = [
        'w', '\u2423', 'a', 's', 'r'
    ];
    private readonly events: ReplayEvent[] = [
        { frame: 0, key: 'w', type: 'down' },
        { frame: 0, key: '\u2423', type: 'down' },
        { frame: 5, key: 'r', type: 'down' },
        { frame: 6, key: 'w', type: 'up' },
        { frame: 6, key: '\u2423', type: 'up' },
        { frame: 7, key: 's', type: 'down' },
        { frame: 8, key: 'a', type: 'down' },
        { frame: 8, key: '\u2423', type: 'down' },
        { frame: 9, key: 'r', type: 'up' },
        { frame: 15, key: 's', type: 'up' },
        { frame: 20, key: 'w', type: 'down' },
        { frame: 25, key: 'a', type: 'up' },
        { frame: 26, key: '\u2423', type: 'up' },
        { frame: 50, key: 'w', type: 'up' }
    ];

    public prepare(canvas: HTMLCanvasElement) {
        canvas.width = (this.inputs.length * 2 + 1) * this.blockSize;
        canvas.height = this.blockSize * (this.events[this.events.length - 1].frame + 1);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error("Failed to get canvas context");
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.initialRender(ctx);
    }

    private initialRender(ctx: CanvasRenderingContext2D) {
        for (let x = 0; x < this.inputs.length; x++) {
            ctx.strokeStyle = 'green';
            ctx.strokeRect(x * this.blockSize, 0, this.blockSize, this.blockSize);

            const size = ctx.measureText(this.inputs[x]);

            ctx.fillStyle = 'black';
            ctx.fillText(this.inputs[x], x * this.blockSize + this.blockSize / 2 - size.width / 2, 12);
        }
        for (let y = 1; y < this.events[this.events.length - 1].frame + 1; y++) {
            for (let x = 0; x < this.inputs.length; x++) {
                ctx.strokeStyle = 'grey';
                ctx.strokeRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
            }
        }

        const presedKeys = new Set<string>();
        for (let y = 1; y < this.events[this.events.length - 1].frame + 1; y++) {
            const eventsAtFrame = this.events.filter(event => event.frame === y - 1);
            for (const key of presedKeys) {
                const x = this.inputs.indexOf(key);
                ctx.fillStyle = 'lightgrey';
                ctx.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
            }
            for (const event of eventsAtFrame) {
                const x = this.inputs.indexOf(event.key);
                if (event.type === 'down') {
                    presedKeys.add(event.key);
                    ctx.fillStyle = 'orange';
                    ctx.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
                } else {
                    presedKeys.delete(event.key);
                    ctx.fillStyle = 'blue';
                    ctx.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
                }
            }
        }
        this.renderSecondGrid(ctx);
    }

    public render(canvas: HTMLCanvasElement, inputs: ActualInput[], timeSinceStart: number, fps: number) {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error("Failed to get canvas context");
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.initialRender(ctx);

        const xOffset = (this.inputs.length + 1) * this.blockSize;

        const activeActualInputs = new Map<string, ActualInput>();
        for (const input of inputs) {
            if (input.pressed) {
                if (activeActualInputs.has(input.key)) {
                    console.warn(`Duplicate pressed input for key: ${input.key}`);
                }
                activeActualInputs.set(input.key, input);
            } else {
                const startInput = activeActualInputs.get(input.key);
                if (!startInput) {
                    console.warn(`Received released input for key: ${input.key} without a corresponding pressed input`);
                    continue;
                }
                activeActualInputs.delete(input.key);

                ctx.fillStyle = 'grey';
                const x = xOffset + this.inputs.indexOf(input.key) * this.blockSize;
                const y = this.blockSize + startInput.time * fps / 1000 * this.blockSize;
                const height = (input.time - startInput.time) * fps / 1000 * this.blockSize;
                ctx.fillRect(x, y, this.blockSize, height);
            }
        }

        for (const input of activeActualInputs.values()) {
            ctx.fillStyle = 'grey';
            const x = xOffset + this.inputs.indexOf(input.key) * this.blockSize;
            const y = this.blockSize + input.time * fps / 1000 * this.blockSize;
            const height = (timeSinceStart - input.time) * fps / 1000 * this.blockSize;
            ctx.fillRect(x, y, this.blockSize, height);
        }

        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(0, this.blockSize + timeSinceStart * fps / 1000 * this.blockSize);
        ctx.lineTo(xOffset + this.inputs.length * this.blockSize, this.blockSize + timeSinceStart * fps / 1000 * this.blockSize);
        ctx.stroke();
    }

    private renderSecondGrid(ctx: CanvasRenderingContext2D) {
        const xOffset = (this.inputs.length + 1) * this.blockSize;

        for (let x = 0; x < this.inputs.length; x++) {
            ctx.strokeStyle = 'green';
            ctx.strokeRect(xOffset + x * this.blockSize, 0, this.blockSize, this.blockSize);

            const size = ctx.measureText(this.inputs[x]);

            ctx.fillStyle = 'black';
            ctx.fillText(this.inputs[x], xOffset + x * this.blockSize + this.blockSize / 2 - size.width / 2, 12);
        }
        for (let y = 1; y < this.events[this.events.length - 1].frame + 1; y++) {
            for (let x = 0; x < this.inputs.length; x++) {
                ctx.strokeStyle = 'grey';
                ctx.strokeRect(xOffset + x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
            }
        }
    }
}