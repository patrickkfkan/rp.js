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
    banner_url: z.url(),
    banner_mini_url: z.url(),
    carousel_url: z.url(),
    image: z.url()
  })
);

export function parseListChannelsResponse(data: any) {
  return ListChannelsResponseSchema.transform<Channel[]>((arr) =>
    arr.map((data) => ({
      id: data.chan,
      ..._.pick(data, ['title', 'stream_name', 'slug', 'type']),
      images: {
        default: data.image,
        banner: data.banner_url,
        banner_mini: data.banner_mini_url,
        carousel: data.carousel_url
      }
    }))
  ).parse(data);
}
