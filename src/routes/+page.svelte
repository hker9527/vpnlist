<script lang="ts">
    import { onMount } from "svelte";
	import Server from "~/lib/Server.svelte";
	import Accordion from "@smui-extra/accordion";
    import type { SiteAPIResponse, SiteResults } from "~/lib/types/SiteAPIResponse";
    import { HOST } from "~/lib/const";


	let siteResults: SiteResults;
	
	onMount(async () => {
		fetch(`${HOST}/api/site/uma`).then(async (res) => {
			const json = await res.json() as SiteAPIResponse;
			if (json.success) {
				siteResults = json.data;
			}
		});
	});
</script>

<main>
    <div class="accordion-container">
		{#if siteResults}
			<Accordion multiple>
				{#each siteResults as result}
					<Server result={result} />
				{/each}
			</Accordion>				
		{:else}
			<div class="loading">
				<div class="loading__icon"></div>
				<div class="loading__text">Loading...</div>
			</div>
		{/if}
	</div>
</main>

<style>

</style>