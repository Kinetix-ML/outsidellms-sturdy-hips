<script lang="ts">
	import '../../app.css';
	import Renderer from '$lib/Renderer.svelte';
	import type { KMLPipeline } from 'kml-pipe-ts';
	import { DataType } from 'kml-pipe-ts/dist/base_structs';
	import { CVImage, type Canvas, type KPFrame } from 'kml-pipe-ts/dist/types';
	import { onMount } from 'svelte';
	import { OutlineRender } from '$lib/OutlineRender.js';

	let pipe: KMLPipeline;
	let pose3D: KPFrame;
	let pose2D: KPFrame;
	let compare: KMLPipeline;
	let videoSource: HTMLVideoElement;
	let trainerSource: HTMLVideoElement;
	let canvas: HTMLCanvasElement;
	let hintCanvas: HTMLCanvasElement;
	let processing = false;
	let data: { kp2D: KPFrame; kp3D: KPFrame }[] = [];
	let startTime = 0;
	let loading = true;
	let files: FileList;
	let innerHeight: number = 0;
	let innerWidth: number = 0;
	let hRatio = 0;
	let wRatio = 0;
	let playing = false;
	let countdown = false;
	let h = 0;
	let w = 0;
	let time = 5;
	let scores: number[][] = [];
	let avgScoresSet: number[] = [];
	let goodFrameCount = 0;
	let curScore: number = 0;
	let multiplier: number = 1;
	let score: number = 0;
	let hints: number[] = [];
	let videoLoaded = false;
	let currentFrame = 0;
	let outlineRender: OutlineRender;

	let feedbackOptions = [
		{ text: 'Perfect', color: '#39ff14', score: 0.9 },
		{ text: 'Super', color: '#39ff14', score: 0.8 },
		{ text: 'Good', color: '#faed27', score: 0.7 },
		{ text: 'OK', color: '#faed27', score: 0.6 },
		{ text: 'Bad', color: '#fc1723', score: 0.5 },
		{ text: 'Miss', color: '#fc1723', score: 0.4 }
	];
	let currentFeedback = feedbackOptions[0];
	let hintFeedback = [];

	// $: files && files.length > 0 && loadVideo(files[0]);
	$: hRatio = innerHeight > 0 ? Math.round((innerHeight * 9) / 16) : 0;
	$: wRatio = innerWidth > 0 ? Math.round((innerWidth * 16) / 9) : 0;
	$: h = wRatio > innerHeight ? innerHeight : wRatio;
	$: w = wRatio > innerHeight ? hRatio : innerWidth;

	onMount(async () => {
		let { KMLPipeline } = await import('kml-pipe-ts');
		pipe = new KMLPipeline('Sturdy Hips KP Generation', 1, '261e97fd-18b1-4a3c-8cc1-b94a421c11bf');
		compare = new KMLPipeline('Sturdy Hips Compare', 1, '261e97fd-18b1-4a3c-8cc1-b94a421c11bf');
		outlineRender = new OutlineRender(hintCanvas, new CVImage(trainerSource));
		await pipe.initialize();
		await compare.initialize();
		await loadTrainerData();
		await startWebcam();
	});
	$: trainerSource && loadVideo('/demo.mp4');
	$: startCountdown(countdown);
	$: startGame(playing);
	const startGame = async (p: boolean) => {
		if (p) {
			startTime = Date.now();
			await trainerSource.play();
			console.log('played trainer source');
			videoSource.requestVideoFrameCallback(processFrame);
		}
	};
	const startCountdown = async (c: boolean) => {
		if (c) {
			console.log('starting countdown');
			countdown = true;
			time = 5;
			scores = [];
			multiplier = 1;
			goodFrameCount = 0;
			score = 0;
			let interval = setInterval(async function () {
				time--;
				if (time == 0) {
					countdown = false;
					playing = true;
					clearInterval(interval);
				}
			}, 1000);
		}
	};
	const startWebcam = async () => {
		const stream = await navigator.mediaDevices.getUserMedia({ video: true });
		videoSource.srcObject = stream;
		await videoSource.play();
		loading = false;
		//videoSource.requestVideoFrameCallback(processFrame);
	};
	const loadVideo = async (url: string) => {
		//let url = URL.createObjectURL(video);
		console.log(url);
		trainerSource.srcObject = null;
		trainerSource.src = url;
		videoLoaded = true;
		videoSource.requestVideoFrameCallback(processFrame);
	};
	const processFrame = async () => {
		if (!processing) {
			processing = true;
			canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
			let outputs = await pipe.execute([videoSource, canvas]);
			pose3D = outputs[0].value;
			pose2D = outputs[1].value;
			let time = Date.now();
			//console.log(time - startTime);
			let frame = findCorrelatedFrame(time - startTime);
			try {
				outlineRender.drawKeyPoints(data[hints.find((a) => a > currentFrame)].kp2D);
			} catch (err) {
				console.log(err);
			}
			//console.log(canvas.width);

			if (frame) {
				// hintIdx =
				// 	hintTimes.length -
				// 	hintTimes
				// 		.slice()
				// 		.reverse()
				// 		.findIndex((t) => t < time - startTime) -
				// 	1;
				//console.log(hintIdx);
				let similarity = await compare.execute([outputs[0].value, frame]);
				//console.log('similarity: ' + JSON.stringify(similarity[0].value));
				if (similarity[0].value != DataType.NoDetections) {
					// drawKeyPoints(outputs[1].value, videoSource, canvas, outputs[0].value);
					// console.log(outputs[1].value.keypoints.map((kp) => kp.name));
					scores.push(similarity[0].value);
					avgScoresSet.push(avgScores(similarity[0].value));
					avgScoresSet = avgScoresSet;
					scores = scores;
					score = clamp(rescale(avgScores(avgScoresSet), 0.7, 0.9), 0, 1);
				}
				// let frameScore = (avgScores(scores[scores.length - 1]) - 0.7) / 0.3;
				// console.log(frameScore);
				// if (frameScore < 0.6) {
				// 	curScore = 0;
				// 	multiplier = 1;
				// 	goodFrameCount = 0;
				// }
				// curScore += frameScore * 10;
				// goodFrameCount++;
				// multiplier = Math.floor(goodFrameCount / 80) + 1;
				// if (multiplier > 3) multiplier = 3;
				// score += curScore * multiplier;
				updateFeedback(currentFrame);
			} else {
				playing = false;
			}
			processing = false;
			videoSource.requestVideoFrameCallback(processFrame);
		}
	};
	const loadTrainerData = async () => {
		let response = await fetch('/data.json');
		let trainerData = await response.json();
		data = trainerData.frames;
		hints = trainerData.hints;
		console.log(hints);
	};
	const updateFeedback = (frameIdx: number) => {
		if (hintFeedback.length >= hints.length) return;
		let nextHint = hints[hintFeedback.length];
		if (frameIdx > nextHint) {
			let avgScore = avgScoresSet[frameIdx];
			let newFeedback = feedbackOptions.find((f) => avgScore > f.score);
			hintFeedback.push(newFeedback);
			currentFeedback = newFeedback;
		}
	};
	const findCorrelatedFrame = (time: number) => {
		//console.log('frame index: ' + Math.round((time / 1000) * 30));
		try {
			currentFrame = Math.round((time / 1000) * 30);
			return data[Math.round((time / 1000) * 30)].kp3D;
		} catch (err) {
			return null;
		}

		// for (let i = 0; i < data.length; i++) {
		// 	if (data[i].time > time) {
		// 		return data[i - 1];
		// 	}
		// }
	};
	const rescale = (p: number, min: number, max: number) => {
		return (p - min) / (max - min);
	};
	const clamp = (p: number, min: number, max: number) => {
		return p > max ? max : p < min ? min : p;
	};
	const avgScores = (s: number[]) => s.reduce((prev, cur) => prev + cur, 0) / s.length;
