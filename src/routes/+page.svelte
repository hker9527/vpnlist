<script lang="ts">
    import { onMount } from "svelte";
	import Server from "~/lib/Server.svelte";
	import Accordion from "@smui-extra/accordion";
    import { HOST } from "~/lib/const";
    import { ZSiteAPIResponse, type SiteResult } from "~/lib/types/api/SiteAPIResponse";

	let siteResult: SiteResult;
	
	onMount(async () => {
		fetch(`${HOST}/api/site/uma`).then(async (res) => {
			const json = await res.json()
			if (ZSiteAPIResponse.check(json)) {
				if (json.success) {
					siteResult = json.data;
				}
			} else {
				alert(ZSiteAPIResponse.reason(json));
			}
		});
	});
</script>

<main>
    <div class="accordion-container">
		{#if siteResult}
			<Accordion multiple>
				{#each siteResult as result}
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
	main {
		max-width: 1000px;
		margin: 0 auto;
	}
</style>