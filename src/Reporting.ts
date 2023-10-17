const debugFlag = !!process.env.DEBUG;

const pad = 32;

export const debug = (tag: string, e: unknown) => {
	if (debugFlag) console.debug(`D: ${`[${tag}]`.padEnd(pad, " ")}${e}`);
};

export const error = (tag: string, e: unknown) => {
	console.error(`E: ${`[${tag}]`.padEnd(pad, " ")}${e}`);
};

export const log = (tag: string, e: unknown) => {
	console.log(`L: ${`[${tag}]`.padEnd(pad, " ")}${e}`);
};
