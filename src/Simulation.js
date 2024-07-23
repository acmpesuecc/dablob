export default class Simulation {
	static hashFunc(state) {
		state ^= 2747636419;
		state = Math.imul(state, 2654435769);
		state ^= state >>> 16;
		state = Math.imul(state, 2654435769);
		state ^= state >>> 16;
		state = Math.imul(state, 2654435769);
		return state >>> 0;
	}

	static hashScale(state) {
		return state / 4294967295.0;
	}
}
