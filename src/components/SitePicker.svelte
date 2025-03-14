<script lang="ts">
    import Button, { Group, Label } from "@smui/button";

	export let onClick: (site: string) => Promise<void>;
	
	const siteVariants: Record<string, "raised" | "outlined"> = {
		uma: "raised",
		dmm: "outlined",
	};

	const _onClick = async (site: string) => {
		if (siteVariants[site] === "raised") return;
		for (const button in siteVariants) {
			siteVariants[button] = "outlined";
		}
		siteVariants[site] = "raised";

		await onClick(site);
	};
</script>

<main>
	<Group>
		{#each Object.keys(siteVariants) as site}
			<Button
				variant={siteVariants[site]}
				class="site-button"
				on:click={() => _onClick(site)}
			>
				<Label>
					<img src="/{site}.png" alt="" />
				</Label>
			</Button>
		{/each}
	</Group>
</main>

<style>
	* :global(.site-button) {
		height: 48px;
	}
</style>