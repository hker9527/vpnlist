<script lang="ts">
	import Switch from "@smui/switch";
	import FormField from "@smui/form-field";
	import { Label } from "@smui/button";
    import { Site, list as siteList } from "./Site";

	export let onChange: (sites: string[]) => Promise<void>;

	let options = Object.keys(siteList);

	let selected: string[] = ["uma"];

	$: onChange(selected);
</script>

<main>
	{#each options as option}
		<div>
			<FormField>
				<Switch bind:group={selected} value={option} />
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
