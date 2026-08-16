/**
 * Simple PRNG implementation based on Mulberry32.
 * This guarantees that the same seed produces the same sequence of random numbers across any V8 engine.
 */
export class RandomV2 {
  private state: number;

  constructor(seedStr: string) {
    this.state = this.cyrb128(seedStr)[0];
  }

  // cyrb128 hash function to convert string to 32-bit state
  private cyrb128(str: string): [number, number, number, number] {
    let h1 = 1779033703,
      h2 = 3144134277,
      h3 = 1013904242,
      h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
      k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [
      (h1 ^ h2 ^ h3 ^ h4) >>> 0,
      (h2 ^ h1) >>> 0,
      (h3 ^ h1) >>> 0,
      (h4 ^ h1) >>> 0,
    ];
  }

  /**
   * Returns a pseudorandom number between 0 (inclusive) and 1 (exclusive).
   */
  public next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns an integer between min (inclusive) and max (exclusive).
   */
  public range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min) + min);
  }

  /**
   * Shuffles an array in place deterministically.
   */
  public shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length,
      randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(this.next() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
    return array;
  }
}
