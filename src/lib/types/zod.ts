import type { ZodType } from "zod";

export class Zod<T> {
	public z: ZodType<T>;

	public constructor(z: ZodType<T>) {
		this.z = z;
	}

	public check(o: unknown, safe = true): o is T {
		if (safe) {
			return this.z.safeParse(o).success;
		}

		this.z.parse(o);
		return true;
	}

	public reason(o: unknown) {
		const result = this.z.safeParse(o);
		if (result.success) {
			return null;
		}

		return result.error.issues.map((issue) => issue.message).join("\n");
	}
};
