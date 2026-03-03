import _ from 'lodash';
import path from 'path';
import { z } from 'zod';
import { type Block, type NowPlayingList } from '../types';

function createNowPlayingResponseSchema(block: Block) {
  return z
    .object({
      song: z.array(
        createSongInNowPlayingResponseSchema(block.slide_base, block.image_base)
      )
    })
    .transform<NowPlayingList>((data) => ({
      tracks: data.song
    }));
}

function createSongInNowPlayingResponseSchema(
  slideBase: string,
  imageBase: string
) {
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
      song_id: z.string().nullable(),
      title: z.string().nullable(),
      artist: z.string().nullable(),
      album: z.string().nullish(),
      year: z.string().nullish(),
      duration: z.coerce.number().nullable(),
      slideshow: z
        .string()
        .transform((val) =>
          val.split(',').map((id) => slideUrlSchema.parse(id))
        )
        .nullable(),
      listener_rating: z.coerce.string().nullish(),
      cover: coverUrlSchema,
      cover_med: coverUrlSchema.optional(),
      cover_small: coverUrlSchema,
      event: z.string(),
      episode_id: z.coerce.string(),
      play_time: z.number().optional()
    })
    .transform((data) => ({
      id: data.song_id,
      ..._.pick(data, ['title', 'artist', 'duration', 'slideshow']),
      rating: data.listener_rating ?? null,
      album: data.album ?? null,
      year: data.year ?? null,
      cover: {
        large: data.cover,
        medium: data.cover_med ?? data.cover,
        small: data.cover_small
      },
      ..._.pick(data, ['event', 'episode_id', 'play_time'])
    }));
}

export function parseNowPlayingListResponse(data: any, block: Block) {
  const list = createNowPlayingResponseSchema(block).parse(data);
  /**
   * Some channels - currently Serenity and 2050 - do not have a "now playing list".
   * However, they still return a list with a single track with null id,
   * title and duration (but oddly, an album name "The Universe Smiles Upon You ii").
   * We check for this case and return null to indicate the absence of a list.
   */
  if (list.tracks.length === 1) {
    const { id, title, duration } = list.tracks[0];
    if (!id && !title && !duration) {
      return null;
    }
  }
  return list;
}
