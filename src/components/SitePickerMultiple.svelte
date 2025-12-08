<script lang="ts">
	import { Site, list as siteList } from "@lib/Site";
	import { Label } from "@smui/button";
	import FormField from "@smui/form-field";
	import Switch from "@smui/switch";

	let options = Object.keys(siteList);
	export let selected: string[] = ["uma"];
	export let oninput: (() => void);
</script>

<main>
	{#each options as option}
		<div>
			<FormField>
				<Switch bind:group={selected} value={option} on:click={() => oninput()} />
				<span slot="label">
					<Label>
						<img src="/{option}.png" alt="" />
					</Label>
					{new Site(option).toFullName()}
				</span>
			</FormField>
		</div>
	{/each}
</main>
