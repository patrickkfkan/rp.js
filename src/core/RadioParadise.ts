import { Session } from './Session';
import { PlayerWrapper } from './PlayerWrapper';
import { API } from './API';
import { type Channel, type NowPlayingList, type Episode } from '../types';
import { type Player, type PlayerStatus } from './Player';
import EventEmitter from 'events';
import { type Logger, NULL_LOGGER } from '../utils/logging';

export enum AudioQuality {
  Low = '0',
  Med = '1',
  High = '2',
  Ultra = '3',
  Flac = '4'
}

export interface RadioParadiseOptions {
  /**
   * Player implementation. If omitted, calling playback-related methods will
   * throw an error.
   *
   * See {@link Player}.
   */
  player?: Player;
  /**
   * {@link Logger} implementation. If omitted, log messages will be discarded.
   */
  logger?: Logger;
  /**
   * Audio quality.
   */
  quality?: AudioQuality;
  /**
   * Data for restoring a previous session.
   * You can obtain session data with {@link RadioParadise.getSessionData}.
   */
  sessionData?: string;
}

export interface GetNowPlayingListParams {
  /**
   * The {@link NowPlayingList} to retrieve more history from.
   */
  after?: NowPlayingList;
}

export interface GetSongInfoParams {
  /**
   * The ID of the song to retrieve.
   */
  song_id?: string;
}

export interface GetArtistInfoParams {
  /**
   * The ID of ths artist to retrieve.
   */
  artist_id?: string;
}

export interface GetAlbumInfoParams {
  /**
   * The ID of the album to retrieve.
   */
  album_id?: string;
}

export interface GetEpisodeListParams {
  /**
   * Offset of the first item in the list to return.
   * 
   * @default 0
   */
  start?: number;
  /**
   * Number of items to return.
   * 
   * @default 10
   */
  limit?: number;
  /**
   * Sort order of the items.
   * 
   * @default DESC
   */
  sort?: 'ASC' | 'DESC';
}

export interface GetEpisodeParams {
  episode_id?: string;
}

/**
 * Main class of the library.
 */
export class RadioParadise extends EventEmitter {
  #session: Session;
  #logger: Logger;
  #api: API;
  #playerWrapper: PlayerWrapper | null;
  #disposed = false;

