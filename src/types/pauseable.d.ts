// Created by Copilot
declare module 'pauseable' {
  /**
   * A pauseable timeout object.
   */
  interface PauseableTimeout {
    pause(): void;
    resume(): void;
    clear(): void;
  }

  /**
   * A pauseable interval object.
   */
  interface PauseableInterval {
    pause(): void;
    resume(): void;
    clear(): void;
  }

  /**
   * Wraps setTimeout with pause/resume support.
   * @param callback Function to execute after delay
   * @param delay Delay in ms
   */
  function setTimeout(
    callback: (...args: any[]) => void,
    delay: number,
    ...args: any[]
  ): PauseableTimeout;

  /**
   * Wraps setInterval with pause/resume support.
   * @param callback Function to execute repeatedly
   * @param interval Interval in ms
   */
  function setInterval(
    callback: (...args: any[]) => void,
    interval: number,
    ...args: any[]
  ): PauseableInterval;

  export { setTimeout, setInterval, PauseableTimeout, PauseableInterval };
}
