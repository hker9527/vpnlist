export type APIResponse<T> = {
    success: true;
    data: T;
} | {
    success: false;
    data: null;
};