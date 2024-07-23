import Shader from "./Shader";
import Model from "./Model"

import updateVS from "./shaders/updateVS.glsl";
import updateFS from "./shaders/updateFS.glsl";
import drawVS from "./shaders/drawVS.glsl";
import drawFS from "./shaders/drawFS.glsl";

const canvas = document.querySelector("#glcanvas");
const fpsElem = document.querySelector("#fps");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const resolution = [canvas.width, canvas.height];

const gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("webgl2"));

if (gl === null) {
	alert("Unable to initialize WebGL.");
} else {
	// SHADER
	const updateVertexShader = Shader.compileShader(gl, updateVS, gl.VERTEX_SHADER);
	const updateFragmentShader = Shader.compileShader(gl, updateFS, gl.FRAGMENT_SHADER);
	const drawVertexShader = Shader.compileShader(gl, drawVS, gl.VERTEX_SHADER);
	const drawFragmentShader = Shader.compileShader(gl, drawFS, gl.FRAGMENT_SHADER);

	const updateProgram = new Shader(gl);
	updateProgram.createShaders(updateVertexShader, updateFragmentShader, ['newPosition']);
	const drawProgram = new Shader(gl);
	drawProgram.createShaders(drawVertexShader, drawFragmentShader);

	// DATA
	const rand = (min, max) => {
		if (max === undefined) {
			max = min;
			min = 0;
		}
		return Math.random() * (max - min) + min;
	};

	const createPoints = (num, ranges) =>
		new Array(num).fill(0).map(() =>
			ranges.map(range => rand(...range))
		).flat();

	const numParticles = 100000;

	const positions = new Float32Array(createPoints(numParticles, [[-1, 1], [-1, 1]]));
	const velocities = new Float32Array(createPoints(numParticles, [[-.1, .1], [-.1, .1]]));

	// BUFF
	const position1Buffer = Model.createBuffer(gl, positions, gl.DYNAMIC_DRAW);
	const position2Buffer = Model.createBuffer(gl, positions, gl.DYNAMIC_DRAW);
	const velocityBuffer = Model.createBuffer(gl, velocities, gl.STATIC_DRAW);

	function makeVertexArray(gl, bufLocPairs) {
		const va = gl.createVertexArray();
		gl.bindVertexArray(va);
		for (const [buffer, loc] of bufLocPairs) {
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.enableVertexAttribArray(loc);
			gl.vertexAttribPointer(
				loc,      // attribute location
				2,        // number of elements
				gl.FLOAT, // type of data
				false,    // normalize
				0,        // stride (0 = auto)
				0,        // offset
			);
		}
		return va;
	}
	const updatePositionPrgLocs = {
		oldPosition: gl.getAttribLocation(updateProgram.program, 'oldPosition'),
		velocity: gl.getAttribLocation(updateProgram.program, 'velocity'),
		canvasDimensions: gl.getUniformLocation(updateProgram.program, 'canvasDimensions'),
		deltaTime: gl.getUniformLocation(updateProgram.program, 'deltaTime'),
	};

	const drawParticlesProgLocs = {
		position: gl.getAttribLocation(drawProgram.program, 'position'),
	};
	const updatePositionVAO1 = makeVertexArray(gl, [
		[position1Buffer, updatePositionPrgLocs.oldPosition],
		[velocityBuffer, updatePositionPrgLocs.velocity],
	]);
	const updatePositionVAO2 = makeVertexArray(gl, [
		[position2Buffer, updatePositionPrgLocs.oldPosition],
		[velocityBuffer, updatePositionPrgLocs.velocity],
	]);
	const drawVAO1 = makeVertexArray(
		gl, [[position1Buffer, drawParticlesProgLocs.position]]);
	const drawVAO2 = makeVertexArray(
		gl, [[position2Buffer, drawParticlesProgLocs.position]]);

	function makeTransformFeedback(gl, buffer) {
		const tf = gl.createTransformFeedback();
		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer);
		return tf;
	}

	const tf1 = makeTransformFeedback(gl, position1Buffer);
	const tf2 = makeTransformFeedback(gl, position2Buffer);

	let current = {
		updateVA: updatePositionVAO1,
		tf: tf2,
		drawVA: drawVAO2,
	};
	let next = {
		updateVA: updatePositionVAO2,
		tf: tf1,
		drawVA: drawVAO1,
	};


	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);

	gl.useProgram(updateProgram.program);
	gl.uniform2f(updatePositionPrgLocs.canvasDimensions, canvas.width, canvas.height);

	gl.clearColor(1, 1, 1, 1);

	let lastTime = performance.now() * .001;
	function renderLoop() {
		const currentTime = performance.now() * .001;
		const deltaTime = currentTime - lastTime;
		lastTime = currentTime;
		const fps = 1 / deltaTime;
		fpsElem.textContent = fps.toFixed(1);

		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.useProgram(updateProgram.program);
		gl.bindVertexArray(current.updateVA);
		gl.uniform1f(updatePositionPrgLocs.deltaTime, deltaTime);

		gl.enable(gl.RASTERIZER_DISCARD);

		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, current.tf);
		gl.beginTransformFeedback(gl.POINTS);
		gl.drawArrays(gl.POINTS, 0, numParticles);
		gl.endTransformFeedback();
		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

		gl.disable(gl.RASTERIZER_DISCARD);

		gl.useProgram(drawProgram.program);
		gl.bindVertexArray(current.drawVA);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.drawArrays(gl.POINTS, 0, numParticles);

		{
			const temp = current;
			current = next;
			next = temp;
		}

		requestAnimationFrame(renderLoop);
	}

	renderLoop();
}
