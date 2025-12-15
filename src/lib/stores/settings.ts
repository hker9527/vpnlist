import { writable } from "svelte/store";
import { Settings } from "../LocalStorage";
import type { Shape } from "../LocalStorage/migrations/latest";

function createSettingsStore() {
    const settingsManager = new Settings();
    const initialSettings = settingsManager.load();

    const { subscribe, set, update } = writable<Shape>(initialSettings);

    return {
        subscribe,
        set: (value: Shape) => {
            settingsManager.save(value);
            set(value);
        },
        update: (updater: (value: Shape) => Shape) => {
            update((current) => {
                const newValue = updater(current);
                settingsManager.save(newValue);
                return newValue;
            });
        },
        reset: () => {
            settingsManager.reset();
            set(settingsManager.load());
        }
    };
}

export const settings = createSettingsStore();