  constructor(options?: RadioParadiseOptions) {
    super();
    this.#session = new Session({
      data: options?.sessionData,
      logger: options?.logger
    });
    this.#logger = options?.logger ?? NULL_LOGGER;
    this.#api = new API(this.#session, this.#logger);
    if (options?.player) {
      this.#playerWrapper = new PlayerWrapper(
        options.player,
        options.quality ?? AudioQuality.High,
        this.#api,
        this.#logger
      );
      this.#playerWrapper.on('status', (status: PlayerStatus) => {
        this.emit('status', status);
      });
    } else {
      this.#playerWrapper = null;
    }
  }

  /**
   * Sets the audio quality.
   * @param quality A {@link AudioQuality} value.
   */
  async setQuality(quality: AudioQuality) {
    if (!this.#playerWrapper) {
      this.#logger.warn(`Could not set audio quality: no player available.`);
      return;
    }
    await this.#playerWrapper.setQuality(quality);
  }

  /**
   * Retrieves the list of available channels.
   * @returns A list of {@link Channel} objects.
   */
  async getChannels(): Promise<Channel[]> {
    return await this.#api.getChannels();
  }

  #assertReady() {
    if (this.#disposed) {
      throw Error('Instance disposed');
    }
    if (!this.#playerWrapper) {
      throw new Error('No player provided');
    }
    return this.#playerWrapper;
  }

  /**
   * Plays content from the specified channel or episode.
   * 
   * @param {string|Object} channel - The channel ID (string) or channel object.
   * @param {string|Object} [episode] - Optional. The episode ID (string) or episode object.
   * 
   * @description
   * - If `episode` is provided, plays that specific episode from the channel.
   * - If `episode` is omitted, plays the live stream or default content of the channel.
   * 
   * @throws {Error} If an episode is provided but the channel does not support episodic content 
   * (i.e., `channel.is_episodic_radio` is false).
   */
  async play(channel: string | Channel, episode?: string | Episode) {
    if (episode) {
      let channelObj: Channel;
      if (typeof channel === 'string') {
        const chan = (await this.getChannels()).find((chan) => chan.id === channel);
        if (!chan) {
          throw Error(`Channel "${channel}" not found`);
        }
        channelObj = chan;
      }
      else {
        channelObj = channel;
      }
      if (!channelObj.is_episodic_radio) {
        throw Error(`Cannot play episode from non-episodic channel "${channelObj.title}"`);
      }
    }
    await this.#assertReady().play(channel, episode);
  }

  /**
   * Pauses current playback.
   */
  async pause() {
    await this.#assertReady().pause();
  }

  /**
   * Resumes paused playback.
   */
  async resume() {
    await this.#assertReady().resume();
  }

  /**
   * Seeks to the specified position in the track.
   * @param positionInTrack The playback position to seek to, in milliseconds.
   */
  async seek(positionInTrack: number) {
    await this.#assertReady().seek(positionInTrack);
  }

  /**
   * Skips to the next track.
   */
  async skip() {
    await this.#assertReady().next();
  }

  /**
   * Stops current playback.
   */
  async stop() {
    await this.#assertReady().stop();
  }

  /**
   * Returns the current playback status.
   * @returns The current {@link PlayerStatus}.
   */
  getStatus() {
    return this.#assertReady().getStatus();
  }

  /**
   * Retrieves the current track and playback history.
   *
   * If `after` is omitted from `params`, returns the currently playing track and the playback history.
   * Otherwise, returns the history preceding the `after` list.
   *
   * @param params Request parameters. See {@link GetNowPlayingListParams}.
   * @returns The {@link NowPlayingList}, or `null` if no list is available.
   */
  getNowPlayingList(params?: GetNowPlayingListParams) {
    return this.#assertReady().getNowPlayingList(params);
  }

  /**
   * Retrieves information about the song specified by `params.song_id`,
   * or the current track if omitted.
   *
   * Returns `null` if no information is available.
   *
   * @param params Request parameters. See {@link GetSongInfoParams}.
   * @returns The {@link SongInfo}, or `null`.
   */
  async getSongInfo(params?: GetSongInfoParams) {
    const song_id = params?.song_id;
    if (!song_id) {
      const { track } = this.getStatus() ?? {};
      if (!track) {
        this.#logger.warn('No track in progress, and no song_id was provided.');
        return null;
      }
      if (!track.id) {
        this.#logger.warn(
          'Current track does not have a song_id, and no song_id was provided.'
        );
        return null;
      }
      if (track.type !== 'M') {
        this.#logger.warn(
          'Current track is not a song, and no song_id was provided.'
        );
        return null;
      }
      return this.#api.getSongInfo({ song_id: track.id });
    }
    return this.#api.getSongInfo({ song_id });
  }

  /**
   * Retrieves information about the artist specified by `params.artist_id`,
   * or the current track's artist if omitted.
   *
   * Returns `null` if no information is available.
   *
   * @param params Request parameters. See {@link GetArtistInfoParams}.
   * @returns The {@link ArtistInfo}, or `null`.
   */
  async getArtistInfo(params?: GetArtistInfoParams) {
    const artist_id = params?.artist_id;
    if (!artist_id) {
      const song = await this.getSongInfo();
      if (!song) {
        this.#logger.warn(
          'No song info available, and no artist_id was provided.'
        );
        return null;
      }
      if (!song.artist?.id) {
        this.#logger.warn(
          'Song info does not contain artist_id, and no artist_id was provided.'
        );
        return null;
      }
      return this.#api.getArtistInfo({ artist_id: song.artist.id });
    }
    return this.#api.getArtistInfo({ artist_id });
  }

  /**
   * Retrieves information about the album specified by `params.album_id`,
   * or the current track's album if omitted.
   *
   * Returns `null` if no information is available.
   *
   * @param params Request parameters. See {@link GetAlbumInfoParams}.
   * @returns The {@link AlbumInfo}, or `null`.
   */
  async getAlbumInfo(params?: GetAlbumInfoParams) {
    const album_id = params?.album_id;
    if (!album_id) {
      const song = await this.getSongInfo();
      if (!song) {
        this.#logger.warn(
          'No song info available, and no album_id was provided.'
        );
        return null;
      }
      if (!song.album?.id) {
        this.#logger.warn(
          'Song info does not contain album_id, and no album_id was provided.'
        );
        return null;
      }
      return this.#api.getAlbumInfo({ album_id: song.album.id });
    }
    return this.#api.getAlbumInfo({ album_id });
  }

  getEpisodeList(params: GetEpisodeListParams) {
    const { start = 0, limit = 10, sort = 'DESC' } = params || {};
    return this.#api.getEpisodeList({ start, limit, sort });
  }

  async getEpisode(params?: GetEpisodeParams) {
    let episode_id = params?.episode_id;
    if (!episode_id) {
      const { channel, track } = this.getStatus() ?? {};
      if (!channel || !channel.isEpisodeRadio || !track || track.type !== 'T') {
        this.#logger.warn('No episode in progress, and no episode_id was provided');
        return null;
      }
      episode_id = track.episode_id;
    }
    return await this.#api.getEpisode({ episode_id });
  }

  /**
   * Returns the current session data.
   * @returns A serialized string representing the session state.
   */
  getSessionData() {
    return JSON.stringify(this.#session.serialize());
  }

  /**
   * Disposes of the instance.
   *
   * After disposal, calling playback-related methods will throw an error.
   */
  async dispose() {
    if (this.#disposed) {
      return;
    }
    if (this.#playerWrapper) {
      await this.#playerWrapper.dispose();
      this.#playerWrapper = null;
    }
    this.#disposed = true;
  }

  on(eventName: 'status', listener: (status: PlayerStatus) => void): this;
  on(eventName: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(eventName, listener);
  }

  once(eventName: 'status', listener: (status: PlayerStatus) => void): this;
  once(eventName: string | symbol, listener: (...args: any[]) => void): this {
    return super.once(eventName, listener);
  }

  off(eventName: 'status', listener: (status: PlayerStatus) => void): this;
  off(eventName: string | symbol, listener: (...args: any[]) => void): this {
    return super.off(eventName, listener);
  }

  emit(eentName: 'status', status: PlayerStatus): boolean;
  emit(eventName: string | symbol, ...args: any[]): boolean {
    return super.emit(eventName, ...args);
  }
}
