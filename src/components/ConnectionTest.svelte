<script lang="ts">
    import { compareSplitRoute, maskIp, parseIpTrace } from "@lib/ipTrace";
    import Button from "@smui/button";
    import IconButton, { Icon } from "@smui/icon-button";
    import Tab, { Label } from "@smui/tab";
    import TabBar from "@smui/tab-bar";
    import { onDestroy } from "svelte";

    const apiScenarios = [
        {
            label: "Not Found (404)",
            meaning: "The game may still work. The server answered this check; open Umamusume and try logging in.",
        },
        {
            label: "Access Denied (403)",
            meaning: "The browser was blocked, not necessarily the game. If Umamusume also can’t connect, try another VPN server.",
        },
    ];
    const targets = [
        {
            id: "jp",
            label: "Umamusume JP",
            url: "https://api.games.umamusume.jp/",
            sandbox: "",
            previewHint: "Check whether the JP game API responds. This doesn’t test login.",
            scenarios: apiScenarios,
        },
        {
            id: "global",
            label: "Umamusume Global",
            url: "https://api.games.umamusume.com/",
            sandbox: "",
            previewHint: "Check whether the Global game API responds. This doesn’t test login.",
            scenarios: apiScenarios,
        },
        {
            id: "dmm",
            label: "DMM TV",
            url: "https://tv.dmm.com/vod/",
            sandbox: "allow-scripts allow-same-origin",
            previewHint: "Check whether the DMM TV catalog loads. This doesn’t test DMM Game Player login.",
            scenarios: [
                {
                    label: "Catalog loads",
                    meaning: "DMM TV browsing works, but that doesn’t tell you if your game will run. Launch it in DMM Game Player to check.",
                },
                {
                    label: "Region restriction",
                    meaning: "DMM TV is blocked on this connection, but your game may still work. Try it in DMM Game Player. To recheck DMM TV, reconnect with a fresh Japan split profile.",
                },
            ],
        },
    ];

    const probes = [
        { label: "Website IP", host: "umavpn.top" },
        { label: "Split-route IP", host: "www.gco.gov.qa" },
    ];
    const outcomes = {
        different: "The probes used different IPv4 exits, consistent with split tunneling.",
        same: "Inconclusive: both probes reported the same IP.",
        ipv6: "Inconclusive: both results must be IPv4 to check the split route.",
        unavailable: "Inconclusive: one or both probes were unavailable.",
    };

    let selected = targets[0];
    let tested: (typeof targets)[number] | undefined;
    let run = 0;
    $: if (tested && tested !== selected) tested = undefined;

    let ipResults: { label: string; trace: ReturnType<typeof parseIpTrace> }[] | undefined;
    let ipRequest: AbortController | undefined;
    let showIps = false;
    $: outcome = ipResults && compareSplitRoute(ipResults[0]?.trace, ipResults[1]?.trace);

    let probeInfoHovered = false;
    let probeInfoFocused = false;
    let probeInfoDismissed = false;
    $: showProbeInfo = !probeInfoDismissed && (probeInfoHovered || probeInfoFocused);

    function runTest() {
        tested = selected;
        run += 1;
    }

    async function fetchTrace(host: string, signal: AbortSignal) {
        try {
            const response = await fetch(`https://${host}/cdn-cgi/trace`, {
                cache: "no-store",
                credentials: "omit",
                referrerPolicy: "no-referrer",
                signal,
            });
            return response.ok ? parseIpTrace(await response.text()) : undefined;
        } catch {
            return undefined;
        }
    }

    async function testSplitRoute() {
        if (ipRequest) return;
        const request = new AbortController();
        ipRequest = request;
        ipResults = undefined;
        showIps = false;

        const timeout = setTimeout(() => request.abort(), 10000);
        try {
            const results = await Promise.all(probes.map(async ({ label, host }) => ({
                label,
                trace: await fetchTrace(host, request.signal),
            })));
            if (ipRequest === request) ipResults = results;
        } finally {
            clearTimeout(timeout);
            if (ipRequest === request) ipRequest = undefined;
        }
    }

    onDestroy(() => {
        const request = ipRequest;
        ipRequest = undefined;
        request?.abort();
    });
</script>

<svelte:window on:keydown={(event) => {
    if (event.key === "Escape" && showProbeInfo) probeInfoDismissed = true;
}} />

