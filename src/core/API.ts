import {
  parseListChannelsResponse,
  parseAlbumInfoResponse,
  parseArtistInfoResponse,
  parseSongInfoResponse,
  parseNowPlayingListResponse,
  parsePlayResponse
} from '../parsers';
import { parseEpisodeListResponse } from '../parsers/episode';
import { type Block, type BlockTrack, type NowPlayingList } from '../types';
import { type Logger, NULL_LOGGER } from '../utils/logging';
import { getErrorMessage, maskPlayerIdFromUrl } from '../utils/string-util';
import { type AudioQuality } from './RadioParadise';
import { type Session } from './Session';

export interface ApiPlayParams {
  event: string;
  elapsed: string;
  quality: AudioQuality;
  action: 'start' | 'play';
  info: boolean;
  channel_id: string;
  slice_num?: string;
  episode_id?: string;
  audio_type: string;
}

export interface ApiUpdatePauseParams {
  position: number; // Pause position in milliseconds
  currentBlock: Block;
  currentTrack: BlockTrack;
}

export interface ApiUpdateHistoryParams {
  play_position: number; // Play position in milliseconds
  pause?: boolean;
  currentBlock: Block;
  currentTrack: BlockTrack;
}

export interface ApiNowPlayingListParams {
  currentBlock: Block;
  after?: NowPlayingList;
}

export interface ApiGetSongInfoParams {
  song_id: string;
}

export interface ApiGetArtistInfoParams {
  artist_id: string;
}

export interface ApiGetAlbumInfoParams {
  album_id: string;
}

export interface ApiGetEpisodeListParams {
  start: number;
  limit: number;
  sort: 'ASC' | 'DESC';
}

export interface ApiGetEpisodeParams {
  episode_id: string;
}

const API_URL = 'https://api.radioparadise.com/api';
const VSH_API_URL = 'https://vsh-sdata.radioparadise.com/api';
const SITEAPI_URL = 'https://api.radioparadise.com/siteapi.php';
const AUTH_ENDPOINT = `${API_URL}/auth`;
const LIST_CHANNELS_ENDPOINT = `${API_URL}/list_chan?source=24`;
const PLAY_ENDPOINT = `${API_URL}/play?source=24`;
const UPDATE_PAUSE_ENDPOINT = `${API_URL}/update_pause?source=24`;
const UPDATE_HISTORY_ENDPOINT = `${API_URL}/update_history?source=24`;
const NOW_PLAYING_LIST_ENDPOINT = `${API_URL}/nowplaying_list_v2022`;
const NOW_PLAYING_LIST_MORE_ENDPOINT = `${API_URL}/nowplaying_list_more_v2022`;
const SONG_INFO_ENDPOINT = `${SITEAPI_URL}?file=music%3A%3Asong&withWiki=true`;
const ARTIST_INFO_ENDPOINT = `${SITEAPI_URL}?file=music%3A%3Aartist-detail-v2022`;
const ALBUM_INFO_ENDPOINT = `${SITEAPI_URL}?file=music%3A%3Aalbum-v2022`;
const EPISODE_LIST_ENDPOINT = `${VSH_API_URL}/episodes`;

export class API {
  #session: Session;
  #logger: Logger;
  #authed = false;

  constructor(session: Session, logger?: Logger | null) {
    this.#session = session;
    this.#logger = logger ?? NULL_LOGGER;
  }

  auth() {
    return this.#session.fetch(AUTH_ENDPOINT);
  }

