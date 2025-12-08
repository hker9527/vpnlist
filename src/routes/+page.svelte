<script lang="ts">
	import Server from "@components/Server.svelte";
	import SitePickerMultiple from "@components/SitePickerMultiple.svelte";
	import { HOST } from "@lib/const";
	import { CountryCode, list } from "@lib/CountryCode";
	import {
	    ZSiteAPIResponse,
	    type SiteResult,
	} from "@lib/types/api/SiteAPIResponse";
	import Accordion from "@smui-extra/accordion";
	import Button from "@smui/button";
	import Select, { Option } from "@smui/select";
	import TextField from "@smui/textfield";
	import { onMount } from "svelte";
    import { Settings } from "~/lib/LocalStorage";
	import { toast } from "@zerodevx/svelte-toast";

	const settings = new Settings();
	let options = settings.load();
	let optionChanged = false;

	let siteResult: SiteResult | null = null;
	let fetching = false;

	const fetchResult = async () => {
		fetching = true;
		siteResult = null;

		const timeout = setTimeout(() => {
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
		if (options.country !== null) {
			url.searchParams.append("country", options.country);
		}

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
		clearTimeout(timeout);
	};

	onMount(fetchResult);

	const onApply = async () => {
		toast.push("Autosaving settings...");
		settings.save(options);
		optionChanged = false;
		await fetchResult();
	};
</script>

<main>
	<div class="row border border-secondary rounded mb-2">
		<div class="col-12 col-md-8 p-4">
			Filters:
			<Select
				bind:value={options.country}
				on:change={() => (optionChanged = true)}
				class="w-100"
				label="Country"
			>
				<Option value={null}>
					All countries
				</Option>
				{#each Object.keys(list).sort((a, b) => {
					const precedence = ["JP", "US"];
					const aIndex = precedence.indexOf(a);
					const bIndex = precedence.indexOf(b);
					if (aIndex !== -1 && bIndex !== -1) {
						return aIndex - bIndex;
					} else if (aIndex !== -1) {
						return -1;
					} else if (bIndex !== -1) {
						return 1;
					} else {
						return 0;
					}
				}) as country}
					<Option value={country}>
						{new CountryCode(country).toString()}
					</Option>
				{/each}
			</Select>

			<TextField
				bind:value={options.take}
				on:input={() => (optionChanged = true)}
				class="w-100"
				label="Result count"
				input$min="1"
				input$max="100"
				input$step="10"
			/>

			<Select
				bind:value={options.orderBy}
				on:change={() => (optionChanged = true)}
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
			<SitePickerMultiple 
				bind:selected={options.sites}
				oninput={() => (optionChanged = true)}
			/>
			<Button
				class="w-100 mt-2"
				variant="outlined"
				on:click={() => {
					settings.reset();
					options = settings.load();
					optionChanged = true;
				}}
			>Reset</Button>
		</div>
	</div>
	<Button
		class="w-100"
		on:click={() => onApply()}
		disabled={!optionChanged || fetching}
	>
		Apply
	</Button>

	<div class="accordion-container">
		{#if siteResult}
			{#if siteResult.length > 0}
				<Accordion multiple>
					{#each siteResult as result}
						<Server {result} />
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
