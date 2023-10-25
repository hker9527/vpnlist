<script lang="ts">
	import Accordion from "@smui-extra/accordion";
	import Button, { Group, Icon, Label } from "@smui/button";
	import Drawer, { AppContent, Content as DrawerContent } from "@smui/drawer";
	import IconButton from "@smui/icon-button";
	import LayoutGrid, { Cell } from "@smui/layout-grid";
	import List, { Item, Text } from "@smui/list";
	import Select, { Option } from "@smui/select";
	import TopAppBar, {
	    AutoAdjust,
	    Row,
	    Section,
	    Title,
	} from "@smui/top-app-bar";
	import { onMount } from "svelte";
	import Server from "~/lib/Server.svelte";
	import { HOST } from "~/lib/const";
	import { country2emoji } from "~/lib/emoji";
	import {
	    ZSiteAPIResponse,
	    type SiteResult,
	} from "~/lib/types/api/SiteAPIResponse";

	let topAppBar: TopAppBar;
	let siteResult: {
		value: SiteResult | null;
		filters: {
			country: string;
		};
	} = {
		value: null,
		filters: {
			country: "",
		},
	};

	const siteVariants: Record<string, "raised" | "outlined"> = {
		uma: "raised",
		dmm: "outlined",
	};

	const fetchResult = async (site: string) => {
		siteResult.value = null;

		fetch(`${HOST}/api/site/${site}`).then(async (res) => {
			const json = await res.json();
			if (ZSiteAPIResponse.check(json)) {
				if (json.success) {
					siteResult.value = json.data;
				}
			} else {
				alert(ZSiteAPIResponse.reason(json));
			}
		});
	};

	let site = "uma";
	const onClick = async (_site: string) => {
		site = _site;

		if (siteVariants[site] === "raised") return;
		for (const button in siteVariants) {
			siteVariants[button] = "outlined";
		}
		siteVariants[site] = "raised";

		await fetchResult(site);
	};

	onMount(async () => {
		await fetchResult(site);
	});

	const onChange = async () => {
		await fetchResult(site);
	};

	let open = false;
</script>

<main>
	<TopAppBar bind:this={topAppBar}>
		<Row>
			<Section>
				<IconButton
					class="material-icons"
					on:click={() => (open = !open)}>menu</IconButton
				>
				<Title>NasuVPN Checker</Title>
			</Section>
		</Row>
	</TopAppBar>
	<AutoAdjust {topAppBar}>
		<Drawer variant="modal" bind:open>
			<DrawerContent>
				<List>
					<Item>
						<Text>Nothing here yet...</Text>
					</Item>
					<Item href="https://www.google.com" target="_blank">
						<Icon class="material-icons">link</Icon>
						<Text>Go to Google</Text>
					</Item>
				</List>
			</DrawerContent>
		</Drawer>
		<AppContent class="app-content">
			<Group class="my-4">
				{#each Object.keys(siteVariants) as site}
					<Button
						variant={siteVariants[site]}
						class="site-button"
						on:click={() => onClick(site)}
					>
						<Label>
							<img src="/{site}.png" alt="" />
						</Label>
					</Button>
				{/each}
			</Group>
			<LayoutGrid>
				<Cell span={4} class="d-flex align-items-center">
					Filter by country
				</Cell>
				<Cell span={8}>
					<Select
						bind:value={siteResult.filters.country}
						on:change={onChange}
						class="w-100"
					>
						<Option value="" selected>🏳️ ----</Option>
						{#if siteResult.value}
							{#each [...new Set(siteResult.value.map((r) => r.server.country))] as country}
								<Option value={country}
									>{country2emoji(country)} {country}</Option
								>
							{/each}
						{/if}
					</Select>
				</Cell>
			</LayoutGrid>
			<div class="accordion-container">
				{#if siteResult.value}
					<Accordion multiple>
						{#each siteResult.value as result}
							{#if siteResult.filters.country === "" || siteResult.filters.country === result.server.country}
								<Server {result} />
							{/if}
						{/each}
					</Accordion>
				{:else}
					<div class="loading">
						<div class="loading__icon" />
						<div class="loading__text">Loading...</div>
					</div>
				{/if}
			</div>
		</AppContent>
	</AutoAdjust>
</main>

<style>
	* :global(.app-content) {
		max-width: 1000px;
		margin: 0 auto !important;
	}

	* :global(.site-button) {
		height: 48px;
	}
</style>
