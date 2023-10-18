export const long2ip = (ipInt: number) => {
    return [ipInt >>> 24, ipInt >> 16 & 255, ipInt >> 8 & 255, ipInt & 255]
    .map(a => a.toString().padStart(3, " "))
    .join(".");
}