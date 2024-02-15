<script lang="ts">
	import Accordion from "@smui-extra/accordion";
	import Select, { Option } from "@smui/select";
	import TextField from "@smui/textfield";
	import { onMount } from "svelte";
	import SitePicker from "~/lib/SitePicker.svelte";
	import Server from "~/lib/Server.svelte";
	import { HOST } from "~/lib/const";
	import {
		ZSiteAPIResponse,
		type SiteResult,
	} from "~/lib/types/api/SiteAPIResponse";
    import { CountryCode } from "~/lib/CountryCode";
    import Button from "@smui/button";

	const options = {
		site: "uma",
		country: "",
		take: 20,
		orderBy: "timestamp"
	};

	let siteResult: SiteResult | null = null;

	const fetchResult = async () => {
		siteResult = null;

		const res = await fetch(`${HOST}/api/site/${options.site}?take=${options.take}&orderBy=${options.orderBy}`);
		const json = await res.json();
		if (ZSiteAPIResponse.check(json)) {
			if (json.success) {
				siteResult = json.data;
			} else {
				prompt("Failed to fetch data from the server.\nServer response:", JSON.stringify(json));
			}
		} else {
			alert(ZSiteAPIResponse.reason(json));
		}
	};

	const onClick = async (_site: string) => {
		options.site = _site;
		await fetchResult();
	};

	onMount(async () => {
		await fetchResult();
	});

	const onChange = async () => {
		await fetchResult();
	};
</script>

<main>
	<div class="border rounded p-4 mb-2">
		Filters:
		<Select
			bind:value={options.country}
			class="w-100"
			label="Country"
		>
			<Option value={null} />
			{#if siteResult}
				{#each [...new Set(siteResult.map((r) => r.country))] as country}
					<Option value={country}>
						{new CountryCode(country).toString()}
					</Option>
				{/each}
			{/if}
		</Select>

		<TextField
			bind:value={options.take}
			class="w-100"
			label="Result count"
			input$min="1"
			input$max="100"
			input$step="10"
		/>

		<Select
			bind:value={options.orderBy}
			class="w-100"
			label="Order by"
		>
			<Option value="timestamp" selected>Most recent</Option>
			<Option value="duration">Lowest ping</Option>
			<Option value="speed">Fastest speed</Option>
		</Select>

		<Button
			class="w-100"
			on:click={() => onChange()}
		>
			Apply
		</Button>
	</div>

	<div class="d-flex justify-content-center my-1">
		<SitePicker {onClick} />
	</div>

	<div class="accordion-container">
		{#if siteResult}
			{#if siteResult.length > 0}
				<Accordion multiple>
					{#each siteResult as result}
						{#if !options.country || options.country === result.country}
							<Server {result} />
						{/if}
					{/each}
				</Accordion>
			{:else}
				<div>No servers found, probably something went wrong...</div>
				<div>Ping the author on Discord!</div>
			{/if}
		{:else}
			<div class="loading">
				<div class="loading__icon" />
				<div class="loading__text">Loading...</div>
			</div>
		{/if}
	</div>
</main>
