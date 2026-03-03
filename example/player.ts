import { MPVService } from 'volumio-ext-players';
import { ui } from './ui.js';
import { Player } from '../dist/index.js';

class MPVPlayer extends Player {
  #mpv;

  constructor() {
    super();
    this.#mpv = new MPVService({
      serviceName: 'rp',
      logger: {
        info: () => null,
        warn: (msg) => ui.log('warn', msg),
        error: (msg) => ui.log('error', msg)
      },
      mpvArgs: ['--audio-device=alsa/default'],
      // MPVService spawns mpv with uid and gid both set to 1000, which corresponds
      // to 'volumio' user on VolumioOS.
      // Override this by setting them to `null` so default uid / gid will be used.
      spawnOptions: {
        uid: null,
        gid: null
      }
    });
    this.#mpv.on('status', (status) => {
      if (status.state === 'stopped') {
        this.notifyStopped();
      }
    });
  }

  async start() {
    await this.#mpv.start();
  }

  async play(url: string, position: number) {
    await this.#mpv.play(
      {
        uri: url,
        streamUrl: url
      },
      position / 1000
    );
    this.notifyPlaying((this.#mpv.getStatus()?.time || 0) * 1000);
  }

  async pause() {
    await this.#mpv.pause();
    this.notifyPaused((this.#mpv.getStatus()?.time || 0) * 1000);
  }

  async resume() {
    await this.#mpv.resume();
    this.notifyPlaying((this.#mpv.getStatus()?.time || 0) * 1000);
  }

  async seek(position: number) {
    await this.#mpv.seek(position / 1000);
    this.notifySeeked((this.#mpv.getStatus()?.time || 0) * 1000);
  }

  async stop() {
    await this.#mpv.stop();
    this.notifyStopped();
  }

  getPosition = () => {
    return (this.getStatus()?.time ?? 0) * 1000;
  };

  async quit() {
    await this.#mpv.quit();
  }

  getStatus() {
    return this.#mpv.getStatus();
  }
}

const player = new MPVPlayer();
let playerStarted = false;

export async function getPlayer() {
  if (!playerStarted) {
    await player.start();
    playerStarted = true;
  }
  return player;
}
