<script lang="ts">
	import P5 from 'p5-svelte';
	import type * as p5Type from 'p5';
	import * as math from 'mathjs';
	import { Confetti } from 'svelte-confetti';

	export let multiStore;

	let winImage: p5Type.Image;
	let player: p5Type.Image;

	let FPS = 15;
	let width = 500;
	let height = 500;
	let playerWidth = 48;
	let playerHeight = 96;
	let halfWinCycle = 6;

	let cycle: number = 0;
	let animationOrientation = 864; // down

	const sketch = (p5: p5Type) => {
		p5.preload = () => {
			player = p5.loadImage(`players/${$multiStore.users[$multiStore.username].skin}.webp`);
			winImage = p5.loadImage(`assets/victory.webp`);
		};

		p5.setup = () => {
			p5.createCanvas(width, height);
			p5.frameRate(FPS);
		};

		p5.draw = () => {
			cycle = cycle + 1;
			p5.background('black');
			p5.image(
				winImage,
				math.ceil(width / 2) - winImage.width / 2,
				math.ceil(height / 2) - winImage.height / 2,
				winImage.width,
				winImage.height,
				0,
				0,
				winImage.width,
				winImage.height
			);
			let jumpHeight =
				(-playerHeight / 4) *
				(1 - (math.pow(((cycle % (2 * halfWinCycle)) - halfWinCycle) / halfWinCycle, 2) as number));
			p5.image(
				player,
				math.ceil(width / 2) - playerWidth / 2,
				math.ceil(height / 2) - playerHeight / 2 + jumpHeight,
				playerWidth,
				playerHeight,
				animationOrientation,
				0,
				playerWidth,
				playerHeight
			);
		};
	};
</script>

<article data-theme="dark" class="h-screen w-screen mt-0 fixed">
	<h1 class="text-center text-7xl mt-3">The Spy Game</h1>
	{#if $multiStore.users[$multiStore.username].master}
		<button
			class="mt-10 border-none mx-auto w-40"
			style:background-color={$multiStore.users[$multiStore.username].color}
			on:click={() => {
				$multiStore.common.state = 'levelSelection';
			}}>Try another level</button
		>
	{/if}
	<button
		class="mt-10 border-none mx-auto w-40"
		style:background-color={$multiStore.users[$multiStore.username].color}
		on:click={() => {
			$multiStore.users[$multiStore.username].multiplayerScreen = true;
		}}>Wait for others</button
	>
	<div class="absolute bottom-90 left-150">
		<Confetti x={[-1, 1]} y={[-1, 1]} delay={[0, 1000]} infinite />
	</div>

	<div class="absolute bottom-90 left-220">
		<Confetti x={[-1, 1]} y={[-1, 1]} delay={[0, 1000]} infinite />
	</div>
	<div class="grid h-10 place-items-center mx-auto">
		<P5 {sketch} />
	</div>
</article>