  async #ensureAuth() {
    if (!this.#authed) {
      await this.auth();
      this.#authed = true;
    }
  }

  async getChannels() {
    await this.#ensureAuth();
    const res = await this.#session.fetch(LIST_CHANNELS_ENDPOINT);
    return parseListChannelsResponse(await res.json());
  }

  async play(params: ApiPlayParams) {
    const url = new URL(PLAY_ENDPOINT);
    url.searchParams.set('event', params.event);
    url.searchParams.set('elapsed', params.elapsed);
    url.searchParams.set('bitrate', params.quality);
    url.searchParams.set('action', params.action);
    url.searchParams.set('player_id', this.#session.player_id);
    url.searchParams.set('info', String(params.info));
    url.searchParams.set('chan', params.channel_id);
    if (params.slice_num) {
      url.searchParams.set('slice_num', params.slice_num);
    }
    if (params.episode_id) {
      url.searchParams.set('episode_id', params.episode_id);
    }
    url.searchParams.set('audio_type', params.audio_type);
    this.#logger.debug(`API: ${maskPlayerIdFromUrl(url.toString())}`);
    const res = await this.#session.fetch(url);
    return parsePlayResponse(await res.json());
  }

  async updatePause(params: ApiUpdatePauseParams) {
    const url = new URL(UPDATE_PAUSE_ENDPOINT);
    const block = params.currentBlock;
    const currentTrack = params.currentTrack;
    url.searchParams.set('pause', String(params.position));
    url.searchParams.set('player_id', this.#session.player_id);
    url.searchParams.set('event', currentTrack.event);
    url.searchParams.set('chan', block.channel.id);
    url.searchParams.set('type', currentTrack.type);
    url.searchParams.set('slice_num', currentTrack.slice_num);
    url.searchParams.set('playtime_secs', String(Math.ceil(Date.now() / 1000)));
    url.searchParams.set('song_id', currentTrack.id || 'null');
    url.searchParams.set('episode_id', currentTrack.episode_id);
    if (currentTrack.event_num !== undefined) {
      url.searchParams.set('event_num', String(currentTrack.event_num));
    }
    this.#logger.debug(`API: ${maskPlayerIdFromUrl(url.toString())}`);
    try {
      await this.#session.fetch(url);
    } catch (error: unknown) {
      this.#logger.error(
        `API error from "${maskPlayerIdFromUrl(url.toString())}": ${getErrorMessage(error)}`
      );
    }
  }

  async updateHistory(params: ApiUpdateHistoryParams) {
    const currentTrack = params.currentTrack;
    if (!currentTrack.updateHistory || !currentTrack.id) {
      return;
    }
    const url = new URL(UPDATE_HISTORY_ENDPOINT);
    const block = params.currentBlock;
    url.searchParams.set('song_id', currentTrack.id);
    url.searchParams.set('chan', block.channel.id);
    url.searchParams.set('player_id', this.#session.player_id);
    url.searchParams.set('event', currentTrack.event);
    url.searchParams.set('type', currentTrack.type);
    url.searchParams.set('slice_num', currentTrack.slice_num);
    url.searchParams.set('episode_id', currentTrack.episode_id);
    if (currentTrack.event_num !== undefined) {
      url.searchParams.set('event_num', String(currentTrack.event_num));
    }
    if (params.pause) {
      url.searchParams.set('pause', '1');
    }
    url.searchParams.set(
      'time_relative',
      '-' + String(Math.max(0, Math.ceil(params.play_position / 1000)))
    );
    url.searchParams.set(
      'play_position_millis',
      String(Math.max(0, Math.ceil(params.play_position)))
    );
    url.searchParams.set('playtime_secs', String(Math.ceil(Date.now() / 1000)));
    this.#logger.debug(`API: ${maskPlayerIdFromUrl(url.toString())}`);
    try {
      await this.#session.fetch(url);
    } catch (error: unknown) {
      this.#logger.error(
        `API error from "${maskPlayerIdFromUrl(url.toString())}": ${getErrorMessage(error)}`
      );
    }
  }

  async nowPlayingList(params: ApiNowPlayingListParams) {
    let offset: string | undefined = undefined;
    let endpoint: string;
    if (params.after) {
      const lastTrack = params.after.tracks[params.after.tracks.length - 1];
      offset = lastTrack?.event;
    }
    if (offset) {
      endpoint = NOW_PLAYING_LIST_MORE_ENDPOINT;
    } else {
      endpoint = NOW_PLAYING_LIST_ENDPOINT;
    }
    const url = new URL(endpoint);
    const block = params.currentBlock;
    url.searchParams.set('chan', block.channel.id);
    url.searchParams.set('player_id', this.#session.player_id);
    if (offset) {
      url.searchParams.set('list_offset', offset);
    } else {
      url.searchParams.set('list_num', '4');
    }
    this.#logger.debug(`API: ${maskPlayerIdFromUrl(url.toString())}`);
    const res = await this.#session.fetch(url);
    return parseNowPlayingListResponse(await res.json(), block);
  }

  async getSongInfo(params: ApiGetSongInfoParams) {
    await this.#ensureAuth();
    const url = new URL(SONG_INFO_ENDPOINT);
    url.searchParams.set('song_id', params.song_id);
    this.#logger.debug(`API: ${url.toString()}`);
    const res = await this.#session.fetch(url);
    return parseSongInfoResponse(await res.json());
  }

  async getArtistInfo(params: ApiGetArtistInfoParams) {
    await this.#ensureAuth();
    const url = new URL(ARTIST_INFO_ENDPOINT);
    url.searchParams.set('artist_id', params.artist_id);
    this.#logger.debug(`API: ${url.toString()}`);
    const res = await this.#session.fetch(url);
    return parseArtistInfoResponse(await res.json());
  }

  async getAlbumInfo(params: ApiGetAlbumInfoParams) {
    await this.#ensureAuth();
    const url = new URL(ALBUM_INFO_ENDPOINT);
    url.searchParams.set('album_id', params.album_id);
    this.#logger.debug(`API: ${url.toString()}`);
    const res = await this.#session.fetch(url);
    return parseAlbumInfoResponse(await res.json());
  }

  async getEpisodeList(params: ApiGetEpisodeListParams) {
    const { start, limit, sort } = params;
    const url = new URL(EPISODE_LIST_ENDPOINT);
    url.searchParams.set('publicationState', 'live');
    url.searchParams.set('populate', 'deep');
    url.searchParams.set('pagination[start]', String(start));
    url.searchParams.set('pagination[limit]', String(limit));
    url.searchParams.set('sort[0]', `release_num:${sort}`);
    this.#logger.debug(`API: ${url.toString()}`);
    const res = await this.#session.fetch(url);
    return parseEpisodeListResponse(await res.json());
  }

  async getEpisode(params: ApiGetEpisodeParams) {
    const { episode_id } = params;
    const url = new URL(EPISODE_LIST_ENDPOINT);
    url.searchParams.set('publicationState', 'live');
    url.searchParams.set('populate', 'deep');
    url.searchParams.set('filters[$or][0][episode_id][$eq]', episode_id);
    url.searchParams.set('pagination[start]', '0');
    url.searchParams.set('pagination[limit]', '1');
    this.#logger.debug(`API: ${url.toString()}`);
    const res = await this.#session.fetch(url);
    return parseEpisodeListResponse(await res.json()).episodes.at(0) ?? null;
  }
}
