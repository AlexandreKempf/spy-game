<script lang="ts">
	import P5 from 'p5-svelte';
	import type * as p5Type from 'p5';
	import * as math from 'mathjs';

	export let multiStore;

	let background: p5Type.Image;
	let foreground: p5Type.Image;
	let walkableMap: p5Type.Image;
	let logicMap: p5Type.Image;
	let darkness: p5Type.Image;
	let nightVisionCaches: { [key: number]: p5Type.Image };
	let players: { [key: string]: p5Type.Image } = {};
	let playersContours: { [key: string]: p5Type.Image } = {};

	let generateCaches = false;
	let width = 500;
	let height = 500;
	let playerWidth = 48;
	let playerHeight = 96;
	let FPS = 15;
	let maxSpeed = 8;
	let nightVisionRange = 200;
	let visionCircleRange = 40;
	let stepImageScale = 0.5;
	let animationTable: { [key: string | number]: number } = {
		idle: 0,
		walk: 1152,
		0: 0, // right
		2: 864, // down
		4: 576, // left
		6: 288 // up
	};

	let initialPosition: [number, number];
	let stepsImages: p5Type.Image[];

	let inputs: [boolean, boolean, boolean, boolean];
	let motion: [number, number];
	let cycle: number;
	let playerOrientation: number;
	let controlOrientation: number;
	let stepsAchieved: Array<boolean>;

	function reset() {
		$multiStore.users[$multiStore.username].position = initialPosition;
		inputs = [false, false, false, false];
		motion = [0, 0];
		cycle = 0;
		playerOrientation = 2; // start down
		controlOrientation = -1; // no control
		stepsAchieved = stepsImages.map((path) => false);
	}

	function display(p5: p5Type) {
		p5.background($multiStore.users[$multiStore.username].lightOn ? 'white' : 'black');
		p5.image(
			background,
			0,
			0,
			width,
			height,
			math.ceil($multiStore.users[$multiStore.username].position[0] - width / 2),
			math.ceil($multiStore.users[$multiStore.username].position[1] - height / 2),
			width,
			height
		);
		$multiStore.users[$multiStore.username].animationScore =
			animationTable[inputs.includes(true) ? 'walk' : 'idle'] +
			animationTable[playerOrientation] +
			playerWidth * cycle;

		for (const [username, player] of Object.entries(players)) {
			p5.image(
				player,
				math.ceil(width / 2) -
					playerWidth / 2 +
					$multiStore.users[username].position[0] -
					$multiStore.users[$multiStore.username].position[0],
				math.ceil(height / 2) -
					playerHeight / 2 +
					$multiStore.users[username].position[1] -
					$multiStore.users[$multiStore.username].position[1],
				playerWidth,
				playerHeight,
				$multiStore.users[username].animationScore,
				0,
				playerWidth,
				playerHeight
			);
		}

		p5.image(
			foreground,
			0,
			0,
			width,
			height,
			math.ceil($multiStore.users[$multiStore.username].position[0] - width / 2),
			math.ceil($multiStore.users[$multiStore.username].position[1] - height / 2),
			width,
			height
		);
		if (!$multiStore.users[$multiStore.username].lightOn) {
			p5.image(
				darkness,
				0,
				0,
				width,
				height,
				math.ceil($multiStore.users[$multiStore.username].position[0] - width / 2),
				math.ceil($multiStore.users[$multiStore.username].position[1] - height / 2),
				width,
				height
			);
			p5.image(
				nightVisionCaches[controlOrientation != -1 ? controlOrientation : playerOrientation],
				0,
				0
			);
			for (const [username, playerContour] of Object.entries(playersContours)) {
				p5.image(
					playerContour,
					math.ceil(width / 2) -
						playerWidth / 2 +
						$multiStore.users[username].position[0] -
						$multiStore.users[$multiStore.username].position[0],
					math.ceil(height / 2) -
						playerHeight / 2 +
						$multiStore.users[username].position[1] -
						$multiStore.users[$multiStore.username].position[1],
					playerWidth,
					playerHeight,
					$multiStore.users[username].animationScore,
					0,
					playerWidth,
					playerHeight
				);
			}
		}
		// hud top left
		let stepsImagesOffset = 10;
		let stepImage: p5Type.Image;
		for (let stepIndex = 0; stepIndex < stepsAchieved.length; stepIndex++) {
			if (!stepsAchieved[stepIndex]) break;
			stepImage = stepsImages[stepIndex];
			p5.image(
				stepImage,
				stepsImagesOffset,
				10,
				stepImage.width * stepImageScale,
				stepImage.height * stepImageScale,
				0,
				0,
				stepImage.width,
				stepImage.height
			);
			stepsImagesOffset = stepsImagesOffset + stepImage.width * stepImageScale + 10;
		}
	}

	function vectorNorm(vector: number[]): number {
		return math.sqrt(math.sum(math.map(vector, math.square))) as number;
	}

	function normalize(vector: number[]): number[] {
		let norm = vectorNorm(vector);
		if (norm == 0) return vector;
		return math.divide(vector, norm) as number[];
	}

	function getPixelIndex(position: [number, number], map: p5Type.Image): number {
		return (position[0] + position[1] * map.width) * 4;
	}

	function getVisionIndex(motion: [number, number]): number {
		let angle = math.asin(normalize(motion)[1]) as number;
		if (motion[0] < 0) angle = math.pi - angle;
		return math.round((angle / math.pi) * 4 + 8) % 8;
	}

	function handleWalls(
		walkableMap: p5Type.Image,
		position: [number, number],
		derivedPosition: [number, number]
	) {
		let keypoints: [number, number][] = [
			math.add(position, [-19, 20]),
			math.add(position, [19, 20]),
			math.add(position, [19, 46]),
			math.add(position, [-19, 46])
		];

		let stopHorizontal = (math.add(keypoints, [derivedPosition[0], 0]) as [number, number][])
			.map((pos: [number, number]) => getPixelIndex(pos, walkableMap))
			.some((index: number) => walkableMap.pixels[index] == 0);
		let stopVertical = (math.add(keypoints, [0, derivedPosition[1]]) as [number, number][])
			.map((pos: [number, number]) => getPixelIndex(pos, walkableMap))
			.some((index: number) => walkableMap.pixels[index] == 0);
		let stopBoth = (math.add(keypoints, derivedPosition) as [number, number][])
			.map((pos: [number, number]) => getPixelIndex(pos, walkableMap))
			.some((index: number) => walkableMap.pixels[index] == 0);

		if (stopHorizontal) derivedPosition[0] = 0;
		if (stopVertical) derivedPosition[1] = 0;
		if (stopBoth && !stopVertical) derivedPosition[0] = 0;
		if (stopBoth && !stopHorizontal) derivedPosition[1] = 0;
		return derivedPosition;
	}

	function isPlayerInColor(
		logicMap: p5Type.Image,
		position: [number, number],
		color: [number, number, number, number]
	) {
		let keypoint = math.add(position, [0, 40]) as [number, number];
		let index = getPixelIndex(keypoint, logicMap);
		return (
			math.abs(logicMap.pixels[index] - color[0]) <= 2 &&
			math.abs(logicMap.pixels[index + 1] - color[1]) <= 2 &&
			math.abs(logicMap.pixels[index + 2] - color[2]) <= 2 &&
			math.abs(logicMap.pixels[index + 3] - color[3]) <= 2
		);
	}

	function getAlpha(transparency: number): number {
		let minAlpha = 20;
		return minAlpha + (255 - minAlpha) * (1 - transparency);
	}

	function extractCache(visionVec: [number, number], p5: p5Type): p5Type.Image {
		let cache = p5.createImage(width, height);
		visionVec = normalize(visionVec) as [number, number];
		let x: number;
		let y: number;
		let index: number;
		let pixelVec: [number, number];
		let range: number;
		let transparency: number;
		let color: number;
		for (x = 0; x < width; x++) {
			for (y = 0; y < height; y++) {
				index = getPixelIndex([x, y], cache);
				transparency = 0;
				pixelVec = [x - width / 2, y - height / 2];
				range = vectorNorm(pixelVec);
				pixelVec = normalize(pixelVec) as [number, number];
				transparency = math.pow(math.max(0, math.dot(pixelVec, visionVec)), 2) as number;
				transparency = transparency * math.max(0, 1 - range / nightVisionRange);
				transparency = math.max(transparency, 1 - range / visionCircleRange);
				color = 150 * transparency;
				cache.set(x, y, p5.color(color, color, color, getAlpha(transparency)));
			}
		}
		cache.updatePixels();
		return cache;
	}
	function hexToRgb(hex: string): [number, number, number] {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
			: [255, 255, 255];
	}

	function extractContour(
		player: p5Type.Image,
		color: [number, number, number, number],
		p5: p5Type
	): p5Type.Image {
		let x: number;
		let y: number;
		let index: number;
		let playerContours = p5.createImage(player.width, player.height);
		for (x = 0; x < player.width; x++) {
			for (y = 0; y < player.height; y++) {
				index = getPixelIndex([x, y], player) + 3; // Alpha channel
				if (player.pixels[index] == 0) continue;
				if (
					(x == 0 ? true : player.pixels[index - 4] == 0) ||
					(y == 0 ? true : player.pixels[index - 4 * player.width] == 0) ||
					(x == player.width - 1 ? true : player.pixels[index + 4] == 0) ||
					(y == player.height - 1 ? true : player.pixels[index + 4 * player.width] == 0) ||
					x % 48 == 0 ||
					x % 48 == 47
				) {
					playerContours.set(x, y, p5.color(...color));
				} else {
					playerContours.set(x, y, p5.color(0, 0, 0, 0));
				}
			}
		}
		playerContours.updatePixels();
		return playerContours;
	}

	function updateStep(step: boolean, stepNumber: number, stepsAchieved: Array<boolean>) {
		let alreadyAchieved = step;
		let previousStepIsAchieved = stepNumber === 0 || stepsAchieved[stepNumber - 1];
		let playerPositionIsGood = isPlayerInColor(
			logicMap,
			$multiStore.users[$multiStore.username].position,
			[stepNumber * 10, stepNumber * 10, stepNumber * 10, 255]
		);
		return alreadyAchieved || (previousStepIsAchieved && playerPositionIsGood);
	}

	const sketch = (p5: p5Type) => {
		p5.preload = () => {
			background = p5.loadImage(`levels/${$multiStore.common.level}/background.webp`);
			foreground = p5.loadImage(`levels/${$multiStore.common.level}/foreground.webp`);
			for (const [username, store] of Object.entries($multiStore.users)) {
				players[username] = p5.loadImage(`players/${store.skin}.webp`);
			}
			walkableMap = p5.loadImage(`levels/${$multiStore.common.level}/walkable.webp`);
			logicMap = p5.loadImage(`levels/${$multiStore.common.level}/logic.webp`);
			darkness = p5.loadImage(`levels/${$multiStore.common.level}/darkness.webp`);
			fetch(`levels/${$multiStore.common.level}/level.json`)
				.then((response) => response.json())
				.then((json) => {
					initialPosition = json.initialPosition;
					stepsImages = json.stepsImages.map((path: string) =>
						p5.loadImage(`levels/${$multiStore.common.level}/${path}`)
					);
					reset();
				});
			if (!generateCaches) {
				nightVisionCaches = {
					0: p5.loadImage(`assets/night_cache_0.webp`),
					1: p5.loadImage(`assets/night_cache_1.webp`),
					2: p5.loadImage(`assets/night_cache_2.webp`),
					3: p5.loadImage(`assets/night_cache_3.webp`),
					4: p5.loadImage(`assets/night_cache_4.webp`),
					5: p5.loadImage(`assets/night_cache_5.webp`),
					6: p5.loadImage(`assets/night_cache_6.webp`),
					7: p5.loadImage(`assets/night_cache_7.webp`)
				};
			}
		};

		p5.setup = () => {
			walkableMap.loadPixels();
			logicMap.loadPixels();
			for (const [username, store] of Object.entries($multiStore.users)) {
				players[username].loadPixels();
				playersContours[username] = extractContour(
					players[username],
					hexToRgb($multiStore.users[username].color),
					p5
				);
			}
			if (generateCaches) {
				nightVisionCaches = {
					0: extractCache([+1, 0], p5),
					1: extractCache([+1, +1], p5),
					2: extractCache([0, +1], p5),
					3: extractCache([-1, +1], p5),
					4: extractCache([-1, 0], p5),
					5: extractCache([-1, -1], p5),
					6: extractCache([0, -1], p5),
					7: extractCache([+1, -1], p5)
				};
				nightVisionCaches[0].save('night_cache_0.png', 'png');
				nightVisionCaches[1].save('night_cache_1.png', 'png');
				nightVisionCaches[2].save('night_cache_2.png', 'png');
				nightVisionCaches[3].save('night_cache_3.png', 'png');
				nightVisionCaches[4].save('night_cache_4.png', 'png');
				nightVisionCaches[5].save('night_cache_5.png', 'png');
				nightVisionCaches[6].save('night_cache_6.png', 'png');
				nightVisionCaches[7].save('night_cache_7.png', 'png');
			}
			p5.createCanvas(width, height);
			p5.frameRate(FPS);
			$multiStore.users[$multiStore.username].lightOn = true;
		};

		p5.keyPressed = () => {
			if (p5.keyCode == p5.ENTER) {
				if (!$multiStore.users[$multiStore.username].lightOn) {
					$multiStore.users[$multiStore.username].lightOn = true;
					stepsAchieved = stepsAchieved.map((step) => false);
				}
			} else if (
				!inputs.includes(true) &&
				p5.keyIsDown(88) &&
				!$multiStore.users[$multiStore.username].lightOn
			) {
				stepsAchieved = stepsAchieved.map((step, index, array) => updateStep(step, index, array));
			}
		};

		p5.draw = () => {
			let oldInputs = inputs;
			motion = [0, 0];
			inputs = [false, false, false, false];
			let defaultPlayerOrientation: number = playerOrientation;
			let getDefault: boolean = false;
			if (p5.keyIsDown(p5.LEFT_ARROW)) {
				motion[0] -= 1;
				inputs[0] = true;
				defaultPlayerOrientation = 4;
				if (!oldInputs[0]) playerOrientation = 4;
			} else if (oldInputs[0]) getDefault = true;
			if (p5.keyIsDown(p5.RIGHT_ARROW)) {
				motion[0] += 1;
				inputs[1] = true;
				defaultPlayerOrientation = 0;
				if (!oldInputs[1]) playerOrientation = 0;
			} else if (oldInputs[1]) getDefault = true;
			if (p5.keyIsDown(p5.UP_ARROW)) {
				motion[1] -= 1;
				inputs[2] = true;
				defaultPlayerOrientation = 6;
				if (!oldInputs[2]) playerOrientation = 6;
			} else if (oldInputs[2]) getDefault = true;
			if (p5.keyIsDown(p5.DOWN_ARROW)) {
				motion[1] += 1;
				inputs[3] = true;
				defaultPlayerOrientation = 2;
				if (!oldInputs[3]) playerOrientation = 2;
			} else if (oldInputs[3]) getDefault = true;
			if (getDefault) playerOrientation = defaultPlayerOrientation;

			controlOrientation = vectorNorm(motion) != 0 ? getVisionIndex(motion) : playerOrientation;

			let derivedPositionNorm = vectorNorm(motion);
			if (derivedPositionNorm != 0) {
				motion = math.multiply(math.divide(motion, derivedPositionNorm), maxSpeed) as [
					number,
					number
				];
				motion = math.round(motion);
				motion = handleWalls(walkableMap, $multiStore.users[$multiStore.username].position, motion);
				$multiStore.users[$multiStore.username].position = math.add(
					$multiStore.users[$multiStore.username].position,
					motion
				);
			}
			if (
				isPlayerInColor(
					logicMap,
					$multiStore.users[$multiStore.username].position,
					[255, 0, 0, 255]
				)
			) {
				if (!$multiStore.users[$multiStore.username].victory && stepsAchieved.every((v) => v)) {
					stepsAchieved = stepsAchieved.map((step) => false);
					$multiStore.users[$multiStore.username].victory = true;
				}
			}

			if (
				isPlayerInColor(
					logicMap,
					$multiStore.users[$multiStore.username].position,
					[0, 255, 0, 255]
				)
			)
				$multiStore.users[$multiStore.username].lightOn = false;
			if (
				isPlayerInColor(
					logicMap,
					$multiStore.users[$multiStore.username].position,
					[0, 0, 255, 255]
				)
			)
				$multiStore.users[$multiStore.username].lightOn = true;

			// display
			cycle = (cycle + 1) % 6;
			display(p5);
		};
	};
</script>

<article
	data-theme={$multiStore.users[$multiStore.username].lightOn ? 'light' : 'dark'}
	class="h-screen w-screen mt-0 fixed"
>
	<h1 class="text-center text-7xl mt-3">The Spy Game</h1>
	<div class="flex items-center justify-center">
		<p class="text-lg font-bold">You need to steal this object:</p>
		<img src={`levels/${$multiStore.common.level}/goalObject.webp`} alt="object to steal" />
	</div>

	<div class="grid h-10 place-items-center mx-auto">
		<P5 {sketch} />
	</div>
</article>