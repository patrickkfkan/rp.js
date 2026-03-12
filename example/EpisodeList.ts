import blessed from 'blessed';
import EventEmitter from 'events';

class EpisodeList extends EventEmitter {
  #menu;
  #screen;
  #episodes: {
    id: string;
    title: string;
  }[];

  constructor(screen: blessed.Widgets.Screen) {
    super();
    this.#screen = screen;
    this.#episodes = [];
    const menu = (this.#menu = blessed.list({
      parent: screen,
      label: ' {bold}Episodes{/bold} (Esc to close) ',
      tags: true,
      top: 'center',
      left: 'center',
      width: '60%',
      height: '80%',
      keys: true,
      mouse: true,
      border: { type: 'line' },
      style: {
        border: { fg: 'blue' },
        selected: { bg: 'cyan', fg: 'black', bold: true }, // Highlight selected item
        item: { fg: 'white' }
      },
      items: [],
      scrollable: true,
      hidden: true
    }));

    menu.on('select', (item, index) => {
      if (!this.#episodes[index]) {
        return;
      }
      this.emit('select', this.#episodes[index]);
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

  setEpisodes(episodes: { id: string; title: string }[]) {
    this.#episodes = episodes;
    this.#menu.setItems(episodes.map((ep) => ep.title));
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

export function createEpisodeList(screen: blessed.Widgets.Screen) {
  return new EpisodeList(screen);
}
