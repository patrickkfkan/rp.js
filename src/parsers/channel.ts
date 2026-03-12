import _ from 'lodash';
import { z } from 'zod';
import { type Channel } from '../types';

const ListChannelsResponseSchema = z.array(
  z.object({
    chan: z.string(),
    title: z.string(),
    stream_name: z.string(),
    slug: z.string(),
    type: z.string(), // 'block' | 'playlist'
    banner_url: z.url().nullish().catch(null),
    banner_mini_url: z.url().nullish().catch(null),
    carousel_url: z.url().nullish().catch(null),
    image: z.url().nullish().catch(null),
    modes: z.object({
      type: z.string()
    })
  })
);

export function parseListChannelsResponse(data: any) {
  return ListChannelsResponseSchema.transform<Channel[]>((arr) =>
    arr.map((data) => ({
      id: data.chan,
      ..._.pick(data, ['title', 'stream_name', 'slug', 'type']),
      images: {
        default: data.image ?? null,
        banner: data.banner_url ?? null,
        banner_mini: data.banner_mini_url ?? null,
        carousel: data.carousel_url ?? null
      },
      is_episodic_radio: data.modes.type === 'episodic_radio'
    }))
  ).parse(data);
}
