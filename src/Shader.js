export default class Shader {
	constructor(gl) {
		this.gl = gl;
		this.program = null;
	}

	static compileShader(gl, source, type) {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error(gl.getShaderInfoLog(shader));
			return null;
		}

		return shader;
	}

	createShaders(vertexShader, fragmentShader, transformFeedbackVaryings) {
		this.program = this.gl.createProgram();

		this.gl.attachShader(this.program, vertexShader);
		this.gl.attachShader(this.program, fragmentShader);

		if (transformFeedbackVaryings) {
			this.gl.transformFeedbackVaryings(
				this.program,
				transformFeedbackVaryings,
				this.gl.SEPARATE_ATTRIBS,
			);
		}

		this.gl.linkProgram(this.program);

		if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
			console.error(this.gl.getProgramInfoLog(this.program));
			this.gl.deleteProgram(this.program);
		}
	}
}
