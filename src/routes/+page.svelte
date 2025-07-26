<script lang="ts">
	import Server from "@components/Server.svelte";
	import SitePickerMultiple from "@components/SitePickerMultiple.svelte";
	import { HOST } from "@lib/const";
	import { CountryCode } from "@lib/CountryCode";
	import {
	    ZSiteAPIResponse,
	    type SiteResult,
	} from "@lib/types/api/SiteAPIResponse";
	import Accordion from "@smui-extra/accordion";
	import Button from "@smui/button";
	import Select, { Option } from "@smui/select";
	import TextField from "@smui/textfield";
	import { onMount } from "svelte";

	const options = {
		sites: ["uma"],
		country: "",
		take: 20,
		orderBy: "timestamp"
	};

	let siteResult: SiteResult | null = null;
	let fetching = false;

	const fetchResult = async () => {
		if (fetching) return; // Prevent multiple fetches

		fetching = true;
		siteResult = null;

		setTimeout(() => {
			if (fetching) {
				siteResult = [];
				fetching = false;
			}
		}, 10000); // Timeout after 10 seconds

		const url = new URL(`${HOST}/api/server`);
		for (const site of options.sites) {
			url.searchParams.append("sites", site);
		}
		url.searchParams.append("take", options.take.toString());
		url.searchParams.append("orderBy", options.orderBy);

		const res = await fetch(url);
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

		fetching = false;
	};

	const onSitesChange = async (sites: string[]) => {
		options.sites = sites;
		await fetchResult();
	};

	onMount(fetchResult);

	const onChange = async () => {
		await fetchResult();
	};
</script>

<main>
	<div class="row border border-secondary rounded mb-2">
		<div class="col-12 col-md-8 p-4">
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
		</div>
		<div class="col-12 col-md-4 p-4">
			Required sites:
			<SitePickerMultiple onChange={onSitesChange} />
		</div>
	</div>
	<Button
		class="w-100"
		on:click={() => onChange()}
	>
		Apply
	</Button>

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
				<div>No servers found!</div>
				<div>If you believe this is wrong, ping the author on Discord!</div>
			{/if}
		{:else}
			<div class="loading">
				<div class="loading__icon" />
				<div class="loading__text">Loading...</div>
			</div>
		{/if}
	</div>
</main>
