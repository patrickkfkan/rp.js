[**@patrickkfkan/rp.js**](../README.md)

***

[@patrickkfkan/rp.js](../README.md) / BlockTrack

# Type Alias: BlockTrack

> **BlockTrack** = [`Track`](../interfaces/Track.md) & `object`

Defined in: [src/types/media.ts:36](https://github.com/patrickkfkan/rp.js/blob/5533011b62f418584ef85a67f25f2a23cdd40271/src/types/media.ts#L36)

## Type Declaration

### bitrate

> **bitrate**: `string` \| `null`

### elapsed?

> `optional` **elapsed**: `number`

Position of track within the block's stream, in milliseconds.

### episodeId

> **episodeId**: `string`

### eventNum?

> `optional` **eventNum**: `number`

### format

> **format**: `string` \| `null`

### schedTimeMillis

> **schedTimeMillis**: `number`

Scheduled playback date/time in milliseconds.

### sliceNum

> **sliceNum**: `string`

### type

> **type**: `string`

Track type.

Known types and inferred meaning:
- 'M': Music
- 'T': Talk
- 'P': Promotion

### updateHistory

> **updateHistory**: `boolean`
