<script lang="ts">
	import Game from '$lib/Game.svelte';
	import Victory from '$lib/Victory.svelte';
	import CaracterPicker from '$lib/CaracterPicker.svelte';
	import LevelPicker from '$lib/LevelPicker.svelte';
	import { masterInfo, playerInfo } from '$lib/store.js';
	import { page } from '$app/stores';
	import { multiplayerStore } from '$lib/multiplayerStore.js';
	import MultiplayerGame from '$lib/MultiplayerGame.svelte';

	let cyclicTimer: NodeJS.Timer;
	let roomID: string = $page.params.roomID;
	let multiStore = multiplayerStore(roomID, $playerInfo.name, $playerInfo, $playerInfo.master);
	if ($playerInfo.master) $multiStore.common = $masterInfo; // new player needs gamestate
	$: {
		clearInterval(cyclicTimer);
		cyclicTimer = setInterval(() => {
			if ($multiStore.common?.state == 'playerSelection') {
				if ($playerInfo.master) $multiStore.common = $masterInfo; // new player needs gamestate
				$multiStore.users[$playerInfo.name] = $playerInfo; // old players need notification of new players
			}
		}, 300);
	}
</script>

{#if $multiStore.common?.state == 'playerSelection'}
	<CaracterPicker {multiStore} />
{:else if $multiStore.common?.state == 'levelSelection'}
	<LevelPicker {multiStore} />
{:else if $multiStore.common?.state == 'running'}
	{#if $multiStore.users[$multiStore.username].victory}
		{#if $multiStore.users[$multiStore.username].multiplayerScreen}
			<MultiplayerGame {multiStore} />
		{:else}
			<Victory {multiStore} />
		{/if}
	{:else}
		<Game {multiStore} />
	{/if}
{/if}
