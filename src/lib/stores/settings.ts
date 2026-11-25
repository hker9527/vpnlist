import { derived, readable, writable } from "svelte/store";
import { Settings } from "../LocalStorage";
import type { Shape } from "../LocalStorage/migrations/latest";
import { detectPlatform, resolvePlatform, type Platform } from "../downloadPreferences";

function createSettingsStore() {
    const settingsManager = new Settings();
    const initialSettings = settingsManager.load();

    const { subscribe, set, update } = writable<Shape>(initialSettings);
    const updateSettings = (updater: (value: Shape) => Shape) => {
        update((current) => {
            const newValue = updater(current);
            settingsManager.save(newValue);
            return newValue;
        });
    };

    return {
        subscribe,
        set: (value: Shape) => {
            settingsManager.save(value);
            set(value);
        },
        update: updateSettings,
        hasDownloadSettingsHint: () => settingsManager.hasDownloadSettingsHint(),
        dismissDownloadSettingsHint: () => settingsManager.dismissDownloadSettingsHint()
    };
}

export const settings = createSettingsStore();

export const detectedPlatform = readable<Platform>("other", (set) => {
    if (typeof navigator !== "undefined") {
        set(detectPlatform(navigator.userAgent, navigator.maxTouchPoints));
    }
});

export const selectedPlatform = derived([settings, detectedPlatform], ([$settings, $detectedPlatform]) =>
    resolvePlatform($settings.platform, $detectedPlatform)
);
