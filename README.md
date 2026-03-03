# rp.js

`rp.js` is a library for managing playback of [Radio Paradise](https://radioparadise.com/) channels.

## How it works

Content of a Radio Paradise channel is organized into blocks. Each block represents an audio stream that covers multiple tracks. A simplified version of a block would look something like this:

```typescript
{
  url: ... // URL of the audio stream
  tracks: [
    {
      title: ...
      artist: ...
      album: ...
      duration: ...
      elapsed: ... // Starting position of the track within the stream
    },
    {
      title: ...
      artist: ...
      album: ...
      duration: ...
      elapsed: ...
    }
    ...
  ]
}
```

Playing a channel initiates the playback of sequential blocks. As one block finishes, the next is automatically fetched and played in a continuous loop.

`rp.js` manages playback through this orchestration mechanism. Note that, on its own, it does not handle the actual audio output; for this, you must provide a [player implementation](#player-implementation). `rp.js` would then direct your player to the relevant stream URLs and update the track information as playback progresses.

## Usage

For a full list of methods and options, see the [API Documentation](./docs/api/).

### Player implementation

To enable playback, you must provide a player implementation to `rp.js` by extending the [Player](./docs/api/classes/Player.md) abstract class:

```typescript
import { Player, RadioParadise } from '@patrickkfkan/rp.js';

class MyPlayer extends Player {

  getCurrentPosition() {
    return ... // Return the current playback position in milliseconds
  }
  
  async play(url: string, position: number) {
    // Perform play logic
    ...
    // Signal playback started
    this.notifyPlaying(this.getCurrentPosition());
  }

  async pause() {
    // Perform pause logic
    ...
    // Signal playback paused
    this.notifyPaused(this.getCurrentPosition());
  }

  async resume() {
    // Perform resume logic
    ...
    // Signal playback resumed
    this.notifyPlaying(this.getCurrentPosition());
  }

  async seek(position: number) {
    // Perform seek logic
    ...
    // Signal seeked
    this.notifySeeked((this.getCurrentPosition());
  }

  async stop() {
    // Perform stop logic
    ...
    // Signal stopped
    this.notifyStopped();
  }

  /**
   * The following is optional, but enables better playback tracking
   * if provided.
   */
  getPosition = () => {
    // Return the player's current seek position
    return ...;
  };

  /**
   * Important: you should also ensure notifyStopped() is called when
   * playback reaches the end.
   **/
}

// Create `RadioParadise` instance with your player implementation
const rp = new RadioParadise({
  player: new MyPlayer()
});

// Play channel.
// Your player implementation will be used to play the audio streams.
await rp.play('0');
```

### Playback-related methods

<details>
  <summary><code>getChannels()</code></summary>

  #### Description
  Retrieves the list of available channels.

  #### Returns
  An array of [Channel](./docs/api/interfaces/Channel.md) objects.

  #### Example
  ```typescript
  const channels = await rp.getChannels();
  console.log(`Playing channel "${channels[0].title}"`);
  await rp.play(channels[0]);
  ```
</details>

<details>
  <summary><code>play(channel)</code></summary>

  #### Description
  Plays the specified channel.

  #### Parameters
  - **channel**: The ID of the channel (`string`) or a [Channel](./docs/api/interfaces/Channel.md) object.

  #### Returns
  `Promise<void>`: A promise that resolves when playback has started.

  #### Example
  ```typescript
  const channels = await rp.getChannels();
  
  // Play by ID
  await rp.play(channels[0].id);

  // Play by Channel object
  await rp.play(channels[0]);
  ```
</details>

<details>
  <summary><code>pause()</code></summary>

  #### Description
  Pauses current playback.

  #### Returns
  `Promise<void>`: A promise that resolves when playback has paused.

  #### Example
  ```typescript
  await rp.pause();
  ```
</details>

<details>
  <summary><code>resume()</code></summary>

  #### Description
  Resumes paused playback.

  #### Returns
  `Promise<void>`: A promise that resolves when playback has resumed.

  #### Example
  ```typescript
  await rp.resume();
  ```
</details>

<details>
  <summary><code>seek(positionInTrack)</code></summary>

  #### Description
  Seeks to the specified position in the track.

  #### Parameters
  - **positionInTrack**: The playback position to seek to, in milliseconds.

  #### Returns
  `Promise<void>`: A promise that resolves when seek has finished.

  #### Example
  ```typescript
  // Seek to 15 seconds
  await rp.seek(15000);
  ```
</details>

<details>
  <summary><code>skip()</code></summary>

  #### Description
  Skips to the next track.

  #### Returns
  `Promise<void>`: A promise that resolves when playback of the next track has started.

  #### Example
  ```typescript
  await rp.skip();
  ```
</details>

<details>
  <summary><code>stop()</code></summary>

  #### Description
  Stops current playback.

  #### Returns
  `Promise<void>`: A promise that resolves when playback has stopped.

  #### Example
  ```typescript
  await rp.stop();
  ```
</details>

<details>
  <summary><code>getNowPlayingList(params)</code></summary>

  #### Description
  Retrieves the current track and playback history.

  If `after` is omitted from `params`, this method returns the currently playing track and the playback history. Otherwise, it returns the history preceding the `after` list.

  #### Parameters
  - **params**: (*optional*) Request parameters
    - **after**: (*optional*) A [NowPlayingList](./docs/api/interfaces/NowPlayingList.md) object to retrieve more history from.

  #### Returns
  `Promise<NowPlayingList | null>`: A promise that resolves a [NowPlayingList](./docs/api/interfaces/NowPlayingList.md), or `null` if no list is available.

  #### Example
  ```typescript
  // Get currently playing track and playback history
  const list = await rp.getNowPlayingList();
  if (list) {
    // Get more history
    const more = await rp.getNowPlayingList({ after: list });
    if (more) {
      list.tracks.push(...more.tracks);
    }
    console.log('');
    console.log('Now playing list');
    console.log('----------------');
    list.tracks.forEach((track, i) => {
      const title = getTrackTitleArtistAlbumString(track);
      console.log(`${i}: ${title}`);
    });
    console.log('');
  } else {
    console.log('Now playing list is not available in the current context');
  }
  ```
</details>

### Logging

To enable logging, provide a [Logger](./docs/api/interfaces/Logger.md) implementation:

```typescript
import { type Logger } from '@patrickkfkan/rp.js';

const logger: Logger = {
  info: (msg) => console.info(msg),
  warn: (msg) => console.warn(msg),
  debug: (msg) => console.debug(msg),
  error: (msg) => console.error(msg)
};

const rp = new RadioParadise({
  logger,
  player
});
```

### Session

Saving session data:

```typescript
fs.writeFileSync('path/to/session/file', rp.getSessionData());
```

Restoring previous session:

```typescript
sessionData = fs.readFileSync('path/to/session/file', 'utf-8');
const rp = new RadioParadise({
  player,
  sessionData
});
```

### Status

Status is encapsulated in a [PlayerStatus](./docs/api/interfaces/PlayerStatus.md) object. It contains playback state and information about the current track.

You can listen for status change events:

```typescript
rp.on('status', (status) => {
  // Do something with status
  ...
});
```

You can also get status manually:

```typescript
const status = rp.getStatus();
console.log(`Status: ${status.state}${status.track ? `: ${status.track.title}` : ''}`);
```

### Metadata

<details>
  <summary><code>getSongInfo(params)</code></summary>

  #### Description
  Retrieves information about the song specified by `params.song_id`, or the current track if omitted.

  #### Parameters
  - **params**: (*optional*) Request parameters
    - **song_id**: (*optional*) The ID of the song to retrieve (`string`).

  #### Returns
  `Promise<SongInfo | null>`: A promise that resolves to a [SongInfo](./docs/api/interfaces/SongInfo.md) object, or `null` if no information is available.

  #### Example
  ```typescript
  const songInfo = await rp.getSongInfo();
  if (songInfo) {
    console.log('');
    console.log('Song info');
    console.log('---------');
    console.log(JSON.stringify(songInfo, null, 2));
  }
  ```
</details>

<details>
  <summary><code>getArtistInfo(params)</code></summary>

  #### Description
  Retrieves information about the artist specified by `params.artist_id`, or the current track's artist if omitted.

  #### Parameters
  - **params**: (*optional*) Request parameters
    - **artist_id**: (*optional*) The ID of the artist to retrieve (`string`).

  #### Returns
  `Promise<ArtistInfo | null>`: A promise that resolves to a [ArtistInfo](./docs/api/interfaces/ArtistInfo.md) object, or `null` if no information is available.

  #### Example
  ```typescript
  const artistInfo = await rp.getArtistInfo();
  if (artistInfo) {
    console.log('');
    console.log('Artist info');
    console.log('-----------');
    console.log(JSON.stringify(artistInfo, null, 2));
  }
  ```
</details>

<details>
  <summary><code>getAlbumInfo(params)</code></summary>

  #### Description
  Retrieves information about the album specified by `params.album_id`, or the current track's album if omitted.

  #### Parameters
  - **params**: (*optional*) Request parameters
    - **album_id**: (*optional*) The ID of the album to retrieve (`string`).

  #### Returns
  `Promise<AlbumInfo | null>`: A promise that resolves to a [AlbumInfo](./docs/api/interfaces/AlbumInfo.md) object, or `null` if no information is available.

  #### Example
  ```typescript
  const albumInfo = await rp.getAlbumInfo();
  if (albumInfo) {
    console.log('');
    console.log('Album info');
    console.log('----------');
    console.log(JSON.stringify(albumInfo, null, 2));
  }
  ```
</details>

## Running the example

Clone this repo, then:

```
npm run example
```

Notes:
- The example only works on Linux.
- It uses [mpv](https://mpv.io/) + [volumio-ext-players](https://github.com/patrickkfkan/volumio-ext-players) module for player implementation and requires the `mpv` executable to be in your system path.
- mpv is configured to output to `alsa/default` audio device. You can change that in [example/player.ts](./example/player.ts).

## Changelog

1.0.0
- Initial release

## Disclaimer

This project is an independent work and is not affiliated with, endorsed by, or in any way officially connected to Radio Paradise.

## License

MIT. See [LICENSE](./LICENSE).