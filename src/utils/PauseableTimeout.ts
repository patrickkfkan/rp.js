import * as pauseable from 'pauseable';

export class PauseableTimeout {
  #pausableTimeout: pauseable.PauseableTimeout;
  #isDone = false;
  #startTime: number | null;
  #pauseTime: number | null;
  #endTime: number | null;

  constructor(cb: () => void, interval: number) {
    this.#pausableTimeout = pauseable.setTimeout(() => {
      this.#isDone = true;
      cb();
    }, interval);
    this.#startTime = Date.now();
    this.#pauseTime = null;
    this.#endTime = this.#startTime + interval;
  }

  static setTimeout(cb: () => void, interval: number) {
    return new PauseableTimeout(cb, interval);
  }

  pause() {
    if (this.isPaused() || this.isCleared() || this.isDone()) {
      return;
    }
    this.#pausableTimeout.pause();
    this.#pauseTime = Date.now();
  }

  resume() {
    if (!this.isPaused() || this.isDone()) {
      return;
    }
    this.#pausableTimeout.resume();
    const remaining = this.getRemainingTime();
    this.#startTime = Date.now();
    this.#endTime = this.#startTime + remaining;
    this.#pauseTime = null;
  }

  clear() {
    this.#pausableTimeout.clear();
    this.#startTime = null;
    this.#pauseTime = null;
    this.#endTime = null;
  }

  isDone() {
    return this.#isDone;
  }

  isPaused() {
    return this.#pauseTime !== null;
  }

  isCleared() {
    return this.#startTime === null && this.#pauseTime === null;
  }

  getRemainingTime() {
    if (this.isCleared() || this.isDone()) {
      return 0;
    }
    if (this.isPaused()) {
      return this.#endTime! - this.#pauseTime!;
    }
    return Math.max(0, this.#endTime! - Date.now());
  }
}
