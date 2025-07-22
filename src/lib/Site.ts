export const list: Record<string, string> = {
    "uma": "Umamusume (Japanese)",
    "dmm": "DMM",
    "umag": "Umamusume (Global)"
};

export class Site {
    private _code: string;

    public constructor(code: string) {
        this._code = code;
    }

    public toFullName() {
        return this._code in list ? list[this._code] : this._code;
    }
}