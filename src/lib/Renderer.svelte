<script lang="ts">
	import * as THREE from 'three';
	import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
	import { onMount } from 'svelte';
	import type { KPFrame } from 'kml-pipe-ts/dist/types';

	export let pose: KPFrame;

	onMount(() => {
		// renderer
		const renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		document.body.appendChild(renderer.domElement);

		// camera
		const camera = new THREE.PerspectiveCamera(
			30.0,
			window.innerWidth / window.innerHeight,
			0.1,
			20.0
		);
		camera.position.set(0.0, 1.0, 5.0);

		// camera controls
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.screenSpacePanning = true;
		controls.target.set(0.0, 1.0, 0.0);
		controls.update();

		// scene
		const scene = new THREE.Scene();

		// light
		const light = new THREE.DirectionalLight(0xffffff);
		light.position.set(1.0, 1.0, 1.0).normalize();
		scene.add(light);

		// gltf and vrm
		let currentVrm = undefined;
		const loader = new GLTFLoader();
		loader.crossOrigin = 'anonymous';

		loader.register((parser) => {
			return new VRMLoaderPlugin(parser);
		});

		loader.load(
			'/VRM1_Constraint_Twist_Sample.vrm',

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

		// helpers
		// const gridHelper = new THREE.GridHelper(10, 10);
		// scene.add(gridHelper);

		const axesHelper = new THREE.AxesHelper(5);
		scene.add(axesHelper);

		// animate
		const clock = new THREE.Clock();

		function animate() {
			requestAnimationFrame(animate);

			const deltaTime = clock.getDelta();

			if (currentVrm && pose) {
				// tweak bones
				// const s = 0.25 * Math.PI * Math.sin(Math.PI * clock.elapsedTime);
				// currentVrm.humanoid.getNormalizedBoneNode('neck').rotation.y = s;
				// currentVrm.humanoid.getNormalizedBoneNode('leftUpperArm').rotation.z = s;
				// currentVrm.humanoid.getNormalizedBoneNode('rightUpperArm').rotation.x = s;
				console.log(currentVrm.humanoid._normalizedHumanBones);
				let leftUpperArmRotation = computeEulerAnglesBetweenPoints(
					pose.keypoints[12],
					pose.keypoints[11],
					pose.keypoints[13]
				); //computeEulerAngles(pose.keypoints[13], pose.keypoints[11]);
				currentVrm.humanoid
					.getNormalizedBoneNode('leftUpperArm')
					.rotation.set(0, leftUpperArmRotation.y, leftUpperArmRotation.z);
				console.log('Left:' + JSON.stringify(leftUpperArmRotation));
				let rightUpperArmRotation = computeEulerAnglesBetweenPoints(
					pose.keypoints[11],
					pose.keypoints[12],
					pose.keypoints[14]
				); //computeEulerAngles(pose.keypoints[12], pose.keypoints[10]);
				currentVrm.humanoid
					.getNormalizedBoneNode('rightUpperArm')
					.rotation.set(0, rightUpperArmRotation.y, rightUpperArmRotation.z);
				console.log('Right:' + JSON.stringify(rightUpperArmRotation));

				let leftElbowRotation = computeEulerAnglesBetweenPoints(
					pose.keypoints[11],
					pose.keypoints[13],
					pose.keypoints[15]
				); //computeEulerAngles(pose.keypoints[13], pose.keypoints[11]);
				currentVrm.humanoid
					.getNormalizedBoneNode('leftLowerArm')
					.rotation.set(0, leftElbowRotation.y, leftElbowRotation.z);
				console.log('Left:' + JSON.stringify(leftElbowRotation));
				let rightElbowRotation = computeEulerAnglesBetweenPoints(
					pose.keypoints[12],
					pose.keypoints[14],
					pose.keypoints[16]
				); //computeEulerAngles(pose.keypoints[12], pose.keypoints[10]);
				currentVrm.humanoid
					.getNormalizedBoneNode('rightLowerArm')
					.rotation.set(0, rightElbowRotation.y, rightElbowRotation.z);
				console.log('Right Elbow:' + JSON.stringify(rightElbowRotation));

				// update vrm
				currentVrm.update(deltaTime);
			}

			renderer.render(scene, camera);
		}

		animate();
	});

	function computeEulerAngles(P1, P2) {
		// Translate points so that P2 is at the origin
		let dx = P1.x - P2.x;
		let dy = P1.y - P2.y;
		let dz = P1.z - P2.z;

		// Calculate the distances
		let r = Math.sqrt(dx * dx + dy * dy + dz * dz);
		let dxy = Math.sqrt(dx * dx + dy * dy);

		// Calculate Euler angles
		let roll = Math.atan2(dy, dx); // Rotation around Z-axis
		let pitch = Math.atan2(dz, dxy); // Rotation around Y-axis
		let yaw = Math.atan2(dy, dz); // Rotation around X-axis

		return {
			x: roll,
			y: pitch,
			z: yaw
		};
	}

	function computeEulerAnglesBetweenPoints(A, B, C) {
		// Calculate vectors AB and BC
		let AB = { x: B.x - A.x, y: B.y - A.y, z: B.z - A.z };
		let BC = { x: C.x - B.x, y: C.y - B.y, z: C.z - B.z };

		// Normalize the vectors
		let magAB = Math.sqrt(AB.x * AB.x + AB.y * AB.y + AB.z * AB.z);
		let magBC = Math.sqrt(BC.x * BC.x + BC.y * BC.y + BC.z * BC.z);
		AB = { x: AB.x / magAB, y: AB.y / magAB, z: AB.z / magAB };
		BC = { x: BC.x / magBC, y: BC.y / magBC, z: BC.z / magBC };

		// Compute the cross product of AB and BC
		let cross = {
			x: AB.y * BC.z - AB.z * BC.y,
			y: AB.z * BC.x - AB.x * BC.z,
			z: AB.x * BC.y - AB.y * BC.x
		};

		// Compute the dot product of AB and BC
		let dot = AB.x * BC.x + AB.y * BC.y + AB.z * BC.z;

		// Calculate the quaternion
		let w = Math.sqrt(
			(magAB + dot) * (magAB + dot) + cross.x * cross.x + cross.y * cross.y + cross.z * cross.z
		);
		let q = { w: w, x: cross.x, y: cross.y, z: cross.z };

		// Normalize the quaternion
		let magQ = Math.sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
		q = { w: q.w / magQ, x: q.x / magQ, y: q.y / magQ, z: q.z / magQ };

		// Convert the quaternion to Euler angles
		let roll = Math.atan2(2 * (q.w * q.x + q.y * q.z), 1 - 2 * (q.x * q.x + q.y * q.y));
		let pitch = Math.asin(2 * (q.w * q.y - q.z * q.x));
		let yaw = Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));

		return {
			x: roll,
			y: pitch,
			z: yaw
		};
	}

	function poseAngles(joint) {
		if (this.body_pose.length == 0) return;
		const pose_left_shoulder = new THREE.Vector3(
			this.body_pose[11].slice(0, 3)[0],
			-this.body_pose[11].slice(0, 3)[1],
			-this.body_pose[11].slice(0, 3)[2]
		);
		const pose_right_shoulder = new THREE.Vector3(
			this.body_pose[12].slice(0, 3)[0],
			-this.body_pose[12].slice(0, 3)[1],
			-this.body_pose[12].slice(0, 3)[2]
		);
		const pose_left_elbow = new THREE.Vector3(
			this.body_pose[13].slice(0, 3)[0],
			-this.body_pose[13].slice(0, 3)[1],
			-this.body_pose[13].slice(0, 3)[2]
		);
		const pose_right_elbow = new THREE.Vector3(
			this.body_pose[14].slice(0, 3)[0],
			-this.body_pose[14].slice(0, 3)[1],
			-this.body_pose[14].slice(0, 3)[2]
		);
		const pose_left_hand = new THREE.Vector3(
			this.body_pose[15].slice(0, 3)[0],
			-this.body_pose[15].slice(0, 3)[1],
			-this.body_pose[15].slice(0, 3)[2]
		);
		const pose_right_hand = new THREE.Vector3(
			this.body_pose[16].slice(0, 3)[0],
			-this.body_pose[16].slice(0, 3)[1],
			-this.body_pose[16].slice(0, 3)[2]
		);
		const pose_left_hand_thumb_4 = new THREE.Vector3(
			this.body_pose[21].slice(0, 3)[0],
			-this.body_pose[21].slice(0, 3)[1],
			-this.body_pose[21].slice(0, 3)[2]
		);
		const pose_right_hand_thumb_4 = new THREE.Vector3(
			this.body_pose[22].slice(0, 3)[0],
			-this.body_pose[22].slice(0, 3)[1],
			-this.body_pose[22].slice(0, 3)[2]
		);
		const pose_left_hip = new THREE.Vector3(
			this.body_pose[23].slice(0, 3)[0],
			-this.body_pose[23].slice(0, 3)[1],
			-this.body_pose[23].slice(0, 3)[2]
		);
		const pose_right_hip = new THREE.Vector3(
			this.body_pose[24].slice(0, 3)[0],
			-this.body_pose[24].slice(0, 3)[1],
			-this.body_pose[24].slice(0, 3)[2]
		);

		const pose_hips = new THREE.Vector3()
			.copy(pose_left_hip)
			.add(pose_right_hip)
			.multiplyScalar(0.5);
		const pose_spine_2 = new THREE.Vector3()
			.copy(pose_right_shoulder)
			.add(pose_left_shoulder)
			.multiplyScalar(0.5); //.multiplyScalar(0.728);

		var point_parent;
		var point_articulation;
		var point_child;
		if (joint == this.neck) {
			var point_parent = pose_hips;
			var point_articulation = pose_spine_2;
			var point_arm = pose_right_elbow;

			const vec_parent = new THREE.Vector3()
				.subVectors(point_articulation, point_parent)
				.multiplyScalar(0.375);
			const vec_bone = new THREE.Vector3().subVectors(point_arm, point_articulation);

			setJointAnglesFromVects(joint, vec_bone, vec_parent);
		} else if (joint == this.right_arm) {
			point_parent = pose_spine_2;
			point_articulation = pose_right_shoulder;
			point_child = pose_right_elbow;
		} else if (joint == this.left_arm) {
			point_parent = pose_spine_2;
			point_articulation = pose_left_shoulder;
			point_child = pose_left_elbow;
		} else if (joint == this.right_fore_arm) {
			point_parent = pose_right_shoulder;
			point_articulation = pose_right_elbow;
			point_child = pose_right_hand;
		} else if (joint == this.left_fore_arm) {
			point_parent = pose_left_shoulder;
			point_articulation = pose_left_elbow;
			point_child = pose_left_hand;
		} else if (joint == this.right_hand) {
			point_parent = pose_right_elbow;
			point_articulation = pose_right_hand;
			point_child = pose_right_hand_thumb_4;
		} else if (joint == this.left_hand) {
			point_parent = pose_left_elbow;
			point_articulation = pose_left_hand;
			point_child = pose_left_hand_thumb_4;
		}
		const vec_parent = new THREE.Vector3().subVectors(point_articulation, point_parent);
		const vec_bone = new THREE.Vector3().subVectors(point_child, point_articulation);
		setJointAnglesFromVects(joint, vec_parent, vec_bone);
	}
</script>
