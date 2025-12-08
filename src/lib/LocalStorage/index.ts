import { BaseMigration } from "./migrations";
import { type Shape, defaultSettings, Migration as Migration001 } from "./migrations/001_init";

const migrations = [
  new Migration001()
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

    let version = parseInt(_version, 10);
    let settings = JSON.parse(_settings);

    for (const migration of migrations) {
      if (migration.version > version) {
        settings = migration.up(settings);
        version = migration.version;
      }
    }

    this.#settings = settings;
    this.#save();
  }

  #save() {
    localStorage.setItem("version", migrations[migrations.length - 1].version.toString());
    localStorage.setItem("settings", JSON.stringify(this.#settings));
  }

  load(): Shape {
    return this.#settings;
  }

  save(settings: Shape) {
    this.#settings = settings;
    this.#save();
  }
};