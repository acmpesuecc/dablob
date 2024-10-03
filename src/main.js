import Shader from "./Shader";
import Model from "./Model"
import { TexMap } from "./Model";
import Texture from "./Texture"
import Framebuffer from "./Framebuffer"

import updateVS from "./shaders/updateVS.glsl";
import updateFS from "./shaders/updateFS.glsl";
import drawVS from "./shaders/drawVS.glsl";
import drawFS from "./shaders/drawFS.glsl";
import postVS from "./shaders/postVS.glsl";
import postFS from "./shaders/postFS.glsl";
import copyVS from "./shaders/copyVS.glsl";
import copyFS from "./shaders/copyFS.glsl";

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
	const postVertexShader = Shader.compileShader(gl, postVS, gl.VERTEX_SHADER);
	const postFragmentShader = Shader.compileShader(gl, postFS, gl.FRAGMENT_SHADER);
	const copyVertexShader = Shader.compileShader(gl, copyVS, gl.VERTEX_SHADER);
	const copyFragmentShader = Shader.compileShader(gl, copyFS, gl.FRAGMENT_SHADER);

	const updateProgram = new Shader(gl);
	updateProgram.createShaders(updateVertexShader, updateFragmentShader, ['newPosition','newAngle']);
	const drawProgram = new Shader(gl);
	drawProgram.createShaders(drawVertexShader, drawFragmentShader);
	const postProgram = new Shader(gl);
	postProgram.createShaders(postVertexShader, postFragmentShader);
	const copyProgram = new Shader(gl);
	copyProgram.createShaders(copyVertexShader, copyFragmentShader);

	// TEXTURE
	var texture1 = new Texture(gl, 0);
	texture1.createEmptyTex(resolution[0], resolution[1]);

	var texture2 = new Texture(gl, 1);
	texture2.createEmptyTex(resolution[0], resolution[1]);

	// FB
	const fb = new Framebuffer(gl);
	fb.createFramebuff(texture1.texture, resolution[0], resolution[1]);

	function swapTextures() {
		let temp = texture1;
		texture1 = texture2;
		texture2 = temp;

		texture1.unit = 0;
		texture1.bind();
		texture2.unit = 1;
		texture2.bind();
		fb.setTexture(texture2.texture);
	}

	// MODEL
	const model = new TexMap(gl);
	model.setup();

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

	const numParticles = 500000;

	const positions = new Float32Array(createPoints(numParticles, [[-.1, .1], [-.1, .1]]));
	const angles = new Float32Array(createPoints(numParticles, [[.1, .1], [.1, .1]]));

	// BUFF
	const positionBuffer1 = Model.createBuffer(gl, positions, gl.DYNAMIC_DRAW);
	const positionBuffer2 = Model.createBuffer(gl, positions, gl.DYNAMIC_DRAW);
	const angleBuffer1 = Model.createBuffer(gl, angles, gl.DYNAMIC_DRAW);
	const angleBuffer2 = Model.createBuffer(gl, angles, gl.DYNAMIC_DRAW);

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
	const updateProgLocs = {
		oldPosition: gl.getAttribLocation(updateProgram.program, 'oldPosition'),
		oldAngle: gl.getAttribLocation(updateProgram.program, 'oldAngle'),
		canvasDimensions: gl.getUniformLocation(updateProgram.program, 'canvasDimensions'),
		deltaTime: gl.getUniformLocation(updateProgram.program, 'deltaTime'),
		uSampler: gl.getUniformLocation(updateProgram.program, 'uSampler'),
	};

	const drawProgLocs = {
		position: gl.getAttribLocation(drawProgram.program, 'position'),
	};
	const postProgLocs = {
		position: gl.getAttribLocation(postProgram.program, 'uSampler'),
		canvasDimensions: gl.getUniformLocation(postProgram.program, 'canvasDimensions'),
	};

	const copyProgLocs = {
		uSampler: gl.getUniformLocation(drawProgram.program, "uSampler"),
	};


	const updateVAO1 = makeVertexArray(gl, [
		[positionBuffer1, updateProgLocs.oldPosition],
		[angleBuffer1, updateProgLocs.oldAngle],
	]);
	const updateVAO2 = makeVertexArray(gl, [
		[positionBuffer2, updateProgLocs.oldPosition],
		[angleBuffer2, updateProgLocs.oldAngle],
	]);
	const drawVAO = makeVertexArray(
		gl, [[positionBuffer1, drawProgLocs.position]]);

	function makeTransformFeedback(gl, buffers) {
		const tf = gl.createTransformFeedback();
		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
		buffers.forEach((buffer, index) => {
			gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, index, buffer);
		});
		return tf;
	}

	const tf1 = makeTransformFeedback(gl, [positionBuffer1, angleBuffer1]);
	const tf2 = makeTransformFeedback(gl, [positionBuffer2, angleBuffer2]);

	let current = {
		updateVA: updateVAO1,
		tf: tf2,
		drawVA: drawVAO,
	};
	let next = {
		updateVA: updateVAO2,
		tf: tf1,
		drawVA: drawVAO,
	};


	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);

	gl.useProgram(copyProgram.program)
	gl.uniform1i(copyProgLocs.uSampler, 1);

	gl.useProgram(postProgram.program)
	gl.uniform1i(postProgram.uSampler, 1);
	gl.uniform2f(postProgram.canvasDimensions, resolution[0], resolution[1]);

	gl.useProgram(updateProgram.program);
	gl.uniform1i(updateProgLocs.uSampler, 1);
	gl.uniform2f(updateProgLocs.canvasDimensions, resolution[0], resolution[1]);

	gl.clearColor(0, 0, 0, 0);

	let lastTime = performance.now() * .001;
	function renderLoop() {
		const currentTime = performance.now() * .001;
		const deltaTime = currentTime - lastTime;
		lastTime = currentTime;
		const fps = 1 / deltaTime;
		fpsElem.textContent = fps.toFixed(1);

		gl.clear(gl.COLOR_BUFFER_BIT);

		// update program call
		gl.useProgram(updateProgram.program);
		gl.bindVertexArray(current.updateVA);
		gl.uniform1f(updateProgLocs.deltaTime, deltaTime);

		gl.enable(gl.RASTERIZER_DISCARD);

		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, current.tf)
		gl.beginTransformFeedback(gl.POINTS);
		gl.drawArrays(gl.POINTS, 0, numParticles);
		gl.endTransformFeedback();
		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

		gl.disable(gl.RASTERIZER_DISCARD);


		// render to framebuffer
		fb.bind();
		gl.useProgram(drawProgram.program);
		gl.bindVertexArray(current.drawVA);
		gl.viewport(0, 0, resolution[0], resolution[1]);
		// gl.clearColor(0, 0, 0, 0);
		// gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.drawArrays(gl.POINTS, 0, numParticles);
		{
			const temp = current;
			current = next;
			next = temp;
		}

		swapTextures();
		fb.unbind();

		// post program call
		fb.bind()
		gl.useProgram(postProgram.program);
		model.render();
		fb.unbind();


		// render texture
		gl.useProgram(copyProgram.program);
		gl.viewport(0, 0, resolution[0], resolution[1]);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		model.render();

		requestAnimationFrame(renderLoop);
	}

	renderLoop();
}
