import { EventEmitter } from 'stream';
import { type BlockTrack } from '../types/media';

export type PlayerTrackInfo = Pick<
  BlockTrack,
  | 'id'
  | 'title'
  | 'artist'
  | 'album'
  | 'year'
  | 'duration'
  | 'slideshow'
  | 'rating'
  | 'cover'
  | 'type'
  | 'format'
  | 'bitrate'
> & {
  positionInStream: number;
};

export interface PlayerStatus {
  state: 'idle' | 'playing' | 'paused' | 'loading';
  channel: {
    id: string;
    title: string;
    streamName: string;
    isEpisodeRadio: boolean;
  } | null;
  track: PlayerTrackInfo | null;
}

export abstract class Player extends EventEmitter {
  /**
   * Returns the current seek position in milliseconds.
   */
  getPosition?: () => number;

  /**
   * Plays the stream at `url` starting from `position`. Implementations must call {@link notifyPlaying} after playback has started.
   * @param url The URL of the stream to play.
   * @param position Position from which to start playback (milliseconds).
   */
  abstract play(url: string, position: number): Promise<void>;

  /**
   * Pauses playback. Implementations must call {@link notifyPaused} after playback has paused.
   */
  abstract pause(): Promise<void>;

  /**
   * Resumes paused playback. Implementations must call {@link notifyPlaying} after playback has resumed.
   */
  abstract resume(): Promise<void>;
  /**
   * Seeks to `position`. Implementations must call {@link notifySeeked} after seeking.
   * @param position Position to seek to (milliseconds).
   */
  abstract seek(position: number): Promise<void>;

  /**
   * Stops the player. Implementations must call {@link notifyStopped} after player has stopped.
   */
  abstract stop(): Promise<void>;

  /**
   * Signals that playback has started.
   * @param position The position at which playback started (milliseconds).
   */
  notifyPlaying(position: number) {
    this.emit('playing', { position });
  }

  /**
   * Signals that playback has paused.
   * @param position The position at which playback paused (milliseconds).
   */
  notifyPaused(position: number) {
    this.emit('paused', { position });
  }

  /**
   * Signals that player has stopped.
   */
  notifyStopped() {
    this.emit('stopped');
  }

  /**
   * Signals that player has finished seeking.
   * @param position The position after seeking (milliseconds).
   */
  notifySeeked(position: number) {
    this.emit('seeked', { position });
  }
}
