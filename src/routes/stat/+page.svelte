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
    import { onMount } from "svelte";
    import { HOST } from "~/lib/const";
    import { CountryCode } from "~/lib/CountryCode";
    import {
        ZStatAPIResponse,
        type StatResult,
    } from "~/lib/types/api/StatAPIResponse";

    let sort: keyof StatResult[number] = "success";
    let sortDirection: Lowercase<keyof typeof SortValue> = "descending";

    let result: (StatResult[number] & {
        total: number;
        successRate: number
    })[] = [];

    const fetchStat = async (site = "uma") => {
        result = [];

        const res = await fetch(`${HOST}/api/stat/${site}/countries`);
        const json = await res.json();
        if (ZStatAPIResponse.check(json)) {
            if (json.success) {
                result = json.data.map(d => ({
                    ...d,
                    total: d.success + d.fail,
                    successRate: (d.success / (d.success + d.fail)) * 100
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

    const onClick = async () => {
        await fetchStat();
        onSort();
    };

    onMount(async () => {
        await onClick();
    });
</script>

<main>
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
