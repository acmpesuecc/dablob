#version 300 es

in vec2 oldPosition;
in vec2 oldAngle;

uniform float deltaTime;
uniform vec2 canvasDimensions;
uniform sampler2D uSampler;

out vec2 newPosition;
out vec2 newAngle;

#define PI radians(180.0)
const float moveSpeed = 0.05;
const float turnSpeed = 2.0;
const float sensorOffsetDist = 0.1;
const float sensorAngleSpacing = PI / 4.0;
const float sensorSize = 1.0;

uint hash(uint s) {
    s ^= 2747636419u;
    s *= 2654435769u;
    s ^= s >> 16;
    s *= 2654435769u;
    s ^= s >> 16;
    s *= 2654435769u;
    return s;
}

float scaleToRange(uint v) {
    return float(v) / 4294967295.0;
}

float sense(vec2 position, float sensorAngle) {
    vec2 sensorDir = vec2(cos(sensorAngle), sin(sensorAngle));
    vec2 sensorCenter = position + sensorDir * sensorOffsetDist;
    vec2 sensorUV = (sensorCenter + 1.0) / 2.0;
    vec4 s = textureLod(uSampler, sensorUV ,sensorSize);
    return s.r;
}

void main() {
    uint random = hash(uint(oldPosition.y * canvasDimensions.x) + uint(oldPosition.x) + uint(gl_VertexID));

    float currentAngle = atan(oldAngle.y, oldAngle.x);

    float weightForward = sense(oldPosition, currentAngle);
    float weightLeft = sense(oldPosition, currentAngle + sensorAngleSpacing);
    float weightRight = sense(oldPosition, currentAngle - sensorAngleSpacing);

    float randomSteerStrength = scaleToRange(random);

    if (weightForward > weightLeft && weightForward > weightRight) {
        currentAngle += 0.0;
    } else if (weightForward < weightLeft && weightForward < weightRight) {
        currentAngle += (randomSteerStrength - 0.5) * 2.0 * turnSpeed * deltaTime;
    } else if (weightRight > weightLeft) {
        currentAngle -= randomSteerStrength * turnSpeed * deltaTime;
    } else if (weightLeft > weightRight) {
        currentAngle += randomSteerStrength * turnSpeed * deltaTime;
    }

    vec2 direction = vec2(cos(currentAngle), sin(currentAngle));
    vec2 tempPosition = oldPosition + direction * moveSpeed * deltaTime;

    newPosition = mod(tempPosition + vec2(1.0), vec2(2.0)) - vec2(1.0);
    newAngle = direction;
}
