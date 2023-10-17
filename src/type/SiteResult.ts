export type SiteResult = {
    success: true;
    site: string;
    duration: number;
} | {
    success: false;
    site: string;
};