<script>
	let blocks = [
		{ title: 'HEART AWAY', artist: 'Artist 1', video: '/path/to/video1.mp4' },
		{ title: 'DELI', artist: 'Artist 2', video: '/path/to/video2.mp4' },
		{ title: 'CUFF IT', artist: 'Artist 3', video: '/path/to/video3.mp4' },
		{ title: 'PUSHIN P', artist: 'Artist 4', video: '/path/to/video4.mp4' },
		{ title: 'JERK', artist: 'Artist 5', video: '/path/to/video5.mp4' }
	];
	let currBlock = 0;
	let videoUrl = '';

	function selectBlock(index) {
		currBlock = index;
		videoUrl = blocks[currBlock].video;
	}

	function nextBlock() {
		currBlock = (currBlock + 1) % blocks.length;
		videoUrl = blocks[currBlock].video;
	}

	function goToDance() {
		// go to /cuffit
		window.location.href = '/cuffit';
	}
</script>

<div class="blocks pt-5 flex justify-center">
	{#each blocks as block, i (i)}
		<button
			on:click={() => selectBlock(i)}
			class:rounded-l-md={i === 0}
			class:rounded-r-md={i === blocks.length - 1}
			class="block mx-1 {currBlock === i ? 'selected' : ''}"
		>
			<div class="title">{block.title}</div>
			<div class="artist">{block.artist}</div>
		</button>
	{/each}
</div>

<div class="player">
	<img src="src/lib/assets/iphone.png" alt="iPhone" class="iphone" />
	{#if videoUrl !== ''}
		<video src={videoUrl} controls autoplay class="video" />
	{/if}
</div>

<div class="flex flex-row justify-between items-center text-black">
	<button on:click={nextBlock} class="w-[200px] h-[100px] text-2xl bg-yellow-200 rounded-md">
		Next
	</button>
	<button on:click={goToDance} class="w-[200px] h-[100px] text-2xl bg-yellow-200 rounded-md">
		Play
	</button>
</div>

<style>
	.blocks {
		display: flex;
	}

	.block {
		background: lightgray;
		padding: 1em;
		text-align: center;
		flex: 1;
		min-width: 0; /* Allows text to truncate */
	}

	.title {
		font-size: 1.5em;
		margin-bottom: 0.5em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis; /* Truncate text */
	}

	.artist {
		font-size: 1em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis; /* Truncate text */
	}

	.block.selected {
		background: #fef08a;
	}

	.player {
		position: relative;
		width: 200px;
		height: 400px;
		margin: 0 auto;
	}

	.iphone {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.video {
		position: absolute;
		/* Adjust these values to position the video correctly on the iPhone image */
		top: 10%;
		left: 10%;
		width: 80%;
		height: 80%;
	}
</style>
