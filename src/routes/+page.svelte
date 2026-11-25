<script lang="ts">
	import ConnectionTest from "@components/ConnectionTest.svelte";
	import Server from "@components/Server.svelte";
	import { HOST } from "@lib/const";
	import type { Shape as ServerFilters } from "@lib/LocalStorage/migrations/001_init";
	import { openSettingsKey } from "@lib/settingsDialogContext";
	import { CountryCode } from "@lib/types/enums/CountryCode";
	import { orderByLabels } from "@lib/types/enums/OrderByOptions";
	import { Site } from "@lib/types/enums/Site";
	import {
	    ZSiteAPIResponse,
	    type SiteResult,
	} from "@lib/types/api/SiteAPIResponse";
	import Accordion from "@smui-extra/accordion";
	import Button, { Icon } from "@smui/button";
	import { getContext, onMount } from "svelte";
	import { settings } from "@lib/stores/settings";

	const openSettings = getContext<() => void>(openSettingsKey);
	let diagnosticsOpen = false;
	let siteResult: SiteResult | null = null;
	let fetching = false;
	let loadError = false;
	let mounted = false;
	let activeRequest: AbortController | undefined;

	function filterQuery({ sites, take, orderBy, country }: ServerFilters) {
		const query = new URLSearchParams({ take: take.toString(), orderBy });
		for (const site of sites) {
			query.append("sites", site);
		}
		if (country !== null) {
			query.set("country", country);
		}
		return query.toString();
	}

	async function fetchResult(query: string) {
		activeRequest?.abort();
		const request = new AbortController();
		activeRequest = request;
		fetching = true;
		loadError = false;
		siteResult = null;

		const timeout = setTimeout(() => request.abort(), 10000);
		try {
			const res = await fetch(`${HOST}/api/server?${query}`, { signal: request.signal });
			const json = await res.json();
			if (activeRequest !== request) return;

			if (res.ok && ZSiteAPIResponse.check(json) && json.success) {
				siteResult = json.data;
			} else {
				loadError = true;
			}
		} catch {
			if (activeRequest === request) loadError = true;
		} finally {
			clearTimeout(timeout);
			if (activeRequest === request) {
				activeRequest = undefined;
				fetching = false;
			}
		}
	}

	$: query = filterQuery($settings);
	$: hasMatchFilters = $settings.country !== null || $settings.sites.length > 0;
	$: if (mounted) fetchResult(query);

	function clearMatchFilters() {
		settings.update((current) => ({ ...current, country: null, sites: [] }));
	}

	onMount(() => {
		mounted = true;
		return () => {
			const request = activeRequest;
			activeRequest = undefined;
			request?.abort();
		};
	});
</script>

<main>
	<h1>Find a VPN server</h1>
	<p>Choose a server, download its profile, then import it into OpenVPN and connect.</p>

	<aside class="vpngate-notice" aria-label="About VPN Gate">
		<p>
			<a href="https://www.vpngate.net/en/about_overview.aspx">VPN Gate</a>
			is a free University of Tsukuba research project with volunteer-run public servers.
			Speed and availability vary. VPN Gate logs your IP address and connection details
			<a href="https://www.vpngate.net/en/about_abuse.aspx">for at least three months</a>.
			Don’t rely on it for anonymity.
		</p>
		<p>
			NasuVPN doesn’t log your VPN connections or traffic. We use Cloudflare to serve this website
			and measure its usage and performance. Cloudflare may process your IP address and other
			request data when you visit. See <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare’s Privacy Policy</a>.
		</p>
	</aside>

	<div class="results-toolbar">
		<div class="filter-summary">
			<strong>Filters:</strong>
			<ul class="filter-pills" role="list">
				<li>{$settings.country ? new CountryCode($settings.country).toFullName() : "All countries"}</li>
				{#each $settings.sites as site}
					<li>{new Site(site).toFullName()}</li>
				{:else}
					<li>All sites</li>
				{/each}
				<li>Up to {$settings.take}</li>
				<li>{orderByLabels[$settings.orderBy]}</li>
			</ul>
		</div>
		<Button class="refresh-button" variant="outlined" on:click={() => fetchResult(query)} disabled={fetching}>
			<Icon class="material-icons" aria-hidden="true">refresh</Icon>
			Refresh
		</Button>
	</div>

	<div class="accordion-container" aria-busy={fetching}>
		{#if loadError || siteResult?.length === 0}
			<div role="status">
				{#if loadError}
					<h2>Couldn’t load the server list</h2>
					<p>Try Refresh, or browse the official VPN Gate list.</p>
				{:else if hasMatchFilters}
					<h2>No servers match your filters</h2>
					<p>Try a different country or require fewer sites.</p>
				{:else}
					<h2>No servers are listed right now</h2>
					<p>Try Refresh, or browse the official VPN Gate list.</p>
				{/if}
			</div>
			<div class="results-actions">
				{#if !loadError && hasMatchFilters}
					<Button variant="outlined" aria-haspopup="dialog" on:click={openSettings}>Adjust filters</Button>
					<Button on:click={clearMatchFilters}>Clear filters</Button>
				{/if}
				<Button href="https://www.vpngate.net/en/" target="_blank" rel="noopener noreferrer">
					Browse VPN Gate
				</Button>
			</div>
		{:else if siteResult}
			<Accordion multiple>
				{#each siteResult as result}
					<Server {result} />
				{/each}
			</Accordion>
		{:else}
			<div class="loading">
				<div class="loading__icon" />
				<div class="loading__text">Loading...</div>
			</div>
		{/if}
	</div>

	<details class="diagnostics" on:toggle={(event) => (diagnosticsOpen = event.currentTarget.open)}>
		<summary>Already connected? Test your connection</summary>
		{#if diagnosticsOpen}
			<ConnectionTest />
		{/if}
	</details>
</main>

<style>
	h1 {
		margin: 0 0 0.375rem;
		font-size: 1.5rem;
	}

	.vpngate-notice {
		border-inline-start: 3px solid var(--mdc-theme-primary, #ab47bc);
		padding-inline-start: 0.75rem;
		font-size: 0.875rem;
	}

	.vpngate-notice p {
		margin: 0;
	}

	.vpngate-notice p + p {
		margin-block-start: 0.5rem;
	}

	.results-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-block: 0.75rem;
	}

	.filter-summary {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
	}

	.filter-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.filter-pills li {
		padding: 0.125rem 0.5rem;
		border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
		border-radius: 999px;
	}

	.results-toolbar :global(.refresh-button) {
		margin-inline-start: auto;
	}

	.accordion-container h2 {
		margin: 0 0 0.25rem;
		font-size: 1.125rem;
	}

	.accordion-container p {
		margin: 0 0 0.5rem;
	}

	.results-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.diagnostics {
		margin-block: 1rem;
		border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
		border-radius: 8px;
	}

	summary {
		padding: 0.75rem 1rem;
		font-weight: 600;
		cursor: pointer;
	}
</style>
