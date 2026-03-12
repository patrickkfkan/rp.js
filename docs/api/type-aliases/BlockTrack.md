[**@patrickkfkan/rp.js**](../README.md)

***

[@patrickkfkan/rp.js](../README.md) / BlockTrack

# Type Alias: BlockTrack

> **BlockTrack** = [`Track`](../interfaces/Track.md) & `object`

Defined in: [src/types/media.ts:36](https://github.com/patrickkfkan/rp.js/blob/3f521bec0a67a6bb5c8e0fb949916d7b56874b7b/src/types/media.ts#L36)

## Type Declaration

### bitrate

> **bitrate**: `string` \| `null`

### elapsed?

> `optional` **elapsed**: `number`

Position of track within the block's stream, in milliseconds.

### episode\_id

> **episode\_id**: `string`

### event\_num?

> `optional` **event\_num**: `number`

### format

> **format**: `string` \| `null`

### sched\_time\_millis

> **sched\_time\_millis**: `number`

Scheduled playback date/time in milliseconds.

### slice\_num

> **slice\_num**: `string`

### type

> **type**: `string`

Track type.

Known types and inferred meaning:
- 'M': Music
- 'T': Talk
- 'P': Promotion

### updateHistory

> **updateHistory**: `boolean`
