<script lang="ts">
    import DataTable, {
        Head,
        Body,
        Row,
        Cell,
        Label,
        SortValue,
    } from "@smui/data-table";
    import IconButton from "@smui/icon-button";
    import LinearProgress from "@smui/linear-progress";
    import { topojson, ChoroplethChart } from "chartjs-chart-geo";
    import { Chart } from "chart.js/auto";
    import type { Feature, Geometry } from "geojson";
    import { onMount } from "svelte";
    import { HOST } from "~/lib/const";
    import { CountryCode } from "~/lib/CountryCode";
    import SitePicker from "~/lib/SitePicker.svelte";
    import {
        ZStatAPIResponse,
        type StatResult,
    } from "~/lib/types/api/StatAPIResponse";

    let sort: keyof StatResult[number] = "success";
    let sortDirection: Lowercase<keyof typeof SortValue> = "descending";

    let result: (StatResult[number] & {
        total: number;
        successRate: number;
    })[] = [];

    Chart.register();

    const fetchStat = async (site = "uma") => {
        result = [];

        const res = await fetch(`${HOST}/api/stat/${site}/countries`);
        const json = await res.json();
        if (ZStatAPIResponse.check(json)) {
            if (json.success) {
                result = json.data.map((d) => ({
                    ...d,
                    total: d.success + d.fail,
                    successRate: (d.success / (d.success + d.fail)) * 100,
                }));
            } else {
                prompt(
                    "Failed to fetch data from the server.\nServer response:",
                    JSON.stringify(json),
                );
            }
        } else {
            alert(ZStatAPIResponse.reason(json));
        }
    };

    const onSort = () => {
        result?.sort((r1, r2) => {
            const v1 =
                sort === "country"
                    ? new CountryCode(r1.country).toFullName()
                    : r1[sort];
            const v2 =
                sort === "country"
                    ? new CountryCode(r2.country).toFullName()
                    : r2[sort];
            if (v1 === v2) return 0;
            if (sortDirection === "ascending") {
                return v1 < v2 ? -1 : 1;
            } else {
                return v1 < v2 ? 1 : -1;
            }
        });

        result = result;
    };

    let countries: Feature<Geometry, { name: string }>[];
    let map: HTMLCanvasElement;
    let chart: ChoroplethChart;

    const renderData = async () => {
        if (chart) {
            chart.destroy();
        }

        if (!countries) {
            const res = await fetch(
                "https://unpkg.com/world-atlas/countries-50m.json",
            );
            const world = await res.json();
            countries = topojson.feature(
                world,
                world.objects.countries as {
                    type: "GeometryCollection";
                    geometries: {
                        type: "Polygon";
                        arcs: any[];
                        id: string;
                        properties: {
                            name: string;
                        };
                    }[];
                },
            ).features;
        }

        const data = countries.map((feature) => ({
            feature,
            value:
                result.find(
                    (r) =>
                        new CountryCode(r.country).toFullName() ===
                        feature.properties!.name,
                )?.successRate ?? -1,
        }));
        chart = new ChoroplethChart(map.getContext("2d")!, {
            data: {
                labels: countries.map((feature) => feature.properties!.name),
                datasets: [
                    {
                        label: "Countries",
                        data,
                        backgroundColor: data.map((d) => {
                            if (d.value === -1) {
                                return "grey";
                            }

                            const v = d.value / 100;

                            const hex = (x: number) =>
                                x.toString(16).padStart(2, "0");
                            const rgb2hex = (rgb: number[]) =>
                                `#${hex(rgb[0])}${hex(rgb[1])}${hex(rgb[2])}`;

                            const colors = {
                                safe: [40, 167, 69],
                                warning: [255, 193, 7],
                                danger: [220, 53, 69],
                            };

                            switch (v) {
                                case 1:
                                    return rgb2hex(colors.safe);
                                case 0:
                                    return rgb2hex(colors.danger);
                            }

                            const start =
                                v >= 0.5 ? colors.warning : colors.danger;
                            const end = v >= 0.5 ? colors.safe : colors.warning;

                            // Map the two portions [0,0.5) and (0.5,1] into [0,1]
                            const ratio = (v % 0.5) * 2;

                            const interpolateColorComponent = (
                                start: number,
                                end: number,
                            ) => {
                                return Math.ceil(
                                    start * (1 - ratio) + end * ratio,
                                );
                            };

                            const r = interpolateColorComponent(
                                start[0],
                                end[0],
                            );
                            const g = interpolateColorComponent(
                                start[1],
                                end[1],
                            );
                            const b = interpolateColorComponent(
                                start[2],
                                end[2],
                            );

                            return rgb2hex([r, g, b]);
                        }),
                    },
                ],
            },
            options: {
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    projection: {
                        axis: "x",
                        projection: "naturalEarth1",
                    },
                    color: {
                        axis: "x",
                        display: false
                    }
                }
            },
        });
    };

    const onSwitchSite = async (site: string) => {
        await fetchStat(site);
        onSort();
        await renderData();
    };

    onMount(async () => {
        await fetchStat();
        onSort();
        await renderData();
    });
</script>

<main>
    <div class="d-flex justify-content-center">
        <SitePicker onClick={onSwitchSite} />
    </div>

    <canvas id="map" class="my-2" bind:this={map}></canvas>

    <DataTable
        sortable
        bind:sort
        bind:sortDirection
        on:SMUIDataTable:sorted={onSort}
        style="width: 100%"
    >
        <Head>
            <Row>
                <Cell columnId="country">
                    <Label>Country</Label>
                    <IconButton class="material-icons">arrow_upward</IconButton>
                </Cell>
                <Cell columnId="success">
                    <Label>Success</Label>
                    <IconButton class="material-icons"
                        >arrow_downward</IconButton
                    >
                </Cell>
                <Cell columnId="fail">
                    <Label>Fail</Label>
                    <IconButton class="material-icons">arrow_upward</IconButton>
                </Cell>
                <Cell columnId="total">
                    <Label>Total</Label>
                    <IconButton class="material-icons">arrow_upward</IconButton>
                </Cell>
                <Cell columnId="successRate">
                    <Label>Success Rate</Label>
                    <IconButton class="material-icons">arrow_upward</IconButton>
                </Cell>
            </Row>
        </Head>
        <Body>
            {#each result as r}
                {@const instance = new CountryCode(r.country)}
                <Row>
                    <Cell>{instance.toString()}</Cell>
                    <Cell>{r.success}</Cell>
                    <Cell>{r.fail}</Cell>
                    <Cell>{r.total}</Cell>
                    <Cell>{r.successRate.toFixed(2)}%</Cell>
                </Row>
            {/each}
        </Body>
        <LinearProgress
            indeterminate
            closed={result.length > 0}
            aria-label="Data is being loaded..."
            slot="progress"
        />
    </DataTable>
</main>
