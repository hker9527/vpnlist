<script lang="ts">
	import Accordion from "@smui-extra/accordion";
	import Select, { Option } from "@smui/select";
	import { onMount } from "svelte";
	import SitePicker from "~/lib/SitePicker.svelte";
	import Server from "~/lib/Server.svelte";
	import { HOST } from "~/lib/const";
	import { country2emoji } from "~/lib/emoji";
	import {
		ZSiteAPIResponse,
		type SiteResult,
	} from "~/lib/types/api/SiteAPIResponse";

	let siteResult: {
		value: SiteResult["data"] | null;
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

		fetch(`${HOST}/api/site/${site}`).then(async (res) => {
			const json = await res.json();
			if (ZSiteAPIResponse.check(json)) {
				if (json.success) {
					siteResult.value = json.data.data;
					siteResult.updatedAt = json.data.updatedAt;
				}
			} else {
				alert(ZSiteAPIResponse.reason(json));
			}
		});
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
	<div class="my-2">
		Updated at:
		{#if siteResult.updatedAt > 0}
			{new Date(siteResult.updatedAt).toLocaleString()}
		{:else}
			Loading...
		{/if}
	</div>

	<div class="border rounded bg-light p-4 mb-2">
		Filters:
		<Select
			bind:value={siteResult.filters.country}
			on:change={onChange}
			class="w-100"
			label="Country"
		>
			<Option value={null} />
			{#if siteResult.value}
				{#each [...new Set(siteResult.value.map((r) => r.server.country))] as country}
					<Option value={country}
						>{country2emoji(country)} {country}</Option
					>
				{/each}
			{/if}
		</Select>
	</div>

	<div class="d-flex justify-content-center">
		<SitePicker {onClick} />
	</div>

	<div class="accordion-container">
		{#if siteResult.value}
			{#if siteResult.value.length > 0}
				<Accordion multiple>
					{#each siteResult.value as result}
						{#if !siteResult.filters.country || siteResult.filters.country === result.server.country}
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
