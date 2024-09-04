#version 300 es

in vec2 oldPosition;
in vec2 oldAngle;

uniform float deltaTime;
uniform vec2 canvasDimensions;
uniform sampler2D uSampler;

out vec2 newPosition;
out vec2 newAngle;

void main() {
	vec4 texSample = texture(uSampler, oldPosition);
    vec2 tempPosition = oldPosition + oldAngle * deltaTime;
    vec2 wrappedPosition = mod(tempPosition + vec2(1.0), vec2(2.0)) - vec2(1.0);
    newPosition = wrappedPosition;

	vec2 tempAngle = oldAngle;
	newAngle = tempAngle;
}
