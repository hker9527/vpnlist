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
		<AppContent class="app-content">
			<slot></slot>
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
