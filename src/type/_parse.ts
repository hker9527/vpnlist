import { ZodType } from "zod";

export const zparse = <T>(z: ZodType<T>, data: unknown): T | null => {
	const result = z.safeParse(data);
	if (result.success) {
		return result.data;
	}
	return null;
};