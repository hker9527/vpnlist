<script lang="ts">
    import { HOST } from "@lib/const";
    import {
        ZServerAPIResponse,
        type ServerResult,
    } from "@lib/types/api/ServerAPIResponse";
    import { Content, Header, Panel } from "@smui-extra/accordion";
    import Button from "@smui/button";
    import IconButton, { Icon } from "@smui/icon-button";
    import List, { Item, PrimaryText, SecondaryText, Separator, Text } from "@smui/list";
    import Menu, { SelectionGroup, SelectionGroupIcon } from "@smui/menu";
    import Snackbar, { Actions, Label } from "@smui/snackbar";
    import type { Map } from "leaflet";
    import "leaflet/dist/leaflet.css";
    import { CountryCode } from "../lib/CountryCode";
    import type { SiteResult } from "../lib/types/api/SiteAPIResponse";

    export let result: SiteResult[0];

    let panelOpen = false;
    let snackbar: Snackbar;
    let map: Map;

    const formatIP = (ip: string) => {
        const [a, b, c, d] = ip.split(".");
        return `${a.padStart(3, " ")}.${b.padStart(3, " ")}.${c.padStart(
            3,
            " "
        )}.${d.padStart(3, " ")}`;
    };

    let serverResult: ServerResult;

    const fetchServer = async () => {
        if (serverResult) return;

        const res = await fetch(`${HOST}/api/server/${result.ip}`);
        const json = await res.json();
        if (ZServerAPIResponse.check(json)) {
            if (json.success) {
                serverResult = json.data;
                await initMap();
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

    let variant = "current";
    let split = false;
    const getDownloadLink = () => {
        return `${HOST}/api/server/${
            result.ip
        }/config?variant=${variant}${split ? "&split" : ""}`;
    };

    const initMap = async () => {
        if (map) return;

        const l = await import("leaflet");
        const L = l.default;

        map = L.map("map-" + result.ip, {
            center: [serverResult.lat, serverResult.lon],
            zoom: 6,
            scrollWheelZoom: false,
        });

        L.tileLayer("https://{s}.tile.osm.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution:
                'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        }).addTo(map);

        L.marker([serverResult.lat, serverResult.lon], {
            icon: L.icon({
                iconUrl:
                    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
                shadowUrl:
                    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
            }),
        }).addTo(map);
    };

    let menu: Menu;
</script>

<main>
    <Panel on:click={fetchServer} bind:open={panelOpen}>
        <Header>
            <span class="country" title={new CountryCode(result.country).toFullName()}>
                {new CountryCode(result.country).toEmoji()}
            </span>
            <span class="ip pr-2">{formatIP(result.ip)}</span>
            <span class="duration">{result.duration}ms</span>
            <IconButton slot="icon" toggle pressed={panelOpen}>
                <Icon class="material-icons" on>expand_less</Icon>
                <Icon class="material-icons">expand_more</Icon>
            </IconButton>
        </Header>
        <Content>
            {#if serverResult}
                <div class="row">
                    <div class="col-12 col-md-6">
                        <div>
                            Tested at: {new Date(
                                result.timestamp
                            ).toLocaleString()} ({formatTimeDiff(
                                +new Date(result.timestamp)
                            )})
                        </div>
                        <div>
                            ISP: <a
                                href="https://ipinfo.io/{serverResult.asn.id}"
                                target="_blank">{serverResult.asn.id}</a
                            >
                            {serverResult.asn.name}
                        </div>
                        <div>
                            Speed: {Math.round(serverResult.speed * 100) / 100} Mbps
                        </div>
                    </div>
                    <div class="col-12 col-md-6">
                        <div id="map-{result.ip}" class="map my-2" />
                    </div>
                </div>
                <div>
                    <Button
                        on:click={() => {
                            menu.setOpen(true);
                        }}
                        variant="raised">Download</Button
                    >
                    <Menu bind:this={menu}>
                        <List>
                            <SelectionGroup>
                                {#each [
                                    {
                                        type: "beta",
                                        requirement: ">2.7.0",
                                    },
                                    {
                                        type: "current",
                                        requirement: "2.6.0 - 2.6.9",
                                    },
                                    {
                                        type: "legacy",
                                        requirement: "<2.6.0"
                                    }
                                ] as thing (thing.type)}
                                    <Item
                                        on:SMUI:action={() => {
                                            variant = thing.type;
                                        }}
                                        selected={thing.type === variant}
                                    >
                                        <SelectionGroupIcon>
                                            <i class="material-icons">check</i>
                                        </SelectionGroupIcon>
                                        <Text>
                                            <PrimaryText>
                                                { thing.type.charAt(0).toUpperCase() + thing.type.slice(1) }
                                            </PrimaryText>
                                            <SecondaryText>
                                                Version { thing.requirement }
                                            </SecondaryText>
                                        </Text>
                                    </Item>
                                {/each}
                            </SelectionGroup>
                            <Separator />
                            <SelectionGroup>
                                {#each [false, true] as _split}
                                    <Item
                                        on:SMUI:action={() => {
                                            split = _split;
                                        }}
                                        selected={_split === split}
                                    >
                                        <SelectionGroupIcon>
                                            <i class="material-icons">check</i>
                                        </SelectionGroupIcon>
                                        <Text>
                                            <PrimaryText>
                                                {_split
                                                    ? "Split tunneling"
                                                    : "Original"}
                                            </PrimaryText>
                                            <SecondaryText>
                                                {_split
                                                    ? "Only works on Windows"
                                                    : "Cross-platform"}
                                            </SecondaryText>
                                        </Text>
                                    </Item>
                                {/each}
                            </SelectionGroup>
                            <Separator />
                            <Item on:SMUI:action={() => {
                                snackbar.open();
                                const link = getDownloadLink();
                                const a = document.createElement("a");
                                a.href = link;
                                a.click();
                            }}>
                                <SelectionGroupIcon>
                                    <i class="material-icons">file_download</i>
                                </SelectionGroupIcon>
                                <Text>Download</Text>
                            </Item>
                            <Item on:SMUI:action={() => {
                                snackbar.open();
                                const link = getDownloadLink();
                                const a = document.createElement("a");
                                a.href = `openvpn://import-profile/${link}`;
                                a.click();
                            }}>
                                <SelectionGroupIcon>
                                    <i class="material-icons">android</i>
                                </SelectionGroupIcon>
                                <Text>Open in app</Text>
                            </Item>
                        </List>
                    </Menu>
                </div>
            {:else}
                <div class="d-flex align-items-center my-2">
                    <strong role="status">Loading...</strong>
                    <div class="spinner-border ms-auto" aria-hidden="true"></div>
                </div>
            {/if}
        </Content>
    </Panel>
    <Snackbar bind:this={snackbar}>
        <Label>
            Downloading... If nothing happens, click <a
                href={getDownloadLink()}>here</a
            > to manually download.
        </Label>
        <Actions>
            <IconButton class="material-icons">close</IconButton>
        </Actions>
    </Snackbar>
</main>

<style>
    span.ip {
        font-family: monospace;
        white-space: pre;
    }

    div.map {
        height: 200px;
        z-index: 0;
    }
</style>
