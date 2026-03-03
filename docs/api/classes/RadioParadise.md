[**rp.js**](../README.md)

***

[rp.js](../README.md) / RadioParadise

# Class: RadioParadise

Defined in: src/core/RadioParadise.ts:71

Main class of the library.

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new RadioParadise**(`options?`): `RadioParadise`

Defined in: src/core/RadioParadise.ts:78

#### Parameters

##### options?

[`RadioParadiseOptions`](../interfaces/RadioParadiseOptions.md)

#### Returns

`RadioParadise`

#### Overrides

`EventEmitter.constructor`

## Methods

### dispose()

> **dispose**(): `Promise`\<`void`\>

Defined in: src/core/RadioParadise.ts:303

Disposes of the instance.

After disposal, calling playback-related methods will throw an error.

#### Returns

`Promise`\<`void`\>

***

### emit()

> **emit**(`eentName`, `status`): `boolean`

Defined in: src/core/RadioParadise.ts:329

Synchronously calls each of the listeners registered for the event named `eventName`, in the order they were registered, passing the supplied arguments
to each.

Returns `true` if the event had listeners, `false` otherwise.

```js
import { EventEmitter } from 'node:events';
const myEmitter = new EventEmitter();

// First listener
myEmitter.on('event', function firstListener() {
  console.log('Helloooo! first listener');
});
// Second listener
myEmitter.on('event', function secondListener(arg1, arg2) {
  console.log(`event with parameters ${arg1}, ${arg2} in second listener`);
});
// Third listener
myEmitter.on('event', function thirdListener(...args) {
  const parameters = args.join(', ');
  console.log(`event with parameters ${parameters} in third listener`);
});

console.log(myEmitter.listeners('event'));

myEmitter.emit('event', 1, 2, 3, 4, 5);

// Prints:
// [
//   [Function: firstListener],
//   [Function: secondListener],
//   [Function: thirdListener]
// ]
// Helloooo! first listener
// event with parameters 1, 2 in second listener
// event with parameters 1, 2, 3, 4, 5 in third listener
```

#### Parameters

##### eentName

`"status"`

##### status

[`PlayerStatus`](../interfaces/PlayerStatus.md)

#### Returns

`boolean`

#### Since

v0.1.26

#### Overrides

`EventEmitter.emit`

***

### getAlbumInfo()

> **getAlbumInfo**(`params?`): `Promise`\<[`AlbumInfo`](../interfaces/AlbumInfo.md) \| `null`\>

Defined in: src/core/RadioParadise.ts:269

Retrieves information about the album specified by `params.album_id`,
or the current track's album if omitted.

Returns `null` if no information is available.

#### Parameters

##### params?

[`GetAlbumInfoParams`](../interfaces/GetAlbumInfoParams.md)

Request parameters. See [GetAlbumInfoParams](../interfaces/GetAlbumInfoParams.md).

#### Returns

`Promise`\<[`AlbumInfo`](../interfaces/AlbumInfo.md) \| `null`\>

The [AlbumInfo](../interfaces/AlbumInfo.md), or `null`.

***

### getArtistInfo()

> **getArtistInfo**(`params?`): `Promise`\<[`ArtistInfo`](../interfaces/ArtistInfo.md) \| `null`\>

Defined in: src/core/RadioParadise.ts:239

Retrieves information about the artist specified by `params.artist_id`,
or the current track's artist if omitted.

Returns `null` if no information is available.

#### Parameters

##### params?

[`GetArtistInfoParams`](../interfaces/GetArtistInfoParams.md)

Request parameters. See [GetArtistInfoParams](../interfaces/GetArtistInfoParams.md).

#### Returns

`Promise`\<[`ArtistInfo`](../interfaces/ArtistInfo.md) \| `null`\>

The [ArtistInfo](../interfaces/ArtistInfo.md), or `null`.

***

### getChannels()

> **getChannels**(): `Promise`\<[`Channel`](../interfaces/Channel.md)[]\>

Defined in: src/core/RadioParadise.ts:117

Retrieves the list of available channels.

#### Returns

`Promise`\<[`Channel`](../interfaces/Channel.md)[]\>

A list of [Channel](../interfaces/Channel.md) objects.

***

### getNowPlayingList()

> **getNowPlayingList**(`params?`): `Promise`\<[`NowPlayingList`](../interfaces/NowPlayingList.md) \| `null`\>

Defined in: src/core/RadioParadise.ts:192

Retrieves the current track and playback history.

If `after` is omitted from `params`, returns the currently playing track and the playback history.
Otherwise, returns the history preceding the `after` list.

#### Parameters

##### params?

[`GetNowPlayingListParams`](../interfaces/GetNowPlayingListParams.md)

Request parameters. See [GetNowPlayingListParams](../interfaces/GetNowPlayingListParams.md).

#### Returns

`Promise`\<[`NowPlayingList`](../interfaces/NowPlayingList.md) \| `null`\>

