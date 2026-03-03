[**rp.js**](../README.md)

***

[rp.js](../README.md) / RadioParadiseOptions

# Interface: RadioParadiseOptions

Defined in: src/core/RadioParadise.ts:17

## Properties

### logger?

> `optional` **logger**: [`Logger`](Logger.md)

Defined in: src/core/RadioParadise.ts:28

[Logger](Logger.md) implementation. If omitted, log messages will be discarded.

***

### player?

> `optional` **player**: [`Player`](../classes/Player.md)

Defined in: src/core/RadioParadise.ts:24

Player implementation. If omitted, calling playback-related methods will
throw an error.

See [Player](../classes/Player.md).

***

### quality?

> `optional` **quality**: [`AudioQuality`](../enumerations/AudioQuality.md)

Defined in: src/core/RadioParadise.ts:32

Audio quality.

***

### sessionData?

> `optional` **sessionData**: `string`

Defined in: src/core/RadioParadise.ts:37

Data for restoring a previous session.
You can obtain session data with [RadioParadise.getSessionData](../classes/RadioParadise.md#getsessiondata).
