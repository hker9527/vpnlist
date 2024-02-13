<script lang="ts">
	import Accordion from "@smui-extra/accordion";
	import Select, { Option } from "@smui/select";
	import { onMount } from "svelte";
	import SitePicker from "~/lib/SitePicker.svelte";
	import Server from "~/lib/Server.svelte";
	import { HOST } from "~/lib/const";
	import {
		ZSiteAPIResponse,
		type SiteResult,
	} from "~/lib/types/api/SiteAPIResponse";
    import { CountryCode } from "~/lib/CountryCode";

	let siteResult: {
		value: SiteResult | null;
		updatedAt: number;
		filters: {
			country: string;
		};
	} = {
		value: null,
		updatedAt: 0,
		filters: {
			country: "",
		},
	};

	const fetchResult = async (site: string) => {
		siteResult.value = null;

		const res = await fetch(`${HOST}/api/site/${site}`);
		const json = await res.json();
		if (ZSiteAPIResponse.check(json)) {
			if (json.success) {
				siteResult.value = json.data;
			} else {
				prompt("Failed to fetch data from the server.\nServer response:", JSON.stringify(json));
			}
		} else {
			alert(ZSiteAPIResponse.reason(json));
		}
	};

	let site = "uma";
	const onClick = async (_site: string) => {
		site = _site;
		await fetchResult(site);
	};

	onMount(async () => {
		await fetchResult(site);
	});

	const onChange = async () => {
		await fetchResult(site);
	};
</script>

<main>
	<div class="border rounded p-4 mb-2">
		Filters:
		<Select
			bind:value={siteResult.filters.country}
			on:change={onChange}
			class="w-100"
			label="Country"
		>
			<Option value={null} />
			{#if siteResult.value}
				{#each [...new Set(siteResult.value.map((r) => r.country))] as country}
					<Option value={country}>
						{new CountryCode(country).toString()}
					</Option>
				{/each}
			{/if}
		</Select>
	</div>

	<div class="d-flex justify-content-center my-1">
		<SitePicker {onClick} />
	</div>

	<div class="accordion-container">
		{#if siteResult.value}
			{#if siteResult.value.length > 0}
				<Accordion multiple>
					{#each siteResult.value as result}
						{#if !siteResult.filters.country || siteResult.filters.country === result.country}
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