The [NowPlayingList](../interfaces/NowPlayingList.md), or `null` if no list is available.

***

### getSessionData()

> **getSessionData**(): `string`

Defined in: src/core/RadioParadise.ts:294

Returns the current session data.

#### Returns

`string`

A serialized string representing the session state.

***

### getSongInfo()

> **getSongInfo**(`params?`): `Promise`\<[`SongInfo`](../interfaces/SongInfo.md) \| `null`\>

Defined in: src/core/RadioParadise.ts:205

Retrieves information about the song specified by `params.song_id`,
or the current track if omitted.

Returns `null` if no information is available.

#### Parameters

##### params?

[`GetSongInfoParams`](../interfaces/GetSongInfoParams.md)

Request parameters. See [GetSongInfoParams](../interfaces/GetSongInfoParams.md).

#### Returns

`Promise`\<[`SongInfo`](../interfaces/SongInfo.md) \| `null`\>

The [SongInfo](../interfaces/SongInfo.md), or `null`.

***

### getStatus()

> **getStatus**(): [`PlayerStatus`](../interfaces/PlayerStatus.md)

Defined in: src/core/RadioParadise.ts:179

Returns the current playback status.

#### Returns

[`PlayerStatus`](../interfaces/PlayerStatus.md)

The current [PlayerStatus](../interfaces/PlayerStatus.md).

***

### off()

> **off**(`eventName`, `listener`): `this`

Defined in: src/core/RadioParadise.ts:324

Alias for `emitter.removeListener()`.

#### Parameters

##### eventName

`"status"`

##### listener

(`status`) => `void`

#### Returns

`this`

#### Since

v10.0.0

#### Overrides

`EventEmitter.off`

***

### on()

> **on**(`eventName`, `listener`): `this`

Defined in: src/core/RadioParadise.ts:314

Adds the `listener` function to the end of the listeners array for the event
named `eventName`. No checks are made to see if the `listener` has already
been added. Multiple calls passing the same combination of `eventName` and
`listener` will result in the `listener` being added, and called, multiple times.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The `emitter.prependListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
import { EventEmitter } from 'node:events';
const myEE = new EventEmitter();
myEE.on('foo', () => console.log('a'));
myEE.prependListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

#### Parameters

##### eventName

`"status"`

The name of the event.

##### listener

(`status`) => `void`

The callback function

#### Returns

`this`

#### Since

v0.1.101

#### Overrides

`EventEmitter.on`

***

### once()

> **once**(`eventName`, `listener`): `this`

Defined in: src/core/RadioParadise.ts:319

Adds a **one-time** `listener` function for the event named `eventName`. The
next time `eventName` is triggered, this listener is removed and then invoked.

```js
server.once('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The `emitter.prependOnceListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
import { EventEmitter } from 'node:events';
const myEE = new EventEmitter();
myEE.once('foo', () => console.log('a'));
myEE.prependOnceListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

#### Parameters

##### eventName

`"status"`

The name of the event.

##### listener

(`status`) => `void`

The callback function

#### Returns

`this`

#### Since

v0.3.0

#### Overrides

`EventEmitter.once`

***

### pause()

> **pause**(): `Promise`\<`void`\>

Defined in: src/core/RadioParadise.ts:142

Pauses current playback.

#### Returns

`Promise`\<`void`\>

***

### play()

> **play**(`channel`): `Promise`\<`void`\>

Defined in: src/core/RadioParadise.ts:135

Plays the specified channel.

#### Parameters

##### channel

The ID of the channel or a [Channel](../interfaces/Channel.md) object.

`string` | [`Channel`](../interfaces/Channel.md)

#### Returns

`Promise`\<`void`\>

***

### resume()

> **resume**(): `Promise`\<`void`\>

Defined in: src/core/RadioParadise.ts:149

Resumes paused playback.

#### Returns

`Promise`\<`void`\>

***

### seek()

> **seek**(`positionInTrack`): `Promise`\<`void`\>

Defined in: src/core/RadioParadise.ts:157

Seeks to the specified position in the track.

#### Parameters

##### positionInTrack

`number`

The playback position to seek to, in milliseconds.

#### Returns

`Promise`\<`void`\>

***

### setQuality()

> **setQuality**(`quality`): `Promise`\<`void`\>

Defined in: src/core/RadioParadise.ts:105

Sets the audio quality.

#### Parameters

##### quality

[`AudioQuality`](../enumerations/AudioQuality.md)

A [AudioQuality](../enumerations/AudioQuality.md) value.

#### Returns

`Promise`\<`void`\>

***

### skip()

> **skip**(): `Promise`\<`void`\>

Defined in: src/core/RadioParadise.ts:164

Skips to the next track.

#### Returns

`Promise`\<`void`\>

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: src/core/RadioParadise.ts:171

Stops current playback.

#### Returns

`Promise`\<`void`\>
