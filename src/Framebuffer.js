export default class Framebuffer {
	constructor(gl) {
		this.gl = gl;
		this.framebuffer = null;
	}

	bind() {
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
	}

	unbind() {
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	}

	createFramebuff(texture) {

		this.framebuffer = this.gl.createFramebuffer();
		this.bind();

		this.gl.framebufferTexture2D(
			this.gl.FRAMEBUFFER,
			this.gl.COLOR_ATTACHMENT0,
			this.gl.TEXTURE_2D,
			texture,
			0
		);

		this.unbind();
	}
}
