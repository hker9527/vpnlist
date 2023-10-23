<script lang="ts">
	import Server from "~/lib/Server.svelte";
	import Accordion from "@smui-extra/accordion";
    import { HOST } from "~/lib/const";
    import { ZSiteAPIResponse, type SiteResult } from "~/lib/types/api/SiteAPIResponse";
    import Group from "@smui/button/src/Group.svelte";
    import Button from "@smui/button/src/Button.svelte";
    import { Label } from "@smui/button";
    import { onMount } from "svelte";

	let siteResult: SiteResult | null = null;
	let siteVariants: Record<string, "raised" | "outlined"> = {
		"uma": "raised",
		"dmm": "outlined"
	};

	const fetchResult = async (site: string) => {
		siteResult = null;

		fetch(`${HOST}/api/site/${site}`).then(async (res) => {
			const json = await res.json()
			if (ZSiteAPIResponse.check(json)) {
				if (json.success) {
					siteResult = json.data;
				}
			} else {
				alert(ZSiteAPIResponse.reason(json));
			}
		});
	};

	const onClick = async (site: string) => {
		if (siteVariants[site] === "raised") return;

		for (const button in siteVariants) {
			siteVariants[button] = "outlined";
		}

		siteVariants[site] = "raised";

		fetchResult(site);
	}

	onMount(async () => {
		await fetchResult("uma");
	});
</script>

<main>
	<Group class="my-4">
		<Button variant={siteVariants["uma"]} class="site-button" on:click={(e) => onClick("uma")}>
			<Label>
				<img src="/uma.png" alt="" />
			</Label>
		</Button>
		<Button variant={siteVariants["dmm"]} class="site-button" on:click={(e) => onClick("dmm")}>
			<Label>
				<img src="/dmm.png" alt="" />
			</Label>
		</Button>
	</Group>
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

	* :global(.site-button) {
		height: 48px;
	}
</style>