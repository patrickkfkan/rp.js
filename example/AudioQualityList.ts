import blessed from 'blessed';
import EventEmitter from 'events';
import { AudioQuality } from '../dist/core/RadioParadise.js';

const OPTIONS = [
  { value: AudioQuality.Low, label: 'Low' },
  { value: AudioQuality.Med, label: 'Medium' },
  { value: AudioQuality.High, label: 'High' },
  { value: AudioQuality.Ultra, label: 'Ultra' },
  { value: AudioQuality.Flac, label: 'FLAC' }
];

class AudioQualityList extends EventEmitter {
  #menu;
  #screen;

  constructor(screen: blessed.Widgets.Screen) {
    super();
    this.#screen = screen;
    const menu = (this.#menu = blessed.list({
      parent: screen,
      label: ' {bold}Audio Quality{/bold} (Esc to close) ',
      tags: true,
      top: 'center',
      left: 'center',
      width: '40%',
      height: 7,
      keys: true,
      mouse: true,
      border: { type: 'line' },
      style: {
        border: { fg: 'blue' },
        selected: { bg: 'cyan', fg: 'black', bold: true }, // Highlight selected item
        item: { fg: 'white' }
      },
      items: OPTIONS.map((option) => option.label),
      hidden: true
    }));

    menu.on('select', (item, index) => {
      if (!OPTIONS[index]) {
        return;
      }
      this.emit('select', OPTIONS[index].value);
      menu.hide();
      screen.render();
    });

    // Close on Esc
    menu.on('keypress', (ch, key) => {
      if (key.name === 'escape') {
        menu.hide();
        screen.render();
      }
    });
  }

  show() {
    this.#menu.show();
    this.#menu.focus();
    this.#screen.render();
  }
}

export function createAudioQualityList(screen: blessed.Widgets.Screen) {
  return new AudioQualityList(screen);
}
