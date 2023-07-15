<script lang="ts">
	import P5 from 'p5-svelte';
	import type * as p5Type from 'p5';
	import * as math from 'mathjs';
	import { base } from '$app/paths';

	export let playerName: string;
	export let playerColor: [number, number, number, number];
	export let levelName: string;
	export let lightOn: boolean;

	let background: p5Type.Image;
	let foreground: p5Type.Image;
	let walkableMap: p5Type.Image;
	let logicMap: p5Type.Image;
	let darkness: p5Type.Image;
	let nightVisionCaches: { [key: number]: p5Type.Image };
	let player: p5Type.Image;
	let playerContours: p5Type.Image;

	let width = 500;
	let height = 500;
	let playerWidth = 48;
	let playerHeight = 96;
	let FPS = 15;
	let maxSpeed = 8;
	let nightVisionRange = 200;
	let visionHalfAngle = math.pi / 4;
	let visionAngleDecay = visionHalfAngle * 0.1;
	let visionCircleRange = 40;

	let inputs: [boolean, boolean, boolean, boolean] = [false, false, false, false];
	let motion: [number, number];
	let orientation: string = 'down';
	let cycle: number = 0;
	let animationTable: { [key: string]: number } = {
		idle: 0,
		walk: 1152,
		right: 0,
		up: 288,
		left: 576,
		down: 864
	};

	let position: [number, number];
	let stepsAchieved: Array<boolean>;
	let stepsText: Array<string>;

	let gameState = 'Ready to steal';

	function display(
		p5: p5Type,
		background: p5Type.Image,
		foreground: p5Type.Image,
		player: p5Type.Image,
		position: [number, number],
		orientation: string,
		cycle: number
	) {
		p5.background(lightOn ? 'white' : 'black');
		p5.image(
			background,
			0,
			0,
			width,
			height,
			math.ceil(position[0] - width / 2),
			math.ceil(position[1] - height / 2),
			width,
			height
		);
		let animationScore =
			animationTable[inputs.includes(true) ? 'walk' : 'idle'] +
			animationTable[orientation] +
			playerWidth * cycle;

		p5.image(
			player,
			math.ceil(width / 2) - playerWidth / 2,
			math.ceil(height / 2) - playerHeight / 2,
			playerWidth,
			playerHeight,
			animationScore,
			0,
			playerWidth,
			playerHeight
		);
		p5.image(
			foreground,
			0,
			0,
			width,
			height,
			math.ceil(position[0] - width / 2),
			math.ceil(position[1] - height / 2),
			width,
			height
		);
		if (!lightOn) {
			p5.image(
				darkness,
				0,
				0,
				width,
				height,
				math.ceil(position[0] - width / 2),
				math.ceil(position[1] - height / 2),
				width,
				height
			);
			p5.image(nightVisionCaches[getVisionIndex(motion, orientation)], 0, 0);
			p5.image(
				playerContours,
				math.ceil(width / 2) - playerWidth / 2,
				math.ceil(height / 2) - playerHeight / 2,
				playerWidth,
				playerHeight,
				animationScore,
				0,
				playerWidth,
				playerHeight
			);
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

	function getVisionIndex(motion: [number, number], orientation: string): number {
		if (vectorNorm(motion) == 0) {
			if (orientation == 'right') return 0;
			if (orientation == 'down') return 2;
			if (orientation == 'left') return 4;
			return 6;
		}
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
				pixelVec = [x - width / 2, y - height / 2];
				range = vectorNorm(pixelVec);
				transparency = 0;
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

	function extractContour(player: p5Type.Image, p5: p5Type): p5Type.Image {
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
					playerContours.set(x, y, p5.color(...playerColor));
				} else {
					playerContours.set(x, y, p5.color(0, 0, 0, 0));
				}
			}
		}
		playerContours.updatePixels();
		return playerContours;
	}

	const sketch = (p5: p5Type) => {
		p5.preload = () => {
			background = p5.loadImage(`levels/${levelName}/background.webp`);
			foreground = p5.loadImage(`levels/${levelName}/foreground.webp`);
			player = p5.loadImage(`players/${playerName}.webp`);
			walkableMap = p5.loadImage(`levels/${levelName}/walkable.webp`);
			logicMap = p5.loadImage(`levels/${levelName}/logic.webp`);
			darkness = p5.loadImage(`levels/${levelName}/darkness.webp`);
			fetch(`levels/${levelName}/level.json`)
				.then((response) => response.json())
				.then((json) => {
					position = json.initialPosition;
					stepsAchieved = json.stepsAchieved;
					stepsText = json.stepsText;
				});
		};

		p5.setup = () => {
			walkableMap.loadPixels();
			logicMap.loadPixels();
			player.loadPixels();
			playerContours = extractContour(player, p5);
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
			p5.createCanvas(width, height);
			p5.frameRate(FPS);
		};

		p5.draw = () => {
			let oldInputs = inputs;
			motion = [0, 0];
			inputs = [false, false, false, false];
			let defaultOrientation: string = orientation;
			let getDefault: boolean = false;
			if (p5.keyIsDown(p5.LEFT_ARROW)) {
				motion[0] -= 1;
				inputs[0] = true;
				defaultOrientation = 'left';
				if (!oldInputs[0]) orientation = 'left';
			} else if (oldInputs[0]) getDefault = true;
			if (p5.keyIsDown(p5.RIGHT_ARROW)) {
				motion[0] += 1;
				inputs[1] = true;
				defaultOrientation = 'right';
				if (!oldInputs[1]) orientation = 'right';
			} else if (oldInputs[1]) getDefault = true;
			if (p5.keyIsDown(p5.UP_ARROW)) {
				motion[1] -= 1;
				inputs[2] = true;
				defaultOrientation = 'up';
				if (!oldInputs[2]) orientation = 'up';
			} else if (oldInputs[2]) getDefault = true;
			if (p5.keyIsDown(p5.DOWN_ARROW)) {
				motion[1] += 1;
				inputs[3] = true;
				defaultOrientation = 'down';
				if (!oldInputs[3]) orientation = 'down';
			} else if (oldInputs[3]) getDefault = true;
			if (getDefault) orientation = defaultOrientation;

			let derivedPositionNorm = vectorNorm(motion);
			if (derivedPositionNorm != 0) {
				motion = math.multiply(math.divide(motion, derivedPositionNorm), maxSpeed) as [
					number,
					number
				];
				motion = math.round(motion);
				motion = handleWalls(walkableMap, position, motion);
				position = math.add(position, motion);
			}
			// logic
			function updateStep(step: boolean, stepNumber: number, stepsAchieved: Array<boolean>) {
				let alreadyAchieved = step;
				let previousStepIsAchieved = stepNumber === 0 || stepsAchieved[stepNumber - 1];
				let playerPositionIsGood = isPlayerInColor(logicMap, position, [
					stepNumber * 10,
					stepNumber * 10,
					stepNumber * 10,
					255
				]);
				return alreadyAchieved || (previousStepIsAchieved && playerPositionIsGood);
			}
			if (vectorNorm(motion) == 0 && p5.keyIsDown(88))
				stepsAchieved = stepsAchieved.map((step, index, array) => updateStep(step, index, array));
			let indexLastAcheivedStep = stepsAchieved.lastIndexOf(true);
			gameState = indexLastAcheivedStep === -1 ? gameState : stepsText[indexLastAcheivedStep];
			if (stepsAchieved.every((v) => v) && isPlayerInColor(logicMap, position, [255, 0, 0, 255])) {
				gameState = 'Victory';
			}

			cycle = (cycle + 1) % 6;
			// display
			display(p5, background, foreground, player, position, orientation, cycle);
		};
	};
</script>

<h3>{levelName}</h3>
<p>{gameState}</p>
<div class="m-0 w-full h-full">
	<P5 {sketch} />
</div>