</script>

<svelte:window bind:innerHeight bind:innerWidth />

<div class="flex h-screen w-screen items-center justify-center bg-black">
	{#if w > 0 && h > 0}
		<div class="relative h-screen w-full bg-black">
			<div />
			<div class="">
				<video
					id="webcam"
					autoplay
					class={`absolute left-0 top-0 h-[${h}px] w-full scale-x-[-1]
					object-cover`}
					height={h}
					bind:this={videoSource}
					style="height: {h}px;"
				/>
			</div>

			<div class="absolute left-[32px] top-0 flex flex-col justify-center items-center h-screen">
				<div class=" shadow-lg rounded-xl max-h-[750px] h-[{h - 75}px] overflow-hidden">
					{#if !playing}
						<div
							class="absolute top-0 z-20 flex h-full w-full items-center justify-center overflow-hidden"
						>
							<div
								class="flex flex-col justify-center rounded-xl gap-3 bg-black bg-opacity-[70%] p-8 shadow-lg h-[{h -
									75}px] w-full"
								style="height: {h - 75}px; max-height: 750px;"
							>
								<div class="flex flex-col gap-3 justify-center items-center w-full">
									{#if !countdown}
										<img src="/sign2.png" class="w-[200px]" />
										<p class="text-2xl font-bold w-full">Welcome to Sturdy Hips</p>
										<p>Let's put your dancing skills to the test. Press start to begin the song!</p>
										<p class="w-full">Make sure to enable your webcam!</p>
										{#if scores.length > 0}
											<div class="flex flex-row items-baseline gap-2">
												<p>You scored</p>
												<p class="text-xl font-bold">{Math.round(score)}</p>
											</div>
										{/if}
										<button
											disabled={loading}
											class="m-auto rounded-lg {!loading
												? 'bg-[#F25CCA]'
												: 'bg-gray-600'} px-4 py-2 text-xl"
											on:click={() => {
												countdown = true;
											}}
											>{#if !loading}{scores.length > 0 ? 'Play Again' : 'Start'}{:else}<div
													class="loader"
												/>{/if}
										</button>
									{:else}
										<p class="text-4xl font-bold">{time}</p>
									{/if}
								</div>
							</div>
						</div>
					{/if}
					<video
						id="webcam2"
						muted={false}
						class={`z-2  overflow-hidden`}
						style="max-height: 750px; height: {h - 75}px"
						bind:this={trainerSource}
					/>
				</div>
			</div>
			<div class="absolute right-[432px] top-0 flex flex-col justify-center h-screen">
				<canvas
					id="hintCanvas"
					class="absolute z-10 w-[400px]"
					style="height: {h - 75}px"
					height={(h - 75) * 2}
					width={400 * 2}
					bind:this={hintCanvas}
				/>
			</div>
			<div>
				<canvas
					id="canvas"
					class="absolute left-0 top-0 z-10 h-[{h}px] w-full"
					height={h}
					width={innerWidth}
					bind:this={canvas}
					style="transform: scaleX(-1)"
				/>
			</div>
			<div class="absolute left-0 top-0 w-full">
				{#if playing}
					<div class="flex flex-row justify-center p-4">
						<!-- <p class="text-2xl font-bold">{hints[hintIdx]}</p> -->
					</div>
				{/if}
			</div>
			<!-- <div class="absolute top-32 left-0 w-full justify-center flex flex-col items-center">
				<div class="flex flex-row p-4 gap-4 items-center">
					<img src="/sign.png" class="w-[160px]" />
				</div>
			</div> -->
			<div class="absolute bottom-0 left-0 w-full justify-center flex flex-col items-center">
				<div>
					{#if currentFeedback}<p
							class="text-5xl font-bold"
							style="text-shadow: 2px 2px 15px {currentFeedback.color}"
						>
							{currentFeedback.text}
						</p>{/if}
				</div>
				<div class="flex flex-row p-8 gap-4 items-center w-[35%] justify-between">
					<div class="flex flex-row gap-4 items-baseline">
						<p class="text-5xl font-bold [text-shadow:_0_1px_0_rgb(0_0_0_/_40%)]">Cuff It</p>
						<!-- <p class="text-4xl font-bold">{multiplier}x</p> -->
					</div>
					<img src="/sign2.png" class="w-[50px]" />
					<!-- <div class="flex flex-row gap-1">
						<object data="/star_filled.svg" height="50" width="50" />
						<object data="/star_filled.svg" height="50" width="50" />
						<object data="/star_unfilled.svg" height="50" width="50" />
					</div> -->
				</div>
				<div class="z-30 h-4 w-full overflow-hidden bg-black bg-opacity-50">
					<div
						class="h-full {score < 0.6
							? 'bg-red-500'
							: score < 0.8
							? 'bg-yellow-500'
							: 'bg-green-500'}"
						style="width: {score * w}px"
					/>
				</div>
			</div>
		</div>
	{/if}
</div>
<!-- {#if data.length > 0 && hintCanvas}
	<OutlineRender
		pose2D={data[hints.find((a) => a > currentFrame)].kp2D}
		image={new CVImage(trainerSource)}
		canvas={hintCanvas}
	/>
{/if} -->
