<script lang="ts">
    import { Content, Header, Panel } from "@smui-extra/accordion";
    import Button from "@smui/button";
    import IconButton, { Icon } from "@smui/icon-button";
    import Snackbar, { Actions, Label } from "@smui/snackbar";
    import type { SiteResults } from "./types/SiteAPIResponse";
    import { HOST } from "./const";
    import type { ServerAPIResponse } from "./types/ServerAPIResponse";

    export let result: SiteResults[0];

    let panelOpen = false;
    let snackbar: Snackbar;

    const country2emoji = (country: string) => {
        const codePoints = country.toUpperCase().split("").map((char) => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    }
    const formatIP = (ip: string) => {
        const [a, b, c, d] = ip.split(".");
        return `${a.padStart(3, "0")}.${b.padStart(3, " ")}.${c.padStart(3, " ")}.${d.padStart(3, " ")}`;
    };

    const download = async () => {
        const response = await fetch(`${HOST}/api/server/${result.server.ip}`)
        .then(async (res) => await res.json() as ServerAPIResponse);

        if (response.success) {
            // Trigger download
            const a = document.createElement("a");
            a.href = `data:application/octet-stream,${encodeURIComponent(response.data.config)}`;
            a.download = `${result.server.ip}.ovpn`;
            a.click();
        }
    }
</script>

<main>
    <Panel bind:open={panelOpen}>
        <Header>
            <span class="country">{country2emoji(result.server.country)}</span>
            <span class="ip">{formatIP(result.server.ip)}</span>
            <span class="duration">{result.result.duration}ms</span>
            <IconButton slot="icon" toggle pressed={panelOpen}>
                <Icon class="material-icons" on>expand_less</Icon>
                <Icon class="material-icons">expand_more</Icon>
            </IconButton>
        </Header>
        <Content>
            <div>Tested by: {result.tester}</div>
            <div>Tested at: {new Date(result.result.timestamp).toLocaleString()}</div>
            <Button on:click={() => {snackbar.open(); download()}} variant="raised">Download</Button>
        </Content>
    </Panel>
    <Snackbar bind:this={snackbar}>
        <Label>Downloading...</Label>
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