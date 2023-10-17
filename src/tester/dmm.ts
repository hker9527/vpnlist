import assert from "assert-ts";
import { Builder } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox";
import { Tester } from ".";
import { debug, error } from "../Reporting";
import { SiteResult } from "../type/SiteResult";
import { LoginResponseSchema } from "../type/api/loginurl";
import { userInfoResponseSchema } from "../type/api/userinfo";

export class DMMTester extends Tester {
    private cookies = {
        login_session_id: "",
        login_secure_id: ""
    };
    
    public async init(): Promise<boolean> {
        // Try to read session cache
        const sessionFile = Bun.file("./session.json");
        try {
            const json = await sessionFile.json() as typeof this.cookies;
            this.cookies.login_session_id = json.login_session_id;
            this.cookies.login_secure_id = json.login_secure_id;

            // Validate session
            const result = await this.fetchJson({
                url: "https://apidgp-gameplayer.games.dmm.com/v5/userinfo",
                schema: userInfoResponseSchema,
                argv: [
                    "-X", "POST",
                    "-H", `Cookie: login_session_id=${this.cookies.login_session_id};login_secure_id=${this.cookies.login_secure_id}}`
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
        const loginObject = await fetch("https://apidgp-gameplayer.games.dmm.com/v5/loginurl")
            .then(res => res.json())
            .then(json => LoginResponseSchema.parse(json))
            .catch(() => undefined);

        assert(loginObject !== undefined, "Failed to obtain login url");
        assert(loginObject.error === null, `Error code ${loginObject.result_code}: ${loginObject.error}`);

        const loginUrl = loginObject.data.url;

        // Setup selenium
        const driver = await new Builder()
            .forBrowser("firefox")
            .setFirefoxOptions(new firefox.Options().headless())
            .build();

        // Simulate login
        await driver.get(loginUrl);
        await driver.findElement({ id: "login_id" }).sendKeys(process.env.DMM_USER!);
        await driver.findElement({ id: "password" }).sendKeys(process.env.DMM_PASS!);
        await driver.findElement({ xpath: '//input[@data-e2e="login_button"]' }).then(element => element.click());

        // Extract cookie
        for (let i = 0; i < 10; i++) {
            let flag1 = false;
            let flag2 = false;
            await driver.manage().getCookies().then(_cookies => {
                for (const cookie of _cookies) {
                    if (cookie.name === "login_session_id") {
                        this.cookies.login_session_id = cookie.value;
                        flag1 = true;
                    } else if (cookie.name === "login_secure_id") {
                        this.cookies.login_secure_id = cookie.value;
                        flag2 = true;
                    }
                }
            });

            if (flag1 && flag2) {
                break;
            }

            await Bun.sleep(1000);
        }

        // Close selenium
        await driver.quit();

        if (this.cookies.login_session_id === "" || this.cookies.login_secure_id === "") {
            error("main", "Failed to extract cookies");
            return false;
        }

        await Bun.write(sessionFile, JSON.stringify(this.cookies));
        return true;
    }

    public async test(device: string): Promise<SiteResult> {
        const result = await this.fetchJson({
            url: "https://apidgp-gameplayer.games.dmm.com/v5/userinfo",
            schema: userInfoResponseSchema,
            argv: [
                "--interface", device,
                "-X", "POST",
                "-H", `Cookie: login_session_id=${this.cookies.login_session_id};login_secure_id=${this.cookies.login_secure_id}}`
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