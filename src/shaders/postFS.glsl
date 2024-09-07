#version 300 es

precision highp float;

in vec2 vCoord;

out vec4 fragColor;

uniform sampler2D uSampler;
uniform vec2 canvasDimensions;
const float decayFactor = 0.02;

void main() {
    vec4 texColor = texture(uSampler, vCoord);
    vec4 decayColor = texColor - vec4(decayFactor);
    fragColor = decayColor;
}
