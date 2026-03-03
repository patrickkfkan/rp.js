import blessed from 'blessed';
import EventEmitter from 'events';

class ChannelList extends EventEmitter {
  #menu;
  #screen;
  #channels: {
    id: string;
    title: string;
  }[];

  constructor(screen: blessed.Widgets.Screen) {
    super();
    this.#screen = screen;
    this.#channels = [];
    const menu = (this.#menu = blessed.list({
      parent: screen,
      label: ' {bold}Channels{/bold} (Esc to close) ',
      tags: true,
      top: 'center',
      left: 'center',
      width: '40%',
      height: '3',
      keys: true,
      mouse: true,
      border: { type: 'line' },
      style: {
        border: { fg: 'blue' },
        selected: { bg: 'cyan', fg: 'black', bold: true }, // Highlight selected item
        item: { fg: 'white' }
      },
      items: [],
      hidden: true
    }));

    menu.on('select', (item, index) => {
      if (!this.#channels[index]) {
        return;
      }
      this.emit('select', this.#channels[index]);
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

  setChannels(channels: { id: string; title: string }[]) {
    this.#channels = channels;
    this.#menu.setItems(channels.map((channel) => channel.title));
    this.#menu.height = channels.length + 2; // +2 for top/bottom borders
    this.#menu.select(0);
    this.#menu.setScroll(0);
    this.#screen.render();
  }

  show() {
    this.#menu.show();
    this.#menu.focus();
    this.#screen.render();
  }
}

export function createChannelList(screen: blessed.Widgets.Screen) {
  return new ChannelList(screen);
}
