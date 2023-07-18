<script lang="ts">
	import { number } from 'mathjs';
	import Game from '$lib/Game.svelte';
	import Victory from '$lib/Victory.svelte';
	import CaracterPicker from '$lib/CaracterPicker.svelte';
	import LevelPicker from '$lib/LevelPicker.svelte';
	import Rules from '$lib/Rules.svelte';
	import { gameInfo, playerInfo } from '$lib/store.js';
</script>

{#if $gameInfo.state == 'rules'}
	<Rules />
{:else if $gameInfo.state == 'playerSelection'}
	<CaracterPicker />
{:else if $gameInfo.state == 'levelSelection'}
	<LevelPicker />
{:else if $gameInfo.state == 'running'}
	<Game />
{:else if $gameInfo.state == 'victory'}
	<Victory />
{/if}
