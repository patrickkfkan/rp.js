import { ui } from './ui.js';
import { getPlayer } from './player.js';
import { RadioParadise } from '../dist/core/RadioParadise.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  type PlayerTrackInfo,
  type Channel,
  type Logger,
  type PlayerStatus,
  type Track
} from '../dist/index.js';

const logger: Logger = {
  info: (msg) => ui.log('info', msg),
  warn: (msg) => ui.log('warn', msg),
  debug: (msg) => ui.log('debug', msg),
  error: (msg) => ui.log('error', msg)
};

const currentChannelId = null;

function getTrackTitleArtistAlbumString(
  track: PlayerTrackInfo | Track | null,
  channel?: Channel | PlayerStatus['channel'] | null
) {
  let result;
  if (track) {
    const titleParts = [];
    if (track.title) {
      titleParts.push(track.title);
    } else if (channel) {
      titleParts.push(channel.title);
    }
    if (track.artist) {
      titleParts.push(track.artist);
    }
    if (track.album) {
      titleParts.push(track.album);
    }
    result = titleParts.join(' | ');
  } else if (channel) {
    result = channel.title;
  } else {
    result = '';
  }
  return result;
}

function updateStatusBar(status: PlayerStatus) {
  if (status.state === 'idle') {
    ui.setStatus('Idle');
    return;
  }
  const state =
    status.state === 'loading' ? '[Loading] '
    : status.state === 'playing' ? '[Playing] '
    : status.state === 'paused' ? '[Paused] '
    : '';
  const title = getTrackTitleArtistAlbumString(status.track, status.channel);
  ui.setStatus(`${state}${title}`);
}

// Restore session from session.txt (if exists)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sessionFile = path.join(__dirname, 'session.txt');

async function run() {
  let sessionData;
  if (fs.existsSync(sessionFile)) {
    logger.info('Use session data from session.txt');
    sessionData = fs.readFileSync(sessionFile, 'utf-8');
  }
  const player = await getPlayer();
  const rp = new RadioParadise({
    player,
    logger,
    sessionData
  });

  updateStatusBar(rp.getStatus());

  const channels = await rp.getChannels();
  logger.info('Obtained channel data:');
  channels.forEach((channel) => {
    logger.info(`${channel.id}: ${channel.title}`);
  });
  logger.info('Press c to choose a channel to play');
  ui.channelList.setChannels(channels);
  ui.channelList.on('select', (channel) => {
    void (async () => {
      if (channel.id === currentChannelId) {
        return;
      }
      logger.info(`Going to play channel "${channel.title}"`);
      try {
        await rp.play(channel.id);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
      }
    })();
  });

  ui.audioQualityList.on('select', (quality) => {
    void (async () => {
      await rp.setQuality(quality);
    })();
  });

  ui.episodeList.on('select', (episode) => {
    void (async () => {
      const channel = channels.find((chan) => chan.is_episodic_radio);
      if (!channel) {
        logger.error('No episodic radio found');
        return;
      }
      await rp.play(channel, episode.id);
    })();
  });

  rp.on('status', (status) => {
    logger.debug(
      `Captured "status" event - ${status.state}${status.track ? `: ${status.track.title}` : ''}`
    );
    updateStatusBar(status);
  });

  ui.key(['q', 'C-c'], () => {
    void (async () => {
      logger.info('Save session data to session.txt');
      fs.writeFileSync(sessionFile, rp.getSessionData());
      await rp.stop();
      await player.quit();
      process.exit(0);
    })();
  });

  ui.key('p', () => {
    void (async () => {
      try {
        switch (rp.getStatus().state) {
          case 'playing':
            await rp.pause();
            logger.info(`Paused`);
            break;
          case 'paused':
            await rp.resume();
            logger.info('Resumed');
            break;
        }
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
      }
    })();
  });

  ui.key('>', () => {
    void (async () => {
      try {
        await rp.skip();
        logger.info('Skipped song');
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
      }
    })();
  });

  ui.key('c', () => ui.channelList.show());

  ui.key('f', () => ui.audioQualityList.show());

  ui.key('n', () => {
    void (async () => {
      logger.info('Fetching now playing list...');
      const list = await rp.getNowPlayingList();
      if (list) {
        logger.info('Fetching more items in now playing list...');
        const more = await rp.getNowPlayingList({ after: list });
        if (more) {
          list.tracks.push(...more.tracks);
        }
        logger.info('');
        logger.info('Now playing list');
        logger.info('----------------');
        list.tracks.forEach((track, i) => {
          const title = getTrackTitleArtistAlbumString(track);
          logger.info(`${i}: ${title}`);
        });
        logger.info('');
      } else {
        logger.info('Now playing list is not available in the current context');
      }
    })();
  });

  ui.key('i', () => {
    void (async () => {
      const track = rp.getStatus().track;
      if (!track) {
        logger.info('No info available - playback not in progress');
        return;
      }
      if (track.type === 'T') {
        logger.info('Fetching episode info...');
        const episode = await rp.getEpisode();
        if (episode) {
          logger.info('About episode');
          logger.info('-------------');
          logger.info(JSON.stringify(episode, null, 2));
        } else {
          logger.info('No episode info available');
        }
        return;
      }
      if (track.type === 'M') {
        logger.info('Fetching song info...');
        const songInfo = await rp.getSongInfo();
        if (songInfo) {
          logger.info('');
          logger.info('Song info');
          logger.info('---------');
          logger.info(JSON.stringify(songInfo, null, 2));
        } else {
          logger.info('No song info available');
        }
        logger.info('Fetching artist info...');
        const artistInfo = await rp.getArtistInfo();
        if (artistInfo) {
          logger.info('');
          logger.info('Artist info');
          logger.info('-----------');
          logger.info(JSON.stringify(artistInfo, null, 2));
        } else {
          logger.info('No artist info available');
        }
        logger.info('Fetching album info...');
        const albumInfo = await rp.getAlbumInfo();
        if (albumInfo) {
          logger.info('');
          logger.info('Album info');
          logger.info('---------');
          logger.info(JSON.stringify(albumInfo, null, 2));
        } else {
          logger.info('No album info available');
        }
        return;
      }
      logger.info('No info available for this track');
    })();
  });

  ui.key('e', () => {
    void (async () => {
      logger.info('Fetching episodes...');
      const { episodes } = await rp.getEpisodeList({ limit: 30 });
      ui.episodeList.setEpisodes(episodes);
      ui.episodeList.show();
    })();
  });

  ui.key('m', () => {
    const status = player.getStatus();
    logger.info(`MPV status: ${JSON.stringify(status, null, 2)}`);
  });
}

void (async () => {
  try {
    await run();
  } catch (error: unknown) {
    logger.error(
      `Uncaught error in main: ${error instanceof Error ? error.message : String(error)}`
    );
  }
})();
