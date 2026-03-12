import blessed from 'blessed';
import { createChannelList } from './ChannelList.js';
import { createAudioQualityList } from './AudioQualityList.js';
import { millisToLocaleDateTimeString } from '../dist/index.js';
import { createEpisodeList } from './EpisodeList.js';

const screen = blessed.screen({
  smartCSR: true,
  fullUnicode: true,
  forceUnicode: true
});

const logBox = blessed.log({
  top: 0,
  left: 0,
  width: '100%',
  height: '100%-3',
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  mouse: true,
  scrollbar: {
    ch: ' ',
    track: { bg: 'gray' },
    style: { inverse: true }
  }
});

const statusBar = blessed.box({
  bottom: 2,
  left: 0,
  width: '100%',
  height: 1,
  content: '',
  style: { bg: 'magenta', fg: 'white' }
});

const helpBar = blessed.box({
  bottom: 0,
  left: 0,
  width: '100%',
  height: 2,
  content: [
    '[p] Toggle pause',
    '[>] Skip',
    '[c] Channels',
    '[e] Episodes',
    '[f] Quality',
    '[n] Now playing',
    '[i] Info',
    '[q] Quit'
  ].join('  '),
  style: { bg: 'blue', fg: 'white' }
});

screen.append(logBox);
screen.append(statusBar);
screen.append(helpBar);

const channelList = createChannelList(screen);
const audioQualityList = createAudioQualityList(screen);
const episodeList = createEpisodeList(screen);

export const ui = {
  log(level: 'info' | 'warn' | 'debug' | 'error', msg: string) {
    if (!msg) {
      logBox.log('');
      return;
    }
    const ts = millisToLocaleDateTimeString(Date.now());
    logBox.log(`${ts} [${level}] ${msg}`);
  },

  setStatus(text: string) {
    statusBar.setContent(text);
    screen.render();
  },

  key(k: string | string[], cb: (ch: string, key: any) => void) {
    screen.key(k, cb);
  },

  render() {
    screen.render();
  },

  channelList,
  audioQualityList: audioQualityList,
  episodeList
};
