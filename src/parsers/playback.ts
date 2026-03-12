import _ from 'lodash';
import path from 'path';
import { z } from 'zod';
import { type Block, type BlockTrack } from '../types';

const imageBaseSchema = z
  .string()
  .transform((val) => {
    if (val.startsWith('//')) {
      return `https:${val}`;
    }
    return val;
  })
  .pipe(z.url());

function createPlayResponseSchema(data: any) {
  const { slide_base: slideBase, image_base: imageBase } = z
    .object({
      slide_base: imageBaseSchema,
      image_base: imageBaseSchema
    })
    .parse(data);
  const songSchema = createSongInPlayResponseSchema(slideBase, imageBase);
  return z
    .object({
      event: z.coerce.string(),
      slice_num: z.coerce.string(),
      type: z.string(),
      expiration: z.coerce.number(), // This is date/time given in seconds
      length: z.coerce.number(), // This is given in seconds
      url: z.url(),
      channel: z.object({
        chan: z.string(),
        title: z.string(),
        stream_name: z.string(),
        isER: z.boolean()
      }),
      bitrate: z.coerce.string(),
      ext: z.string(),
      song: z.union([z.array(songSchema), z.record(z.string(), songSchema)])
    })
    .transform<Block>((data) => {
      const channel = {
        id: data.channel.chan,
        title: data.channel.title,
        stream_name: data.channel.stream_name,
        isER: data.channel.isER
      };
      const { format, bitrate } = parseBitrateInPlayResponse(
        data.bitrate,
        channel
      );
      const songData = data.song;
      return {
        event: data.event,
        slice_num: data.slice_num,
        type: data.type,
        expiration: data.expiration * 1000,
        duration: data.length * 1000,
        url: data.url,
        channel,
        ext: data.ext,
        slide_base: slideBase,
        image_base: imageBase,
        tracks:
          Array.isArray(songData) ?
            songData.map<BlockTrack>((song) => ({
              ...song,
              format,
              bitrate
            }))
          : Object.keys(songData)
              .sort((a, b) => Number(a) - Number(b))
              .map((key) => ({
                ...songData[key],
                format,
                bitrate
              }))
      };
    });
}

function parseBitrateInPlayResponse(value: string, channel: Block['channel']) {
  // Try match "{bitrate}k {aac|flac}"
  // E.g. "32k aac"
  const bfMatch = /(\d+)k ((?:aac)|(?:flac))$/.exec(value);
  if (bfMatch && bfMatch[1] && bfMatch[2]) {
    return {
      format: bfMatch[2],
      bitrate: `${bfMatch[1]} kbps`
    };
  }
  if (value === 'flac') {
    return {
      format: 'flac',
      bitrate: null
    };
  }
  // Blocks for certain channels have only a number for bitrate
  // -- Serenity - always bitrate '2' that is 64k aac (ffprobe)
  if (channel.stream_name === 'serenity' && value === '2') {
    return {
      format: 'aac',
      bitrate: '64 kbps'
    };
  }
  // -- Radio 2050
  if (channel.stream_name === 'r2050')
    switch (value) {
      case '0': // Low - 32k aac
        return {
          format: 'aac',
          bitrate: '32 kbps'
        };
      case '1': // Med - 64k aac
        return {
          format: 'aac',
          bitrate: '64 kbps'
        };
      case '2': // High - 128k aac
        return {
          format: 'aac',
          bitrate: '128 kbps'
        };
      case '3': // Ultra - 320k aac
        return {
          format: 'aac',
          bitrate: '320 kbps'
        };
      case '4': // FLAC
        return {
          format: 'flac',
          bitrate: null
        };
    }

  return {
    format: null,
    bitrate: null
  };
}

function createSongInPlayResponseSchema(slideBase: string, imageBase: string) {
  const slideUrlSchema = z
    .string()
    .transform((val) => {
      if (!path.extname(val)) {
        val = `${val}.jpg`;
      }
      return new URL(val, slideBase).toString();
    })
    .pipe(z.url());
  const coverUrlSchema = z
    .string()
    .transform((val) => new URL(val, imageBase).toString())
    .pipe(z.url());
  return z
    .object({
      song_id: z.coerce.string().nullable(),
      title: z.string().nullable(),
      artist: z.string().nullable(),
      album: z.string().nullish(),
      year: z.string().nullish(),
      duration: z.number().nullable(),
      slideshow: z
        .string()
        .transform((val) =>
          val.split(',').map((id) => slideUrlSchema.parse(id))
        )
        .nullable(),
      rating: z.coerce.string().nullish(),
      cover: coverUrlSchema,
      cover_large: coverUrlSchema,
      cover_medium: coverUrlSchema,
      cover_small: coverUrlSchema,
      type: z.string(),
      event: z.coerce.string(),
      slice_num: z.coerce.string(),
      episode_id: z.coerce.string(),
      sched_time_millis: z.number(),
      elapsed: z.number().optional(),
      event_num: z.number().optional(),
      updateHistory: z.boolean()
    })
    .transform((data) => ({
      id: data.song_id,
      ..._.pick(data, ['title', 'artist', 'duration', 'slideshow']),
      rating: data.rating ?? null,
      album: data.album ?? null,
      year: data.year ?? null,
      cover: {
        large: data.cover_large || data.cover,
        medium: data.cover_medium,
        small: data.cover_small
      },
      ..._.pick(data, [
        'type',
        'event',
        'slice_num',
        'episode_id',
        'sched_time_millis',
        'elapsed',
        'event_num',
        'updateHistory'
      ])
    }));
}

export function parsePlayResponse(data: any) {
  const block = createPlayResponseSchema(data).parse(data);
  /**
   * Channels like Serenity have block tracks that have null id, title and duration
   * (but oddly, an album name "The Universe Smiles Upon You ii"). We nullify
   * the album in this case to avoid confusion.
   */
  for (const track of Object.values(block.tracks)) {
    const { id, title, duration } = track;
    if (!id && !title && !duration) {
      track.album = null;
    }
  }
  return block;
}
