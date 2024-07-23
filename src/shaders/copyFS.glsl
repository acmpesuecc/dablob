#version 300 es
precision highp float;

out vec4 fragColor;

uniform sampler2D uSampler;

in vec2 vCoord;

void main() {
	fragColor = texture(uSampler,vCoord);
}
