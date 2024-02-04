const list: Record<string, string> = await (
    await fetch(
        "https://gist.githubusercontent.com/ssskip/5a94bfcd2835bf1dea52/raw/3b2e5355eb49336f0c6bc0060c05d927c2d1e004/ISO3166-1.alpha2.json"
    )
).json();

export class CountryCode {
    private _code: string;

    public constructor(code: string) {
        this._code = code;
    }

    public toFullName() {
        return this._code in list ? list[this._code] : this._code;
    }

    public toEmoji() {
        return this._code in list ? String.fromCodePoint(...this._code
            .toUpperCase()
            .split("")
            .map((char) => 127397 + char.charCodeAt(0))
        ) : "🏳️";
    }

    public toString() {
        return `${this.toEmoji()} ${this.toFullName()}`;
    }
}