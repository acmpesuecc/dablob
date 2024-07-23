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

	createFramebuff(texture, width, height) {

		this.framebuffer = this.gl.createFramebuffer();
		this.bind();

		this.setTexture(texture);
		const depthBuffer = this.gl.createRenderbuffer();
		this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, depthBuffer);
		this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);
		this.gl.framebufferRenderbuffer(
			this.gl.FRAMEBUFFER,
			this.gl.DEPTH_ATTACHMENT,
			this.gl.RENDERBUFFER,
			depthBuffer
		);

		this.unbind();
	}
	setTexture(texture) {
		this.gl.framebufferTexture2D(
			this.gl.FRAMEBUFFER,
			this.gl.COLOR_ATTACHMENT0,
			this.gl.TEXTURE_2D,
			texture,
			0
		);
	}
}
