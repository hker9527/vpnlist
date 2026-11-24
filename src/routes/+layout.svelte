<script lang="ts">
	import { version } from "$app/environment";
	import SettingsDialog from "@components/SettingsDialog.svelte";
	import { openSettingsKey } from "@lib/settingsDialogContext";
	import { settings } from "@lib/stores/settings";
	import Badge from "@smui-extra/badge";
	import { Icon } from "@smui/button";
	import Drawer, { AppContent, Content as DrawerContent } from "@smui/drawer";
	import IconButton from "@smui/icon-button";
	import List, { Item, Text } from "@smui/list";
	import TopAppBar, {
	    Row,
	    Section,
	    Title,
	} from "@smui/top-app-bar";
	import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";
	import { SvelteToast } from "@zerodevx/svelte-toast";
	import { onMount, setContext } from "svelte";
	
	polyfillCountryFlagEmojis();

	// Keep the prerendered pages and CDN-cached theme files on the same build.
	const themeVersion = encodeURIComponent(version);

	let settingsDialog: SettingsDialog;
	let settingsReady = false;
	let showSettingsHint = false;
	let open = false;

	function openSettings() {
		settingsDialog.open();
		if (showSettingsHint) {
			settings.dismissDownloadSettingsHint();
			showSettingsHint = false;
		}
	}

	setContext(openSettingsKey, openSettings);

	onMount(() => {
		showSettingsHint = settings.hasDownloadSettingsHint();

		const meta = document.createElement("meta");
		meta.name = "description";
		meta.content = "NasuVPN Checker";
		document.head.appendChild(meta);
		settingsReady = true;
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="/smui.css?v={themeVersion}" media="(prefers-color-scheme: light)" />
	<link rel="stylesheet" href="/smui-dark.css?v={themeVersion}" media="(prefers-color-scheme: dark)" />
</svelte:head>

<main>
	<TopAppBar>
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
					class="material-icons settings-trigger"
					aria-label="Settings"
					aria-describedby="download-settings-hint"
					aria-haspopup="dialog"
					title="Settings"
					disabled={!settingsReady}
					on:click={openSettings}
				>
					settings
					{#if showSettingsHint}
						<Badge class="settings-badge" color="secondary" position="inset" aria-hidden="true">New</Badge>
					{/if}
				</IconButton>
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
	<div class="mdc-top-app-bar--fixed-adjust">
		<Drawer variant="modal" bind:open>
			<DrawerContent>
				<List>
					<Item 
						href="/"
						on:click={() => (open = false)}
					>
						<Icon class="material-icons">home</Icon>
						<Text>Server list</Text>
					</Item>
					<Item 
						href="/stat"
						on:click={() => (open = false)}
					>
						<Icon class="material-icons">bar_chart</Icon>
						<Text>Statistics</Text>
					</Item>
				</List>
			</DrawerContent>
		</Drawer>
		<AppContent class="app-content mx-auto">
			<slot />
		</AppContent>
	</div>
	<span id="download-settings-hint" hidden>{#if showSettingsHint}New download settings{/if}</span>
	<SettingsDialog bind:this={settingsDialog} />
	<SvelteToast />
</main>

<style>
	* :global(.app-content) {
		max-width: 1000px;
		padding: 1em;
	}

	:global(.settings-trigger) {
		position: relative;
	}

	:global(.settings-trigger .settings-badge) {
		height: auto;
		min-height: 0;
		min-width: 0;
		font-size: 0.65rem;
		font-weight: 700;
		line-height: 1rem;
	}

	main {
		font-family: "Twemoji Country Flags", "Roboto", "Helvetica", "Arial", sans-serif;
	}
</style>
