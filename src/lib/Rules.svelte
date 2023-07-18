<script lang="ts">
	import { gameInfo, playerInfo } from '$lib/store.js';
</script>

<h1 class="text-center text-7xl mt-3">The Spy Game</h1>

<div class="mx-30">
	<p>Explore the museum by day, and when you're ready comes by night to steal it.</p>
	<p>
		In order to steal it, enter the museum by night, then go in front of the object, stand still,
		press "X" and then sneak back to the entrance of the museum
	</p>
	<button
		class="mt-10 border-none mx-auto w-40"
		style:background-color={$playerInfo.color}
		on:click={() => ($gameInfo.state = 'playerSelection')}>Play</button
	>
</div>
