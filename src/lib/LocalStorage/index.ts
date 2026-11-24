import { BaseMigration } from "./migrations";
import { Migration as Migration001 } from "./migrations/001_init";
import { Migration as Migration002 } from "./migrations/002_save_download_option";
import { Migration as Migration003 } from "./migrations/003_download_preferences";
import { type Shape, defaultSettings } from "./migrations/latest";

const downloadPreferencesMigration = new Migration003();
const downloadSettingsHintKey = `download-settings-hint-v${downloadPreferencesMigration.version}`;

const migrations = [
	new Migration001(),
	new Migration002(),
	downloadPreferencesMigration
] as BaseMigration[];

export class Settings {
	#settings!: Shape;

	constructor() {
		if (typeof localStorage === "undefined") {
			this.#settings = defaultSettings;
			return;
		}

		const _version = localStorage.getItem("version") ?? "0";
		const _settings = localStorage.getItem("settings") ?? "{}";

		const previousVersion = parseInt(_version, 10);
		let version = previousVersion;
		let settings = JSON.parse(_settings);

		for (const migration of migrations) {
			if (migration.version > version) {
				settings = migration.up(settings);
				version = migration.version;
			}
		}

		if (previousVersion >= 0 && previousVersion < downloadPreferencesMigration.version &&
			localStorage.getItem(downloadSettingsHintKey) === null) {
			localStorage.setItem(downloadSettingsHintKey, "pending");
		}

		this.#settings = settings;
		this.#save();
	}

	#save() {
		localStorage.setItem("version", migrations[migrations.length - 1].version.toString());
		localStorage.setItem("settings", JSON.stringify(this.#settings));
	}

	#reset() {
		localStorage.removeItem("version");
		localStorage.removeItem("settings");
	}

	load(): Shape {
		return this.#settings;
	}

	hasDownloadSettingsHint() {
		return typeof localStorage !== "undefined" &&
			localStorage.getItem(downloadSettingsHintKey) === "pending";
	}

	dismissDownloadSettingsHint() {
		localStorage.setItem(downloadSettingsHintKey, "seen");
	}

	save(settings: Shape) {
		this.#settings = settings;
		this.#save();
	}

	reset() {
		this.#settings = defaultSettings;
		this.#reset();
	}
};
