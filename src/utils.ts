export const sleep = async (ms: number) => {
	return new Promise(resolve => setTimeout(resolve, ms));
};

export const timeoutPromise = (t: number) => new Promise<null>(async (resolve) => {
	await sleep(t);
	resolve(null);
});

export const hash = (str: string) => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	return Math.abs(hash).toString(16);
};

export const ip2long = (ip: string) => {
    return ip.split(".").reduce((ipInt, octet) => {
        return (ipInt << 8) + parseInt(octet, 10);
    }, 0) >>> 0;
};