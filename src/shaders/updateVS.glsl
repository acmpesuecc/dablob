#version 300 es

in vec2 oldPosition;
in vec2 velocity;

uniform float deltaTime;
uniform vec2 canvasDimensions;

out vec2 newPosition;

void main() {
    vec2 tempPosition = oldPosition + velocity * deltaTime;
    vec2 wrappedPosition = mod(tempPosition + vec2(1.0), vec2(2.0)) - vec2(1.0);
    newPosition = wrappedPosition;
}