<section class="connection-test" aria-label="Connection diagnostics">
    <div class="checks">
        <div class="game-check">
            <h2>Site access</h2>
            <TabBar tabs={targets} let:tab bind:active={selected} aria-label="Connection test site">
                <Tab {tab} id="connection-tab-{tab.id}" aria-controls="connection-test-panel">
                    <Label>{tab.label}</Label>
                </Tab>
            </TabBar>

            <div id="connection-test-panel" role="tabpanel" aria-labelledby="connection-tab-{selected.id}">
                <p>This test connects directly to the selected site from your browser.</p>
                <div class="actions">
                    <Button variant="outlined" on:click={runTest}>Check site access</Button>
                    <Button href={selected.url} target="_blank" rel="noopener noreferrer">Open in new tab</Button>
                </div>

                <div class="game-preview">
                    {#if tested}
                        {#key run}
                            <iframe
                                src={tested.url}
                                title={`${tested.label} connection test`}
                                sandbox={tested.sandbox}
                                referrerpolicy="no-referrer"
                            ></iframe>
                        {/key}
                    {:else}
                        <div class="preview-placeholder">{selected.previewHint}</div>
                    {/if}
                </div>
                <ul class="preview-guide" aria-label="How to read the preview">
                    {#each selected.scenarios as { label, meaning }}
                        <li><strong>{label}:</strong> {meaning}</li>
                    {/each}
                    <li><strong>Blank preview:</strong> This doesn’t mean the game is blocked. Try <strong>Open in new tab</strong> or launch the game directly.</li>
                    <li><strong>Connection error or timeout:</strong> This check couldn’t tell. Make sure the VPN is connected, then try the game.</li>
                </ul>
            </div>
        </div>

        <div class="ip-check">
            <h2>Advanced: split tunneling</h2>
            <div class="actions ip-actions">
                <Button variant="outlined" on:click={testSplitRoute} disabled={Boolean(ipRequest)}>
                    {ipResults ? "Test split tunnel again" : "Test split tunnel"}
                </Button>
                <div
                    on:pointerenter={(event) => {
                        if (event.pointerType !== "mouse") return;
                        probeInfoHovered = true;
                        probeInfoDismissed = false;
                    }}
                    on:pointerleave={() => (probeInfoHovered = false)}
                >
                    <IconButton
                        aria-label="About the split tunnel test"
                        aria-describedby="split-tunnel-info"
                        size="button"
                        on:focus={() => {
                            probeInfoFocused = true;
                            probeInfoDismissed = false;
                        }}
                        on:blur={() => (probeInfoFocused = false)}
                        on:click={(event) => {
                            if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus();
                            probeInfoDismissed = false;
                        }}
                    >
                        <Icon class="material-icons" aria-hidden="true">info_outline</Icon>
                    </IconButton>
                    <div id="split-tunnel-info" class="probe-tooltip" role="tooltip" hidden={!showProbeInfo}>
                        Use a newly downloaded split profile. This test contacts {probes[0].host}
                        and {probes[1].host} (Qatar’s Government Communications Office).
                        Cloudflare may log your public IP. The test does not show the IP the game sees.
                    </div>
                </div>
                {#if ipResults?.some(({ trace }) => trace)}
                    <IconButton
                        toggle
                        bind:pressed={showIps}
                        aria-label="Show full IP addresses"
                        title="Show or hide full IP addresses"
                        size="button"
                    >
                        <Icon class="material-icons" aria-hidden="true" on>lock_open</Icon>
                        <Icon class="material-icons" aria-hidden="true">lock</Icon>
                    </IconButton>
                {/if}
            </div>
            <div role="status">
                {#if ipRequest}
                    Checking both routes…
                {:else if ipResults && outcome}
                    <dl>
                        {#each ipResults as { label, trace }}
                            <div>
                                <dt>{label}</dt>
                                <dd>
                                    {#if trace}
                                        <code>{showIps ? trace.ip : maskIp(trace.ip)}</code>
                                        {#if trace.country}<span>{trace.country}</span>{/if}
                                    {:else}
                                        Unavailable
                                    {/if}
                                </dd>
                            </div>
                        {/each}
                    </dl>
                    <p>{outcomes[outcome]}</p>
                {/if}
            </div>
        </div>
    </div>
</section>

<style>
    .connection-test {
        padding: 0.25rem 1rem 1rem;
    }

    h2 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
    }

    .checks {
        display: grid;
        gap: 1rem;
    }

    .game-check,
    .ip-check {
        min-width: 0;
    }

    .game-check :global(.mdc-tab-scroller__scroll-content) {
        min-inline-size: 0;
        flex-basis: 0;
    }

    .game-check :global(.mdc-tab) {
        flex: 1 1 0;
        min-inline-size: 0;
        padding-inline: 0.25rem;
        letter-spacing: normal;
        text-transform: none;
        white-space: normal;
    }

    .game-check :global(.mdc-tab__text-label) {
        overflow-wrap: anywhere;
        line-height: 1.2;
    }

    .ip-check {
        padding-block-start: 1rem;
        border-block-start: 1px solid color-mix(in srgb, currentColor 25%, transparent);
    }

    .actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.375rem;
    }

    .ip-actions {
        position: relative;
    }

    .probe-tooltip {
        position: absolute;
        z-index: 1;
        inset-block-start: 100%;
        inset-inline-start: 0;
        box-sizing: border-box;
        inline-size: max-content;
        max-inline-size: min(100%, 22rem);
        padding: 0.5rem 0.75rem;
        border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
        border-radius: 4px;
        color-scheme: light dark;
        background: Canvas;
        color: CanvasText;
        font-size: 0.875rem;
    }

    p,
    dl,
    [role="status"] {
        font-size: 0.875rem;
    }

    p {
        margin: 0.5rem 0;
    }

    dl {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.25rem 0.5rem;
        margin: 0.5rem 0;
    }

    dd {
        margin: 0;
        overflow-wrap: anywhere;
    }

    dd code {
        color: inherit;
    }

    dd span {
        display: block;
    }

    .game-preview {
        box-sizing: border-box;
        height: 14rem;
        margin-block-start: 0.75rem;
        border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
        border-radius: 4px;
        overflow: hidden;
    }

    .preview-placeholder {
        display: grid;
        place-items: center;
        height: 100%;
        box-sizing: border-box;
        padding: 1rem;
        font-size: 0.875rem;
        text-align: center;
    }

    iframe {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
        background: #fff;
    }

    .preview-guide {
        margin: 0.5rem 0 0;
        padding-inline-start: 1.25rem;
        font-size: 0.875rem;
    }

    .preview-guide li + li {
        margin-block-start: 0.25rem;
    }

    @media (min-width: 640px) {
        .checks {
            grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
        }

        .ip-check {
            padding-block-start: 0;
            padding-inline-start: 1rem;
            border-block-start: 0;
            border-inline-start: 1px solid color-mix(in srgb, currentColor 25%, transparent);
        }
    }
</style>
