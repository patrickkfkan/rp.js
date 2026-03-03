[**rp.js**](../README.md)

***

[rp.js](../README.md) / BlockTrack

# Type Alias: BlockTrack

> **BlockTrack** = [`Track`](../interfaces/Track.md) & `object`

Defined in: src/types/media.ts:35

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
