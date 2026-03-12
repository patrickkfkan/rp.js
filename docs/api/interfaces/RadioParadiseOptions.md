[**@patrickkfkan/rp.js**](../README.md)

***

[@patrickkfkan/rp.js](../README.md) / RadioParadiseOptions

# Interface: RadioParadiseOptions

Defined in: [src/core/RadioParadise.ts:17](https://github.com/patrickkfkan/rp.js/blob/5533011b62f418584ef85a67f25f2a23cdd40271/src/core/RadioParadise.ts#L17)

## Properties

### logger?

> `optional` **logger**: [`Logger`](Logger.md)

Defined in: [src/core/RadioParadise.ts:28](https://github.com/patrickkfkan/rp.js/blob/5533011b62f418584ef85a67f25f2a23cdd40271/src/core/RadioParadise.ts#L28)

[Logger](Logger.md) implementation. If omitted, log messages will be discarded.

***

### player?

> `optional` **player**: [`Player`](../classes/Player.md)

Defined in: [src/core/RadioParadise.ts:24](https://github.com/patrickkfkan/rp.js/blob/5533011b62f418584ef85a67f25f2a23cdd40271/src/core/RadioParadise.ts#L24)

Player implementation. If omitted, calling playback-related methods will
throw an error.

See [Player](../classes/Player.md).

***

### quality?

> `optional` **quality**: [`AudioQuality`](../enumerations/AudioQuality.md)

Defined in: [src/core/RadioParadise.ts:32](https://github.com/patrickkfkan/rp.js/blob/5533011b62f418584ef85a67f25f2a23cdd40271/src/core/RadioParadise.ts#L32)

Audio quality.

***

### sessionData?

> `optional` **sessionData**: `string`

Defined in: [src/core/RadioParadise.ts:37](https://github.com/patrickkfkan/rp.js/blob/5533011b62f418584ef85a67f25f2a23cdd40271/src/core/RadioParadise.ts#L37)

Data for restoring a previous session.
You can obtain session data with [RadioParadise.getSessionData](../classes/RadioParadise.md#getsessiondata).
