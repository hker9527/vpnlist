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

    public async get(): Promise<{
        data: T,
        updatedAt: number
     } | null> {
        if (this.shouldUpdate()) {
            const status = await this.update();
            
            if (status) {
                return {
                    data: this.data!,
                    updatedAt: this.updatedAt!
                };
            }
        }

        return null;

    }

    public abstract update(): Promise<boolean>;
};