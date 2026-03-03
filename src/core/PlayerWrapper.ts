import EventEmitter from 'events';
import { type BlockTrack, type Block, type Channel } from '../types';
import { type PlayerTrackInfo, type Player, type PlayerStatus } from './Player';
import { type API } from './API';
import {
  getErrorMessage,
  millisToLocaleDateTimeString,
  millisToMinutesAndSeconds
} from '../utils/string-util';
import _ from 'lodash';
import {
  type GetNowPlayingListParams,
  type AudioQuality
} from './RadioParadise';
import { type Logger, NULL_LOGGER } from '../utils/logging';
import { PauseableTimeout } from '../utils/PauseableTimeout';

export class PlayerWrapper extends EventEmitter {
  #api: API;
  #player: Player;
  #stopListener: () => void;
  #status: PlayerStatus;
  #playerOpAbortController: AbortController | null = null;
  #currentBlock: Block | null = null;
  #currentTrackIndex: number | null = null;
  #nextTrackTimer: PauseableTimeout | null = null;
  #adjustTimer: NodeJS.Timeout | null = null;
  #logger: Logger;
  #quality: AudioQuality;

  constructor(
    player: Player,
    quality: AudioQuality,
    api: API,
    logger?: Logger | null
  ) {
    super();
    this.#player = player;
    this.#quality = quality;
    this.#api = api;
    this.#logger = logger ?? NULL_LOGGER;
    this.#status = {
      state: 'idle',
      channel: null,
      track: null
    };
    this.#stopListener = () => {
      this.#setStatus({ state: 'idle' });
    };
    this.#player.on('stopped', this.#stopListener);
  }

  async setQuality(quality: AudioQuality) {
    const changed = quality !== this.#quality;
    this.#quality = quality;
    if (changed) {
      this.#logger.info(`Audio quality set to "${quality}"`);
      const channel = this.getStatus().channel;
      if (channel) {
        this.#logger.info(
          `Restarting playback to apply new quality setting...`
        );
        await this.play(channel.id);
      }
    }
  }

  #getCurrentTrack() {
    if (!this.#currentBlock || this.#currentTrackIndex === null) {
      return null;
    }
    return this.#currentBlock.tracks[this.#currentTrackIndex] ?? null;
  }

  #incrementcurrentTrackIndex() {
    if (this.#currentTrackIndex === null) {
      this.#logger.warn(
        'Could not increment current track index: current value is null.'
      );
      return;
    }
    if (!this.#currentBlock) {
      this.#logger.warn(
        'Could not increment current track index: no block available.'
      );
      this.#currentTrackIndex = null;
      return;
    }
    const oldIndex = this.#currentTrackIndex;
    this.#currentTrackIndex++;
    this.#logger.debug(
      `Incremented current track index: "${oldIndex}" -> "${this.#currentTrackIndex}"`
    );
  }

  #setStatus(status: Partial<PlayerStatus>) {
    const oldStatus = _.cloneDeep(this.#status);
    this.#status = {
      ...this.#status,
      ...status
    };
    if (!_.isEqual(this.#status, oldStatus)) {
      this.emit('status', this.#status);
    }
  }

  #cancelCurrentPlayerOp() {
    if (this.#playerOpAbortController) {
      this.#playerOpAbortController.abort();
      this.#playerOpAbortController = null;
    }
  }

  async play(channel: string | Channel) {
    this.#cancelCurrentPlayerOp();
    this.#clearNextTrackTimer();
    this.#playerOpAbortController = new AbortController();
    const signal = this.#playerOpAbortController.signal;
    this.#setStatus({ state: 'loading' });
    try {
      await this.#api.auth();
      const channel_id = typeof channel === 'string' ? channel : channel.id;
      const block = await this.#api.play({
        event: '0',
        elapsed: '0',
        quality: this.#quality,
        action: 'start',
        info: true,
        channel_id,
        audio_type: ''
      });
      if (signal.aborted) {
        return;
      }
      this.#logger.info(`Obtained block for channel "${channel_id}"`);
      const validationResult = this.#validateBlock(block);
      if (!validationResult.validated) {
        this.#logger.error(
          `Play channel error - invalid block: ${validationResult.reason}`
        );
        throw Error(`Invalid block: ${validationResult.reason}`);
      }
      this.#setCurrentBlock(block);
      await this.#playBlock(false, signal);
    } finally {
      this.#playerOpAbortController = null;
    }
  }

  async next(waitForStop = false) {
    const currentTrack = this.#getCurrentTrack();
    if (!this.#currentBlock || !currentTrack) {
      this.#logger.warn(
        'Could not obtain updated block: no current block or track available.'
      );
      return;
    }
    this.#cancelCurrentPlayerOp();
    this.#clearNextTrackTimer();
    this.#playerOpAbortController = new AbortController();
    const signal = this.#playerOpAbortController.signal;
    if (waitForStop && this.getStatus().state !== 'idle') {
      this.#logger.debug(
        'Waiting for player to stop before fetching next block...'
      );
      try {
        await this.#waitForPlayerEvent('stopped', signal);
      } catch (error: unknown) {
        if (signal.aborted) {
          return;
        }
        throw error;
      }
    }
    this.#setStatus({ state: 'loading' });
    try {
      const block = await this.#api.play({
        event: currentTrack.event,
        elapsed: '1',
        quality: this.#quality,
        action: 'play',
        info: true,
        channel_id: this.#currentBlock.channel.id,
        slice_num:
          this.#currentBlock.channel.isER ?
            String(Number.MAX_SAFE_INTEGER)
          : currentTrack.slice_num,
        episode_id: currentTrack.episode_id,
        audio_type: this.#currentBlock.type
      });
      this.#logger.info('Obtained updated block');
      const validationResult = this.#validateBlock(block);
      if (!validationResult.validated) {
        this.#logger.error(
          `Encountered invalid block: ${validationResult.reason}. Will start over with current channel.`
        );
        return await this.play(this.#currentBlock.channel.id);
      }
      this.#setCurrentBlock(block);
      await this.#playBlock(true, signal);
    } finally {
      this.#playerOpAbortController = null;
    }
  }

  #setCurrentBlock(block: Block) {
    this.#clearNextTrackTimer();
    this.#currentBlock = block;
    this.#currentTrackIndex = 0;
    this.#logBlockSummary();
    const currentTrack = this.#getCurrentTrack();
    if (!currentTrack) {
      throw Error('Current track not found in block');
    }
    this.#setStatus({
      channel: {
        id: block.channel.id,
        title: block.channel.title,
        streamName: block.channel.stream_name,
        isEpisodeRadio: block.channel.isER
      },
      track: this.#toPlayerTrackInfo(currentTrack)
    });
  }

  async #playBlock(fromNext = false, signal: AbortSignal) {
    if (!this.#currentBlock) {
      throw Error('No block available to play');
    }
    const currentTrack = this.#getCurrentTrack();
    if (!currentTrack) {
      throw Error('Current track not found in block');
    }
    const now = Date.now();
    let startPositionInTrack = 0;
    if (!fromNext && currentTrack.duration) {
      // If playback is in sync with RP (no pauses / skips / seeks), the following are true
      // for the current track:
      // 1. now >= scheduled playback time
      // 2. now < scheduled playback time + duration
      // We can then calculate the starting position to play in the current track.
      const { sched_time_millis: scheduled, duration } = currentTrack;
      const synced = now >= scheduled && now < scheduled + duration;
      if (synced) {
        startPositionInTrack = now - scheduled;
      }
      // If out of sync, then leave start position as 0.
    }
    const startPositionInStream =
      startPositionInTrack + (currentTrack.elapsed || 0);

    if (startPositionInStream > 0) {
      this.#logger.debug(
        'Current track scheduled playback vs. current time: ' +
          millisToLocaleDateTimeString(currentTrack.sched_time_millis) +
          ' <-> ' +
          millisToLocaleDateTimeString(now)
      );
      this.#logger.info(
        'Going to start playback of current track at ' +
          millisToMinutesAndSeconds(startPositionInTrack) +
          (currentTrack.elapsed && currentTrack.elapsed > 0 ?
            ` (track position in stream: ${millisToMinutesAndSeconds(currentTrack.elapsed)})`
          : '')
      );
    } else {
      this.#logger.info('Going to start playback of current track');
    }
    try {
      const [_, { position }] = await Promise.all([
        this.#player.play(this.#currentBlock.url, startPositionInStream),
        this.#waitForPlayerEvent('playing', signal)
      ]);
      if (currentTrack.duration) {
        this.#logger.info(
          `Started playback of "${currentTrack.title}" - estimated finish time: ` +
            millisToLocaleDateTimeString(
              Date.now() + currentTrack.duration - startPositionInTrack
            )
        );
      } else {
        this.#logger.info(
          `Started playback of "${currentTrack.title}" (infinite stream)`
        );
      }
      this.#setStatus({ state: 'playing' });
      await this.#handleTrackBegin(position - (currentTrack.elapsed || 0));
    } catch (error: unknown) {
      if (signal.aborted) {
        return;
      }
      throw error;
    }
  }

  async #handleTrackBegin(startPosition = 0, isAdjusting = false) {
    this.#clearNextTrackTimer();
    const currentTrack = this.#getCurrentTrack();
    if (!currentTrack || !this.#currentBlock) {
      this.#logger.warn(
        'Track is expected to have begun, but track data is missing. This is likely a bug.'
      );
      return;
    }
    this.#setStatus({ track: this.#toPlayerTrackInfo(currentTrack) });
    if (currentTrack.duration) {
      const isLastTrackInBlock =
        this.#currentTrackIndex === this.#currentBlock.tracks.length - 1;
      // If current track is the last in block, we would have to wait for player "stop" event before
      // advancing to the next block.  In this case, the #nextTrackTimer is set to expire slightly earlier
      // to ensure it triggers before the player stops, preventing a race condition where the 'stop' event is missed.
      const nextTrackInterval =
        currentTrack.duration - startPosition - (isLastTrackInBlock ? 2 : 0);
      if (!isAdjusting) {
        if (!isLastTrackInBlock) {
          this.#logger.debug(
            `After "${currentTrack.title}", the next track will start in ${millisToMinutesAndSeconds(nextTrackInterval, 'alphanumeric')}` +
              ` (${millisToLocaleDateTimeString(Date.now() + nextTrackInterval)})`
          );
        } else {
          this.#logger.debug(
            `After "${currentTrack.title}", prepare to fetch the next block in ${millisToMinutesAndSeconds(nextTrackInterval, 'alphanumeric')}` +
              ` (${millisToLocaleDateTimeString(Date.now() + nextTrackInterval)})`
          );
        }
      }
      this.#nextTrackTimer = PauseableTimeout.setTimeout(() => {
        void (async () => {
          if (isLastTrackInBlock) {
            this.#logger.info(
              'About to reach end of stream in current block. Going to obtain next block.'
            );
            try {
              return await this.next(true);
            } catch (error: unknown) {
              this.#logger.error(
                `Error advancing to next block on end of current stream: ${getErrorMessage(error)}`
              );
              return;
            }
          }
          this.#logger.debug('Proceeding to next track');
          this.#incrementcurrentTrackIndex();
          const newcurrentTrack = this.#getCurrentTrack()!;
          const durationStr =
            newcurrentTrack.duration !== null ?
              millisToMinutesAndSeconds(newcurrentTrack.duration)
            : '(infinite stream)';
          this.#logger.info(
            `Proceeded to next track: ${newcurrentTrack.title} (${durationStr})`
          );
          await this.#handleTrackBegin();
        })();
      }, nextTrackInterval);
      if (this.getStatus().state !== 'playing') {
        this.#nextTrackTimer.pause();
      }
      if (!isAdjusting) {
        this.#initAdjustTimer();
        if (currentTrack.type === 'P') {
          await this.#api.auth();
        }
      }
    } else {
      this.#logger.debug(
        `"${currentTrack.title}" is an infinite stream; not going to set timer to signal start of next track.`
      );
    }
    if (!isAdjusting) {
      await this.#api.updateHistory({
        currentBlock: this.#currentBlock,
        currentTrack: currentTrack,
        play_position: startPosition
      });
    }
  }

  #initAdjustTimer(maxIt = 5, it = 0) {
    if (!this.#player.getPosition) {
      return;
    }
    this.#adjustTimer = setTimeout(() => {
      void (async () => {
        if (!this.#nextTrackTimer) {
          return;
        }
        const currentTrack = this.#getCurrentTrack();
        if (
          !currentTrack ||
          currentTrack.elapsed === undefined ||
          !currentTrack.duration
        ) {
          return;
        }
        this.#logger.debug(
          `Checking if next track interval requires adjusting (${it + 1}/${maxIt})...`
        );
        const currentPositionInTrack =
          this.#player.getPosition!() - currentTrack.elapsed;
        let recalculatedNextTrackInterval =
          currentTrack.duration - currentPositionInTrack;
        if (recalculatedNextTrackInterval < 0) {
          this.#logger.warn(
            'Recalculated next track interval has a negative value. Setting it to 0.'
          );
          recalculatedNextTrackInterval = 0;
        }
        const diff = Math.abs(
          recalculatedNextTrackInterval -
            this.#nextTrackTimer.getRemainingTime()
        );
        if (diff > 500) {
          this.#logger.debug(
            `Recalculated next track interval exceeds current by ${diff}ms. Going to re-adjust.`
          );
          await this.#handleTrackBegin(currentPositionInTrack, true);
        } else {
          this.#logger.debug('Next track interval is accurate');
        }
        it++;
        if (it < maxIt) {
          this.#initAdjustTimer(maxIt, it);
        }
      })();
    }, 2000);
  }

  #waitForPlayerEvent(
    eventName: 'stopped',
    signal: AbortSignal,
    timeout?: number
  ): Promise<void>;
  #waitForPlayerEvent(
    eventName: 'playing' | 'paused' | 'seeked',
    signal: AbortSignal,
    timeout?: number
  ): Promise<{ position: number }>;
  #waitForPlayerEvent(
    eventName: 'playing' | 'paused' | 'stopped' | 'seeked',
    signal: AbortSignal,
    timeout = 30000
  ) {
    let listener: (...args: any[]) => void;
    return new Promise<void | { position: number }>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timed out waiting for player event "${eventName}"`));
      }, timeout);
      signal.onabort = () => {
        clearTimeout(timer);
        const error = new Error(
          `Aborted while waiting for player event "${eventName}"`
        );
        error.name = 'AbortError';
        reject(error);
      };
      listener = (...args: any[]) => {
        clearTimeout(timer);
        this.#logger.debug(`Received player event "${eventName}"...`);
        if (
          eventName === 'playing' ||
          eventName === 'paused' ||
          eventName === 'seeked'
        ) {
          return resolve(args[0]); // { position: number }
        }
        return resolve();
      };
      this.#logger.debug(`Waiting for player event "${eventName}"...`);
      this.#player.once(eventName, listener);
    }).finally(() => {
      this.#player.off(eventName, listener);
    });
  }

  #clearNextTrackTimer() {
    if (this.#adjustTimer) {
      clearTimeout(this.#adjustTimer);
      this.#adjustTimer = null;
    }
    if (this.#nextTrackTimer) {
      this.#nextTrackTimer.clear();
      this.#nextTrackTimer = null;
    }
  }

  async pause() {
    if (this.#status.state !== 'playing') {
      this.#logger.warn('Could not pause - no playback in progress');
      return;
    }
    const currentTrack = this.#getCurrentTrack();
    if (!this.#currentBlock || !currentTrack) {
      throw Error('Missing current block or track');
    }
    this.#cancelCurrentPlayerOp();
    this.#playerOpAbortController = new AbortController();
    const signal = this.#playerOpAbortController.signal;
    try {
      const [_, { position }] = await Promise.all([
        this.#player.pause(),
        this.#waitForPlayerEvent('paused', signal)
      ]);
      this.#nextTrackTimer?.pause();
      await this.#api.updatePause({
        currentBlock: this.#currentBlock,
        currentTrack: currentTrack,
        position
      });
      this.#setStatus({ state: 'paused' });
    } catch (error: unknown) {
      if (signal.aborted) {
        return;
      }
      throw error;
    } finally {
      this.#playerOpAbortController = null;
    }
  }

  async resume() {
    if (this.#status.state !== 'paused') {
      this.#logger.warn(
        'Could not resume - playback not in progress or is not paused'
      );
      return;
    }
    const currentTrack = this.#getCurrentTrack();
    if (!this.#currentBlock || !currentTrack) {
      throw Error('Missing current block or track');
    }
    this.#cancelCurrentPlayerOp();
    this.#playerOpAbortController = new AbortController();
    const signal = this.#playerOpAbortController.signal;
    try {
      const [_, { position }] = await Promise.all([
        this.#player.resume(),
        this.#waitForPlayerEvent('playing', signal)
      ]);
      this.#nextTrackTimer?.resume();
      await this.#api.updateHistory({
        currentBlock: this.#currentBlock,
        currentTrack: currentTrack,
        play_position: position,
        pause: true
      });
      this.#setStatus({ state: 'playing' });
    } catch (error: unknown) {
      if (signal.aborted) {
        return;
      }
      throw error;
    } finally {
      this.#playerOpAbortController = null;
    }
  }

  async seek(positionInTrack: number) {
    if (this.#status.state !== 'paused' && this.#status.state !== 'playing') {
      this.#logger.warn(`Cannot seek while player is ${this.#status.state}`);
      return;
    }
    const currentTrack = this.#getCurrentTrack();
    if (!currentTrack) {
      throw Error('Missing current track');
    }
    if (!currentTrack.duration) {
      this.#logger.warn('Cannot seek in an infinite stream');
      return;
    }
    this.#cancelCurrentPlayerOp();
    this.#clearNextTrackTimer();
    this.#playerOpAbortController = new AbortController();
    const signal = this.#playerOpAbortController.signal;
    const positionInStream = positionInTrack + (currentTrack.elapsed ?? 0);
    try {
      const [_, { position: newPositionInStream }] = await Promise.all([
        this.#player.seek(positionInStream),
        this.#waitForPlayerEvent('seeked', signal)
      ]);
      // Recalculate next song interval
      const newPositionInTrack =
        newPositionInStream - (currentTrack.elapsed ?? 0);
      await this.#handleTrackBegin(newPositionInTrack);
    } catch (error: unknown) {
      if (signal.aborted) {
        return;
      }
      throw error;
    } finally {
      this.#playerOpAbortController = null;
    }
  }

  async stop() {
    if (this.#status.state === 'idle') {
      this.#logger.warn('Already stopped');
      return;
    }
    this.#cancelCurrentPlayerOp();
    this.#playerOpAbortController = new AbortController();
    const signal = this.#playerOpAbortController.signal;
    try {
      await Promise.all([
        this.#player.stop(),
        this.#waitForPlayerEvent('stopped', signal)
      ]);
      this.#setStatus({
        channel: null,
        track: null,
        state: 'idle'
      });
    } catch (error: unknown) {
      if (signal.aborted) {
        return;
      }
      throw error;
    } finally {
      this.#playerOpAbortController = null;
    }
  }

  #toPlayerTrackInfo(track: BlockTrack): PlayerTrackInfo {
    return {
      ..._.pick(track, [
        'id',
        'type',
        'title',
        'artist',
        'album',
        'year',
        'duration',
        'slideshow',
        'rating',
        'cover',
        'format',
        'bitrate'
      ]),
      positionInStream: track.elapsed || 0
    };
  }

  #logBlockSummary() {
    if (!this.#currentBlock) {
      return;
    }
    this.#logger.info('-------------');
    this.#logger.info('Block summary');
    this.#logger.info('-------------');
    this.#logger.info(`Stream URL: ${this.#currentBlock.url}`);
    this.#logger.info(`Tracks:`);
    for (const [index, track] of Object.entries(this.#currentBlock.tracks)) {
      const durationStr =
        track.duration !== null ?
          millisToMinutesAndSeconds(track.duration)
        : 'infinite stream';
      const elapsedStr =
        track.elapsed !== undefined ?
          millisToMinutesAndSeconds(track.elapsed, 'alphanumeric')
        : 'undefined';
      this.#logger.info(
        `${index}. ${track.title} (${durationStr} | elapsed: ${elapsedStr})`
      );
    }
    this.#logger.info('');
  }

  #validateBlock(block: Block) {
    if (
      Object.entries(block.tracks).length === 0 ||
      // If duration is also null or 0, then it's an infinite stream and should not fail validation.
      Object.values(block.tracks).some(
        (track) => track.elapsed === undefined && track.duration
      )
    ) {
      return {
        validated: false as const,
        reason: 'One or more tracks are missing the elapsed value'
      };
    }
    return {
      validated: true as const
    };
  }

  async getNowPlayingList(params: GetNowPlayingListParams = {}) {
    if (!this.#currentBlock) {
      return null;
    }
    return await this.#api.nowPlayingList({
      currentBlock: this.#currentBlock,
      after: params.after
    });
  }

  getStatus() {
    return this.#status;
  }

  async dispose() {
    this.#cancelCurrentPlayerOp();
    await this.#player.stop();
    this.#player.off('stop', this.#stopListener);
  }

  on(eventName: 'status', listener: (status: PlayerStatus) => void): this;
  on<K>(eventName: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(eventName, listener);
  }

  once(eventName: 'status', listener: (status: PlayerStatus) => void): this;
  once<K>(
    eventName: string | symbol,
    listener: (...args: any[]) => void
  ): this {
    return super.once(eventName, listener);
  }

  off(eventName: 'status', listener: (status: PlayerStatus) => void): this;
  off<K>(eventName: string | symbol, listener: (...args: any[]) => void): this {
    return super.off(eventName, listener);
  }

  emit(eentName: 'status', status: PlayerStatus): boolean;
  emit<K>(eventName: string | symbol, ...args: any[]): boolean {
    return super.emit(eventName, ...args);
  }
}
