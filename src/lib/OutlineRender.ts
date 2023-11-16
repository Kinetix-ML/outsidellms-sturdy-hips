import type { CVImage, Canvas, KPFrame } from 'kml-pipe-ts/dist/types';

let radius = 0.01;
let limbWidth = 30 * 2;
let shadowBlur = 6 * 2;
let shadowColor = 'rgba(242, 92, 202, 0.75)';
let fillColor = 'rgba(255, 255, 255, 0.9)';

export class OutlineRender {
	canvas: Canvas;
	image: CVImage;

	constructor(canvas: Canvas, image: CVImage) {
		this.canvas = canvas;
		this.image = image;
	}

	drawKeyPoints(f: KPFrame) {
		console.log('drawing keypoints');
		let { w, h } = this.image.getDims();
		let scale = this.canvas.width / w;
		let offsetY = (h * scale - this.canvas.height) / 2;
		let frame = { ...f };
		frame.keypoints = frame.keypoints.map((kp) => ({
			...kp,
			x: kp.x * scale,
			y: kp.y * scale - offsetY
		}));
		var ctx = this.canvas.getContext('2d');
		ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
		ctx?.beginPath();

		// draw head
		ctx?.moveTo(frame.keypoints[0].x, frame.keypoints[0].y);
		ctx?.arc(frame.keypoints[0].x, frame.keypoints[0].y, 40 * 2, 0, 2 * Math.PI, false);
		ctx.shadowColor = shadowColor;
		ctx.shadowBlur = 12 * 2;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx!.fillStyle = fillColor;
		ctx?.fill();
		ctx?.closePath();

		// draw legs
		ctx?.beginPath();
		ctx?.moveTo(frame.keypoints[24].x, frame.keypoints[24].y);
		//ctx?.arc(frame.keypoints[24].x, frame.keypoints[24].y, 5, 0, 2 * Math.PI, false);
		ctx?.lineTo(frame.keypoints[26].x, frame.keypoints[26].y);
		ctx?.lineTo(frame.keypoints[28].x, frame.keypoints[28].y);
		ctx!.lineWidth = limbWidth;
		ctx.shadowColor = shadowColor;
		ctx.shadowBlur = shadowBlur;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx!.lineCap = 'round';
		ctx!.lineJoin = 'round';
		ctx!.strokeStyle = fillColor;
		ctx?.stroke();
		ctx?.closePath();

		ctx?.beginPath();
		ctx?.moveTo(frame.keypoints[23].x, frame.keypoints[23].y);
		//ctx?.arc(frame.keypoints[24].x, frame.keypoints[24].y, 5, 0, 2 * Math.PI, false);
		ctx?.lineTo(frame.keypoints[25].x, frame.keypoints[25].y);
		ctx?.lineTo(frame.keypoints[27].x, frame.keypoints[27].y);
		ctx!.lineWidth = limbWidth;
		ctx.shadowColor = shadowColor;
		ctx.shadowBlur = shadowBlur;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx!.lineCap = 'round';
		ctx!.lineJoin = 'round';
		ctx!.strokeStyle = fillColor;
		ctx?.stroke();
		ctx?.closePath();

		// draw torso
		// ctx?.beginPath();
		// ctx?.moveTo(frame.keypoints[11].x, frame.keypoints[11].y);
		// roundedPoly(
		// 	ctx,
		// 	[frame.keypoints[11], frame.keypoints[12], frame.keypoints[24], frame.keypoints[23]],
		// 	10
		// );
		// ctx!.fillStyle = fillColor;
		// ctx?.fill();
		// ctx?.closePath();
		ctx?.beginPath();
		ctx?.moveTo(frame.keypoints[11].x, frame.keypoints[11].y);
		//ctx?.arc(frame.keypoints[24].x, frame.keypoints[24].y, 5, 0, 2 * Math.PI, false);
		ctx?.lineTo(frame.keypoints[12].x, frame.keypoints[12].y);
		ctx?.lineTo(frame.keypoints[24].x, frame.keypoints[24].y);
		ctx?.lineTo(frame.keypoints[23].x, frame.keypoints[23].y);
		ctx?.lineTo(frame.keypoints[11].x, frame.keypoints[11].y);

		ctx.shadowColor = shadowColor;
		ctx.shadowBlur = shadowBlur;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx!.lineWidth = limbWidth;
		ctx!.lineCap = 'round';
		ctx!.lineJoin = 'round';
		ctx!.strokeStyle = fillColor;
		ctx?.stroke();
		ctx.shadowColor = 'transparent';
		// ctx!.fillStyle = fillColor;
		// ctx?.fill();
		ctx?.closePath();

		// draw arms
		ctx?.beginPath();
		ctx?.moveTo(frame.keypoints[12].x, frame.keypoints[12].y);
		//ctx?.arc(frame.keypoints[24].x, frame.keypoints[24].y, 5, 0, 2 * Math.PI, false);
		ctx?.lineTo(frame.keypoints[14].x, frame.keypoints[14].y);
		ctx?.lineTo(frame.keypoints[16].x, frame.keypoints[16].y);

		ctx.shadowColor = shadowColor;
		ctx.shadowBlur = shadowBlur;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx!.lineWidth = limbWidth;
		ctx!.lineCap = 'round';
		ctx!.lineJoin = 'round';
		ctx!.strokeStyle = fillColor;
		ctx?.stroke();
		ctx?.closePath();

		ctx?.beginPath();
		ctx?.moveTo(frame.keypoints[11].x, frame.keypoints[11].y);
		//ctx?.arc(frame.keypoints[24].x, frame.keypoints[24].y, 5, 0, 2 * Math.PI, false);
		ctx?.lineTo(frame.keypoints[13].x, frame.keypoints[13].y);
		ctx?.lineTo(frame.keypoints[15].x, frame.keypoints[15].y);
		ctx.shadowColor = shadowColor;
		ctx.shadowBlur = shadowBlur;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx!.lineWidth = limbWidth;
		ctx!.lineCap = 'round';
		ctx!.lineJoin = 'round';
		ctx!.strokeStyle = fillColor;
		ctx?.stroke();
		ctx?.closePath();
	}
}
