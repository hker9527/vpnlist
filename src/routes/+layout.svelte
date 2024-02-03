<script lang="ts">
	import { Icon } from "@smui/button";
	import Drawer, { AppContent, Content as DrawerContent } from "@smui/drawer";
	import IconButton from "@smui/icon-button";
	import List, { Item, Text } from "@smui/list";
	import TopAppBar, {
		AutoAdjust,
		Row,
		Section,
		Title,
	} from "@smui/top-app-bar";

	let topAppBar: TopAppBar;
	let open = false;
</script>

<main>
	<TopAppBar bind:this={topAppBar}>
		<Row>
			<Section>
				<IconButton
					class="material-icons"
					on:click={() => (open = !open)}
				>
					menu
				</IconButton>
				<Title>NasuVPN Checker</Title>
			</Section>
			<Section align="end" role="toolbar">
				<IconButton
					class="material-icons"
					href="https://docs.google.com/document/d/18m9wHT4_AIh5ePKSo_ZYH9nSgNh492YQx76bIxmgqyc/edit"
					target="_blank"
				>
					help
				</IconButton>
			</Section>
		</Row>
	</TopAppBar>
	<AutoAdjust {topAppBar}>
		<Drawer variant="modal" bind:open>
			<DrawerContent>
				<List>
					<Item href="/">
						<Icon class="material-icons">home</Icon>
						<Text>Server list</Text>
					</Item>
					<Item href="/stat">
						<Icon class="material-icons">bar_chart</Icon>
						<Text>Statistics</Text>
					</Item>
				</List>
			</DrawerContent>
		</Drawer>
		<AppContent class="app-content mx-auto">
			<slot />
		</AppContent>
	</AutoAdjust>
</main>

<style>
	* :global(.app-content) {
		max-width: 1000px;
	}

	* :global(.site-button) {
		height: 48px;
	}
</style>
