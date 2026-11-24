<script lang="ts">
    import SitePickerMultiple from "@components/SitePickerMultiple.svelte";
    import {
        defaultSettings as defaultFilters,
        type Shape as ServerFilters,
    } from "@lib/LocalStorage/migrations/001_init";
    import Button from "@smui/button";
    import Dialog, { Actions, Content, Title } from "@smui/dialog";
    import FormField from "@smui/form-field";
    import Select, { Option } from "@smui/select";
    import Slider from "@smui/slider";
    import Switch from "@smui/switch";
    import {
        downloadVariantLabels,
        downloadVariants,
        platformLabels,
        platformOptions,
        type DownloadVariant,
        type PlatformPreference,
    } from "@lib/downloadPreferences";
    import { maxResultCount, minResultCount, normalizeResultCount } from "@lib/resultCount";
    import { detectedPlatform, settings } from "@lib/stores/settings";
    import { CountryCode, list as countryNames } from "@lib/types/enums/CountryCode";
    import { orderByLabels, orderByOptions } from "@lib/types/enums/OrderByOptions";

    const pinnedCountries = ["JP", "US"];
    const countries = [...pinnedCountries, ...Object.keys(countryNames).filter((code) => !pinnedCountries.includes(code))];
    const allCountries = "all";
    let visible = false;
    let filters = draftFilters(defaultFilters);
    let variant: DownloadVariant = $settings.variant;
    let platform: PlatformPreference = $settings.platform;
    let split = $settings.split;
    function draftFilters({ country, take, orderBy, sites }: ServerFilters) {
        return {
            country: country ?? allCountries,
            take: normalizeResultCount(take, defaultFilters.take),
            orderBy,
            sites: [...sites],
        };
    }

    export function open() {
        filters = draftFilters($settings);
        ({ variant, platform, split } = $settings);
        visible = true;
    }

    function save() {
        settings.update((current) => ({
            ...current,
            ...filters,
            country: filters.country === allCountries ? null : filters.country,
            variant,
            platform,
            split,
        }));
    }
</script>

<Dialog
    bind:open={visible}
    role="dialog"
    aria-labelledby="settings-title"
    surface$role="presentation"
    surface$aria-modal={undefined}
>
    <Title id="settings-title">Settings</Title>

    <Content>
        <div class="settings-fields">
            <section class="settings-group" aria-labelledby="server-filters-title">
                <h3 id="server-filters-title">Server filters</h3>

                <Select
                    variant="outlined"
                    bind:value={filters.country}
                    label="Country"
                    menu$fixed
                    menu$fullWidth={false}
                >
                    <Option value={allCountries}>All countries</Option>
                    {#each countries as country}
                        <Option value={country}>{new CountryCode(country).toString()}</Option>
                    {/each}
                </Select>

                <div>
                    <div class="result-count-label">
                        <label for="server-result-count">Result count</label>
                        <span aria-hidden="true">{filters.take}</span>
                    </div>
                    <Slider
                        input$id="server-result-count"
                        bind:value={filters.take}
                        min={minResultCount}
                        max={maxResultCount}
                        step={1}
                        discrete
                    />
                </div>

                <Select
                    variant="outlined"
                    bind:value={filters.orderBy}
                    label="Order by"
                    menu$fixed
                    menu$fullWidth={false}
                >
                    {#each orderByOptions as option}
                        <Option value={option}>{orderByLabels[option]}</Option>
                    {/each}
                </Select>

                <div>
                    Required sites
                    <SitePickerMultiple bind:selected={filters.sites} />
                </div>
                <div>
                    <Button on:click={() => (filters = draftFilters(defaultFilters))}>
                        Reset filters
                    </Button>
                </div>
            </section>

            <section class="settings-group" aria-labelledby="downloads-title">
                <h3 id="downloads-title">Downloads</h3>

                <Select
                    variant="outlined"
                    bind:value={variant}
                    label="OpenVPN version"
                    menu$fixed
                    menu$fullWidth={false}
                >
                    {#each downloadVariants as option}
                        <Option value={option}>{downloadVariantLabels[option]}</Option>
                    {/each}
                </Select>

                <Select
                    variant="outlined"
                    bind:value={platform}
                    label="Platform"
                    menu$fixed
                    menu$fullWidth={false}
                >
                    {#each platformOptions as option}
                        <Option value={option}>
                            {option === "auto"
                                ? `Automatic (${platformLabels[$detectedPlatform]})`
                                : platformLabels[option]}
                        </Option>
                    {/each}
                </Select>

                <FormField>
                    <Switch bind:checked={split} />
                    <span slot="label">Split tunneling (intended for Windows)</span>
                </FormField>
            </section>
        </div>
    </Content>

    <Actions>
        <Button action="close">Cancel</Button>
        <Button action="save" defaultAction on:click={save}>Save</Button>
    </Actions>
</Dialog>

<style>
    .settings-fields {
        display: grid;
        gap: 1rem;
        /* The outlined label floats above the first field in the scrollable dialog. */
        padding-block-start: 0.5rem;
    }

    .settings-group {
        display: grid;
        gap: 1rem;
    }

    .result-count-label {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
    }

    h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
    }
</style>
