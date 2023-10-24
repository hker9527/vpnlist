export abstract class Cache<T> {
    protected data: T | null = null;
    protected updatedAt: number | null = null;
    private interval: number;

    public constructor(interval?: number) {
        this.interval = interval ?? 1000 * 60 * 60;
    }

    public shouldUpdate(): boolean {
        return !this.updatedAt || Date.now() - this.updatedAt > this.interval;
    }

    public async get(): Promise<T | null> {
        if (this.shouldUpdate()) {
            await this.update();
        }

        return this.data;
    }

    public abstract update(): Promise<boolean>;
};