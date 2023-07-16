<script lang="ts">
	import P5 from 'p5-svelte';
	import type * as p5Type from 'p5';
	import * as math from 'mathjs';
	import { base } from '$app/paths';

	export let playerName: string;

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
			player = p5.loadImage(`players/${playerName}.webp`);
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

<p>Victory</p>
<P5 {sketch} />
