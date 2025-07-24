export const generateDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();

    return `${year}${month.toString().padStart(2, "0")}${date.toString().padStart(2, "0")}-${hour.toString().padStart(2, "0")}${minute.toString().padStart(2, "0")}${second.toString().padStart(2, "0")}`;
};