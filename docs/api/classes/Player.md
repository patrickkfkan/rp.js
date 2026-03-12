[**@patrickkfkan/rp.js**](../README.md)

***

[@patrickkfkan/rp.js](../README.md) / Player

# Abstract Class: Player

Defined in: [src/core/Player.ts:34](https://github.com/patrickkfkan/rp.js/blob/5533011b62f418584ef85a67f25f2a23cdd40271/src/core/Player.ts#L34)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new Player**(`options?`): `Player`

Defined in: node\_modules/@types/node/events.d.ts:101

#### Parameters

##### options?

`EventEmitterOptions`

#### Returns

`Player`

#### Inherited from

`EventEmitter.constructor`

## Properties

### getPosition()?

> `optional` **getPosition**: () => `number`

Defined in: [src/core/Player.ts:38](https://github.com/patrickkfkan/rp.js/blob/5533011b62f418584ef85a67f25f2a23cdd40271/src/core/Player.ts#L38)

Returns the current seek position in milliseconds.

#### Returns

`number`

## Methods

### notifyPaused()

> **notifyPaused**(`position`): `void`

Defined in: [src/core/Player.ts:79](https://github.com/patrickkfkan/rp.js/blob/5533011b62f418584ef85a67f25f2a23cdd40271/src/core/Player.ts#L79)

Signals that playback has paused.

#### Parameters

##### position

`number`

The position at which playback paused (milliseconds).

#### Returns

`void`

***

### notifyPlaying()

> **notifyPlaying**(`position`): `void`

Defined in: [src/core/Player.ts:71](https://github.com/patrickkfkan/rp.js/blob/5533011b62f418584ef85a67f25f2a23cdd40271/src/core/Player.ts#L71)

Signals that playback has started.

#### Parameters

##### position

`number`

The position at which playback started (milliseconds).

#### Returns

`void`

***

### notifySeeked()

> **notifySeeked**(`position`): `void`

Defined in: [src/core/Player.ts:94](https://github.com/patrickkfkan/rp.js/blob/5533011b62f418584ef85a67f25f2a23cdd40271/src/core/Player.ts#L94)

Signals that player has finished seeking.

#### Parameters

##### position

`number`

The position after seeking (milliseconds).

#### Returns

`void`

***

### notifyStopped()

> **notifyStopped**(): `void`

Defined in: [src/core/Player.ts:86](https://github.com/patrickkfkan/rp.js/blob/5533011b62f418584ef85a67f25f2a23cdd40271/src/core/Player.ts#L86)

Signals that player has stopped.

#### Returns

`void`

***

### pause()

> `abstract` **pause**(): `Promise`\<`void`\>

Defined in: [src/core/Player.ts:50](https://github.com/patrickkfkan/rp.js/blob/5533011b62f418584ef85a67f25f2a23cdd40271/src/core/Player.ts#L50)

Pauses playback. Implementations must call [notifyPaused](#notifypaused) after playback has paused.

#### Returns

`Promise`\<`void`\>

***

### play()

> `abstract` **play**(`url`, `position`): `Promise`\<`void`\>

Defined in: [src/core/Player.ts:45](https://github.com/patrickkfkan/rp.js/blob/5533011b62f418584ef85a67f25f2a23cdd40271/src/core/Player.ts#L45)

Plays the stream at `url` starting from `position`. Implementations must call [notifyPlaying](#notifyplaying) after playback has started.

#### Parameters

##### url

`string`

The URL of the stream to play.

##### position

`number`

Position from which to start playback (milliseconds).

#### Returns

`Promise`\<`void`\>

***

### resume()

> `abstract` **resume**(): `Promise`\<`void`\>

Defined in: [src/core/Player.ts:55](https://github.com/patrickkfkan/rp.js/blob/5533011b62f418584ef85a67f25f2a23cdd40271/src/core/Player.ts#L55)

Resumes paused playback. Implementations must call [notifyPlaying](#notifyplaying) after playback has resumed.

#### Returns

`Promise`\<`void`\>

***

### seek()

> `abstract` **seek**(`position`): `Promise`\<`void`\>

Defined in: [src/core/Player.ts:60](https://github.com/patrickkfkan/rp.js/blob/5533011b62f418584ef85a67f25f2a23cdd40271/src/core/Player.ts#L60)

Seeks to `position`. Implementations must call [notifySeeked](#notifyseeked) after seeking.

#### Parameters

##### position

`number`

Position to seek to (milliseconds).

#### Returns

`Promise`\<`void`\>

***

### stop()

> `abstract` **stop**(): `Promise`\<`void`\>

Defined in: [src/core/Player.ts:65](https://github.com/patrickkfkan/rp.js/blob/5533011b62f418584ef85a67f25f2a23cdd40271/src/core/Player.ts#L65)

Stops the player. Implementations must call [notifyStopped](#notifystopped) after player has stopped.

#### Returns

`Promise`\<`void`\>
