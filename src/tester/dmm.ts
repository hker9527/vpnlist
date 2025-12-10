import assert from "assert-ts";
import { Builder, until } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox";
import { Tester } from ".";
import { debug, error } from "../Reporting";
import { SiteResult } from "../type/SiteResult";
import { LoginResponseSchema } from "../type/api/loginurl";
import { userInfoResponseSchema } from "../type/api/userinfo";
import { AccessTokenResponseSchema, type AccessTokenResponse } from "../type/api/accesstoken";

export class DMMTester extends Tester {
    private retryCount = 0;
    private session = {
        access_token: ""
    };

    private readonly HEADERS = [
        "Connection: keep-alive",
        "User-Agent: DMMGamePlayer5-Win/5.3.25 Electron/34.3.0",
        "Client-App: DMMGamePlayer5",
        "Client-Version: 5.3.25",
        "Sec-Fetch-Site: none",
        "Sec-Fetch-Mode: no-cors",
        "Sec-Fetch-Dest: empty",
        "Accept-Encoding: gzip, deflate, br, zstd",
        "Accept-Language: ja",
        "Priority: u=1, i"
    ];
    
    public async init(): Promise<boolean> {
        // Try to read session cache
        const sessionFile = Bun.file("./session.json");
        try {
            const json = await sessionFile.json() as typeof this.session;
            this.session.access_token = json.access_token;

            // Validate session
            const result = await this.fetchJson({
                url: "https://apidgp-gameplayer.games.dmm.com/v5/userinfo",
                schema: userInfoResponseSchema,
                argv: [
                    "-X", "POST",
                    ...this.HEADERS.flatMap(h => ["-H", h]),
                    "-H", `actauth: ${this.session.access_token}`,
                    "-H", "Cookie: age_check_done=0"
                ]
            });

            assert(result !== null, "Failed to validate session");
            assert([100, 803].includes(result.response.result_code), `Session invalid: ${result.response.result_code}`);

            debug("main", "Loaded session from cache");
            return true;
        } catch (e) {
            debug("main", `Failed to load session from cache: ${e}`);
        }

        // Obtain login url
        const loginObject = await this.fetchJson({
            url: "https://apidgp-gameplayer.games.dmm.com/v5/auth/login/url",
            schema: LoginResponseSchema,
            argv: [
                "-X", "POST",
                ...this.HEADERS.flatMap(h => ["-H", h]),
                "-H", "Content-Type: application/json",
                "-d", JSON.stringify({ prompt: "" }),
                "-H", "Cookie: age_check_done=0"
            ]
        });

        assert(loginObject !== null, "Failed to obtain login url");
        assert(loginObject.response.error === null, `Error code ${loginObject.response.result_code}: ${loginObject.response.error}`);

        const loginUrl = loginObject.response.data.url;

        // Setup selenium
        const driver = await new Builder()
            .forBrowser("firefox")
            .setFirefoxOptions(new firefox.Options().headless())
            .build();

        let code: string | undefined;

        try {
            // Simulate login
            await driver.get(loginUrl);
            await driver.findElement({ id: "login_id" }).sendKeys(Bun.env.DMM_USER!);
            await driver.findElement({ id: "password" }).sendKeys(Bun.env.DMM_PASS!);
            await driver.findElement({ xpath: '//button[@type="submit"]' }).then(element => driver.executeScript("arguments[0].click();", element));

            // Wait for redirect
            await driver.wait(until.urlContains("login/success"), 20000);
            const currentUrl = await driver.getCurrentUrl();
            const url = new URL(currentUrl);
            code = url.searchParams.get("code") || undefined;
        } catch (e) {
            error("main", `Selenium error: ${e}`);
            throw e;
        } finally {
            // Close selenium
            await driver.quit();
        }

        if (!code) {
            error("main", "Failed to extract code");
            return false;
        }

        // Exchange code for access token
        const tokenObject = await this.fetchJson<AccessTokenResponse>({
            url: "https://apidgp-gameplayer.games.dmm.com/v5/auth/accesstoken/issue",
            schema: AccessTokenResponseSchema,
            argv: [
                "-X", "POST",
                ...this.HEADERS.flatMap(h => ["-H", h]),
                "-H", "Content-Type: application/json",
                "-d", JSON.stringify({ code }),
                "-H", "Cookie: age_check_done=0"
            ]
        });

        assert(tokenObject !== null, "Failed to obtain access token");
        assert(tokenObject.response.error === null, `Error code ${tokenObject.response.result_code}: ${tokenObject.response.error}`);

        this.session.access_token = tokenObject.response.data.access_token;

        await Bun.write(sessionFile, JSON.stringify(this.session));
        return true;
    }

    public async test(device: string): Promise<SiteResult> {
        const result = await this.fetchJson({
            url: "https://apidgp-gameplayer.games.dmm.com/v5/userinfo",
            schema: userInfoResponseSchema,
            argv: [
                "--interface", device,
                "-X", "POST",
                ...this.HEADERS.flatMap(h => ["-H", h]),
                "-H", `actauth: ${this.session.access_token}`,
                "-H", "Cookie: age_check_done=0"
            ]
        });

        if (result) {
            switch (result?.response.result_code) {
                case 100:
                    return {
                        site: "dmm",
                        success: true,
                        duration: result.time_connect
                    };
                case 203:
                    debug(this.constructor.name, `Session invalid`);
                    await this.init();
                    this.retryCount++;

                    if (this.retryCount > 3) {
                        error(this.constructor.name, `Failed to refresh session after 3 attempts`);
                        break;
                    }
                    return this.test(device);
                case 803:
                    debug(this.constructor.name, `Blocked`);
                    break;
                default:
                    error(this.constructor.name, `Unexpected result code ${result.response.result_code}: ${result.response.error}`);
                    break;
            }
        }

        return {
            site: "dmm",
            success: false
        };
    }
};