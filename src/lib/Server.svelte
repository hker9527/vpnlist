<script lang="ts">
    import { Content, Header, Panel } from "@smui-extra/accordion";
    import Button from "@smui/button";
    import IconButton, { Icon } from "@smui/icon-button";
    import Snackbar, { Actions, Label } from "@smui/snackbar";
    import { HOST } from "./const";
    import type { SiteResult } from "./types/api/SiteAPIResponse";
    import { ZServerAPIResponse, type ServerResult } from "./types/api/ServerAPIResponse";

    export let result: SiteResult[0];

    let panelOpen = false;
    let snackbar: Snackbar;

    const country2emoji = (country: string) => {
        const codePoints = country.toUpperCase().split("").map((char) => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    };

    const formatIP = (ip: string) => {
        const [a, b, c, d] = ip.split(".");
        return `${a.padStart(3, " ")}.${b.padStart(3, " ")}.${c.padStart(3, " ")}.${d.padStart(3, " ")}`;
    };

    let serverResult: ServerResult;

    const fetchServer = async () => {
        const res = await fetch(`${HOST}/api/server/${result.server.ip}`);
        const json = await res.json();
        if (ZServerAPIResponse.check(json)) {
            if (json.success) {
                serverResult = json.data;
            }
        } else {
            alert(ZServerAPIResponse.reason(json));
        }
    };    
    
    const formatTimeDiff = (from: number) => {
        const diff = Date.now() - from;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) {
            return `${days} day${days > 1 ? "s" : ""} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? "s" : ""} ago`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
        } else if (seconds > 0) {
            return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
        } else {
            return "Just now";
        }
    };

    const download = async () => {
        const a = document.createElement("a");
        a.href = `${HOST}/api/server/${result.server.ip}/config`;
        a.click();
    };
</script>

<main>
    <Panel on:click={fetchServer} bind:open={panelOpen}>
        <Header>
            <span class="country" title={result.server.country}>{country2emoji(result.server.country)}</span>
            <span class="ip">{formatIP(result.server.ip)}</span>
            <span class="duration">{result.result.duration}ms</span>
            <IconButton slot="icon" toggle pressed={panelOpen}>
                <Icon class="material-icons" on>expand_less</Icon>
                <Icon class="material-icons">expand_more</Icon>
            </IconButton>
        </Header>
        <Content>
            {#if serverResult}
                <div>Tested by: {result.tester}</div>
                <div>Tested at: {new Date(result.result.timestamp).toLocaleString()} ({formatTimeDiff(result.result.timestamp)})</div>
                <div>Server location: {serverResult.country} {serverResult.lat},{serverResult.lon}</div>
                <div>Server speed: {Math.round(serverResult.speed * 100) / 100} Mbps</div>
            {:else}
                <div class="loading">
                    <div class="loading__icon"></div>
                    <div class="loading__text">Loading...</div>
                </div>
            {/if}
            <Button on:click={() => {snackbar.open(); download()}} variant="raised">Download</Button>
        </Content>
    </Panel>
    <Snackbar bind:this={snackbar}>
        <Label>
            Downloading... If nothing happens, click <a href={`${HOST}/api/server/${result.server.ip}/config`}>here</a>.
        </Label>
        <Actions>
            <IconButton class="material-icons">close</IconButton>
        </Actions>
    </Snackbar>
</main>

<style>
    span.country, span.ip {
        padding-right: 2em;
    }
    
    span.ip {
        font-family: monospace;
        white-space: pre;
    }
</style>