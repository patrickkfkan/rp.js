import _ from 'lodash';
import { randomUUID } from 'crypto';
import { CookieAgent } from 'http-cookie-agent/undici';
import { CookieJar, type SerializedCookieJar } from 'tough-cookie';
import { fetch, type RequestInit } from 'undici';
import { type Logger, NULL_LOGGER } from '../utils/logging';
import { getErrorMessage } from '../utils/string-util';

export interface SessionOptions {
  data?: string;
  logger?: Logger;
}

export interface SessionData {
  player_id: string;
  jar: SerializedCookieJar | undefined;
}

const API_URL = 'https://api.radioparadise.com';

export class Session {
  #playerId: string;
  #agent: CookieAgent;
  #jar: CookieJar;
  #logger: Logger;

  constructor(options?: SessionOptions) {
    this.#logger = options?.logger ?? NULL_LOGGER;
    let jar: CookieJar | null = null;
    let player_id: string | null = null;
    if (options?.data) {
      try {
        const { player_id: parsedPlayerId, jar: parsedJar } =
          Session.parseSessionDataString(options.data);
        if (!parsedPlayerId) {
          this.#logger.warn(
            'Ignoring provided session data: missing player_id'
          );
        } else if (!parsedJar) {
          this.#logger.warn(
            'Ignoring provided session data: missing cookie jar'
          );
        } else {
          player_id = parsedPlayerId;
          jar = CookieJar.deserializeSync(parsedJar);
          this.#logger.info('Session data loaded successfully');
        }
      } catch (error) {
        this.#logger.error(
          `Failed to load session data: ${getErrorMessage(error)} - will initialize new session`
        );
        jar = null;
        player_id = null;
      }
    }
    if (!player_id) {
      player_id = Session.#generatePlayerId();
    }
    if (!jar) {
      jar = new CookieJar();
      jar.setCookieSync(`player_id=${player_id}`, API_URL);
      jar.setCookieSync('source=24', API_URL);
    }
    this.#playerId = player_id;
    this.#jar = jar;
    this.#agent = new CookieAgent({ cookies: { jar } });
  }

  static #generatePlayerId() {
    return `rp3_${randomUUID()}`;
  }

  async fetch(url: string | URL, init?: RequestInit) {
    return await fetch(url, {
      ...init,
      credentials: 'include',
      dispatcher: this.#agent
    });
  }

  get player_id() {
    return this.#playerId;
  }

  serialize(): SessionData {
    return {
      player_id: this.#playerId,
      jar: this.#jar.serializeSync()
    };
  }

  static parseSessionDataString(data: string) {
    const parsed = JSON.parse(data) as SessionData;
    const player_id =
      _.isString(_.get(parsed, 'player_id')) ? parsed.player_id : null;
    const jar = _.isObject(_.get(parsed, 'jar')) ? parsed.jar : null;
    return { player_id, jar };
  }
}
