<script lang="ts">
	import * as THREE from 'three';
	import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
	import { onMount } from 'svelte';
	import type { KPFrame } from 'kml-pipe-ts/dist/types';

	export let pose3D: KPFrame;
	export let pose2D: KPFrame;
	export let videoElement: HTMLVideoElement;
	export let guideCanvas: HTMLCanvasElement;
	export let canvas: HTMLCanvasElement;
	export let width: number;
	export let height: number;

	//Import Helper Functions from Kalidokit
	let Kalidokit;

	/* THREEJS WORLD SETUP */
	let currentVrm;

	onMount(async () => {
		Kalidokit = await import('kalidokit');
		// renderer
		const renderer = new THREE.WebGLRenderer({ alpha: true, canvas: canvas });
		//console.log(' Render canvas: ' + canvas.id);
		renderer.setSize(width, height);
		renderer.setPixelRatio(window.devicePixelRatio);
		//document.body.appendChild(renderer.domElement);

		// camera
		const orbitCamera = new THREE.PerspectiveCamera(35, 0.5, 0.1, 1000);
		orbitCamera.position.set(0.0, 1, -4);
		orbitCamera.lookAt(new THREE.Vector3(0.0, 1, 0.0));

		// controls
		// const orbitControls = new OrbitControls(orbitCamera, renderer.domElement);
		// orbitControls.screenSpacePanning = true;
		// orbitControls.target.set(0.0, 1, 0.0);
		// orbitControls.update();

		// scene
		const scene = new THREE.Scene();

		// light
		const light = new THREE.DirectionalLight(0xffffff);
		light.position.set(1.0, 1.0, 1.0).normalize();
		scene.add(light);

		// Main Render Loop
		const clock = new THREE.Clock();

		function animate() {
			requestAnimationFrame(animate);

			if (currentVrm) {
				// Update model to render physics
				currentVrm.update(clock.getDelta());
				onResults(pose3D);
			}
			renderer.render(scene, orbitCamera);
		}
		animate();

		/* VRM CHARACTER SETUP */
		// gltf and vrm
		//let currentVrm = undefined;
		const loader = new GLTFLoader();
		loader.crossOrigin = 'anonymous';

		loader.register((parser) => {
			return new VRMLoaderPlugin(parser);
		});

		loader.load(
			'https://cdn.glitch.com/29e07830-2317-4b15-a044-135e73c7f840%2FAshtra.vrm?v=1630342336981',

			(gltf) => {
				const vrm = gltf.userData.vrm;

				// calling these functions greatly improves the performance
				VRMUtils.removeUnnecessaryVertices(gltf.scene);
				VRMUtils.removeUnnecessaryJoints(gltf.scene);

				// Disable frustum culling
				vrm.scene.traverse((obj) => {
					obj.frustumCulled = false;
				});

				scene.add(vrm.scene);
				currentVrm = vrm;
				console.log(vrm);
			},

			(progress) =>
				console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%'),

			(error) => console.error(error)
		);
	});

	// Animate Rotation Helper function
	const rigRotation = (name, rotation = { x: 0, y: 0, z: 0 }, dampener = 1, lerpAmount = 0.3) => {
		if (!currentVrm) {
			return;
		}
		//const Part = currentVrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName[name]);
		const Part = currentVrm.humanoid.getRawBoneNode(
			name.substring(0, 1).toLowerCase() + name.substring(1)
		);
		if (!Part) {
			return;
		}

		console.log('Rotation: ' + name + ' ' + rotation.x + ' ' + rotation.y + ' ' + rotation.z);

		let euler = new THREE.Euler(
			rotation.x * dampener,
			rotation.y * dampener,
			rotation.z * dampener
		);
		let quaternion = new THREE.Quaternion().setFromEuler(euler);
		Part.quaternion.slerp(quaternion, lerpAmount); // interpolate

		//console.log('Rigged: ', name);
	};

	// Animate Position Helper Function
	const rigPosition = (name, position = { x: 0, y: 0, z: 0 }, dampener = 1, lerpAmount = 0.3) => {
		if (!currentVrm) {
			return;
		}
		//const Part = currentVrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName[name]);
		const Part = currentVrm.humanoid.getRawBoneNode(
			name.substring(0, 1).toLowerCase() + name.substring(1)
		);
		if (!Part) {
			return;
		}
		let vector = new THREE.Vector3(
			position.x * dampener,
			position.y * dampener,
			position.z * dampener
		);
		Part.position.lerp(vector, lerpAmount); // interpolate
	};

	/* VRM Character Animator */
	const animateVRM = (vrm, results) => {
		if (!vrm || !pose3D || !pose2D || !pose3D.keypoints || !pose2D.keypoints) {
			return;
		}
		// Take the results from `Holistic` and animate character based on its Face, Pose, and Hand Keypoints.
		let riggedPose, riggedLeftHand, riggedRightHand, riggedFace;

		// const faceLandmarks = results.faceLandmarks;
		// Pose 3D Landmarks are with respect to Hip distance in meters
		const pose3DLandmarks = pose3D.keypoints.map((kp) => ({
			...kp,
			y: -kp.y,
			visibility: kp.score
		}));
		// Pose 2D landmarks are with respect to videoWidth and videoHeight
		const pose2DLandmarks = pose2D.keypoints.map((kp) => ({
			...kp,
			y: kp.y / videoElement.videoHeight,
			x: kp.x / videoElement.videoWidth,
			visibility: kp.score
		}));
		//const pose2DLandmarks = pose2D.keypoints;
		console.log(videoElement.videoHeight);
		console.log('Pose 2D Landmarks: ' + JSON.stringify(pose2DLandmarks));
		// Be careful, hand landmarks may be reversed
		// const leftHandLandmarks = results.rightHandLandmarks;
		// const rightHandLandmarks = results.leftHandLandmarks;

		// Animate Pose
		if (pose2DLandmarks && pose3DLandmarks) {
			riggedPose = Kalidokit.Pose.solve(pose3DLandmarks, pose2DLandmarks, {
				runtime: 'mediapipe',
				video: videoElement
			});
			//console.log(riggedPose);
			rigRotation('Hips', riggedPose.Hips.rotation, 0.7);
			rigPosition(
				'Hips',
				{
					x: -riggedPose.Hips.position.x, // Reverse direction
					y: riggedPose.Hips.position.y + 1, // Add a bit of height
					z: -riggedPose.Hips.position.z // Reverse direction
				},
				1,
				0.07
			);

			rigRotation('Chest', riggedPose.Spine, 0.25, 0.3);
			rigRotation('Spine', riggedPose.Spine, 0.45, 0.3);

			rigRotation('RightUpperArm', riggedPose.RightUpperArm, 1, 0.3);
			rigRotation('RightLowerArm', riggedPose.RightLowerArm, 1, 0.3);
			rigRotation('LeftUpperArm', riggedPose.LeftUpperArm, 1, 0.3);
			rigRotation('LeftLowerArm', riggedPose.LeftLowerArm, 1, 0.3);

			rigRotation('LeftUpperLeg', riggedPose.LeftUpperLeg, 1, 0.3);
			rigRotation('LeftLowerLeg', riggedPose.LeftLowerLeg, 1, 0.3);
			rigRotation('RightUpperLeg', riggedPose.RightUpperLeg, 1, 0.3);
			rigRotation('RightLowerLeg', riggedPose.RightLowerLeg, 1, 0.3);
		}

		// // Animate Hands
		// if (leftHandLandmarks) {
		// 	riggedLeftHand = Kalidokit.Hand.solve(leftHandLandmarks, 'Left');
		// 	rigRotation('LeftHand', {
		// 		// Combine pose rotation Z and hand rotation X Y
		// 		z: riggedPose.LeftHand.z,
		// 		y: riggedLeftHand.LeftWrist.y,
		// 		x: riggedLeftHand.LeftWrist.x
		// 	});
		// 	rigRotation('LeftRingProximal', riggedLeftHand.LeftRingProximal);
		// 	rigRotation('LeftRingIntermediate', riggedLeftHand.LeftRingIntermediate);
		// 	rigRotation('LeftRingDistal', riggedLeftHand.LeftRingDistal);
		// 	rigRotation('LeftIndexProximal', riggedLeftHand.LeftIndexProximal);
		// 	rigRotation('LeftIndexIntermediate', riggedLeftHand.LeftIndexIntermediate);
		// 	rigRotation('LeftIndexDistal', riggedLeftHand.LeftIndexDistal);
		// 	rigRotation('LeftMiddleProximal', riggedLeftHand.LeftMiddleProximal);
		// 	rigRotation('LeftMiddleIntermediate', riggedLeftHand.LeftMiddleIntermediate);
		// 	rigRotation('LeftMiddleDistal', riggedLeftHand.LeftMiddleDistal);
		// 	rigRotation('LeftThumbProximal', riggedLeftHand.LeftThumbProximal);
		// 	rigRotation('LeftThumbIntermediate', riggedLeftHand.LeftThumbIntermediate);
		// 	rigRotation('LeftThumbDistal', riggedLeftHand.LeftThumbDistal);
		// 	rigRotation('LeftLittleProximal', riggedLeftHand.LeftLittleProximal);
		// 	rigRotation('LeftLittleIntermediate', riggedLeftHand.LeftLittleIntermediate);
		// 	rigRotation('LeftLittleDistal', riggedLeftHand.LeftLittleDistal);
		// }
		// if (rightHandLandmarks) {
		// 	riggedRightHand = Kalidokit.Hand.solve(rightHandLandmarks, 'Right');
		// 	rigRotation('RightHand', {
		// 		// Combine Z axis from pose hand and X/Y axis from hand wrist rotation
		// 		z: riggedPose.RightHand.z,
		// 		y: riggedRightHand.RightWrist.y,
		// 		x: riggedRightHand.RightWrist.x
		// 	});
		// 	rigRotation('RightRingProximal', riggedRightHand.RightRingProximal);
		// 	rigRotation('RightRingIntermediate', riggedRightHand.RightRingIntermediate);
		// 	rigRotation('RightRingDistal', riggedRightHand.RightRingDistal);
		// 	rigRotation('RightIndexProximal', riggedRightHand.RightIndexProximal);
		// 	rigRotation('RightIndexIntermediate', riggedRightHand.RightIndexIntermediate);
		// 	rigRotation('RightIndexDistal', riggedRightHand.RightIndexDistal);
		// 	rigRotation('RightMiddleProximal', riggedRightHand.RightMiddleProximal);
		// 	rigRotation('RightMiddleIntermediate', riggedRightHand.RightMiddleIntermediate);
		// 	rigRotation('RightMiddleDistal', riggedRightHand.RightMiddleDistal);
		// 	rigRotation('RightThumbProximal', riggedRightHand.RightThumbProximal);
		// 	rigRotation('RightThumbIntermediate', riggedRightHand.RightThumbIntermediate);
		// 	rigRotation('RightThumbDistal', riggedRightHand.RightThumbDistal);
		// 	rigRotation('RightLittleProximal', riggedRightHand.RightLittleProximal);
		// 	rigRotation('RightLittleIntermediate', riggedRightHand.RightLittleIntermediate);
		// 	rigRotation('RightLittleDistal', riggedRightHand.RightLittleDistal);
		// }
	};

	/* SETUP MEDIAPIPE HOLISTIC INSTANCE */

	$: onResults(pose3D);
	const onResults = (results) => {
		// Draw landmark guides
		// Animate model
		animateVRM(currentVrm, results);
	};
</script>
