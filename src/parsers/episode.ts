import { z } from 'zod';
import type { Episode, EpisodeList } from '../types';

const IMAGE_BASE_URL = 'https://vsh-smedia.radioparadise.com';

function applyImageBaseUrl(pathname?: string | null) {
  if (!pathname) {
    return null;
  }
  return new URL(pathname, IMAGE_BASE_URL).toString();
}

const EpisodeSchema = z
  .object({
    episode_id: z.coerce.string(),
    title: z.string(),
    slug: z.string(),
    date: z.string(),
    credits: z
      .object({
        credits: z.array(
          z.object({
            name: z.string(),
            role: z.string().nullish()
          })
        )
      })
      .nullish(),
    guest_bio: z.string().nullish(),
    overview: z.string().nullish(),
    season: z.number(),
    bio_image: z
      .object({
        data: z
          .object({
            attributes: z.object({
              formats: z
                .object({
                  large: z.object({ url: z.string() }).nullish(),
                  small: z.object({ url: z.string() }).nullish(),
                  medium: z.object({ url: z.string() }).nullish(),
                  thumbnail: z.object({ url: z.string() }).nullish()
                })
                .nullish()
            })
          })
          .nullish()
      })
      .nullish(),
    guests: z
      .array(
        z.object({
          name: z.string().nullish(),
          occupation: z.string().nullish()
        })
      )
      .nullish(),
    links: z
      .array(
        z.object({
          link_text: z.string(),
          link_url: z.url().nullish().catch(null)
        })
      )
      .nullish(),
    episode_image: z
      .object({
        image: z
          .object({
            data: z
              .object({
                attributes: z.object({
                  formats: z.object({
                    large: z.object({ url: z.string() }).nullish(),
                    small: z.object({ url: z.string() }).nullish(),
                    medium: z.object({ url: z.string() }).nullish(),
                    thumbnail: z.object({ url: z.string() }).nullish()
                  })
                })
              })
              .nullish()
          })
          .nullish()
      })
      .nullish()
  })
  .transform<Episode>((data) => ({
    id: data.episode_id,
    title: data.title,
    slug: data.slug,
    date: data.date,
    credits:
      data.credits?.credits.map((credit) => ({
        name: credit.name,
        role: credit.role ?? null
      })) || [],
    guestBio: data.guest_bio ?? null,
    overview: data.overview ?? null,
    season: data.season,
    bioImage: {
      large: applyImageBaseUrl(
        data.bio_image?.data?.attributes.formats?.large?.url
      ),
      small: applyImageBaseUrl(
        data.bio_image?.data?.attributes.formats?.small?.url
      ),
      medium: applyImageBaseUrl(
        data.bio_image?.data?.attributes.formats?.medium?.url
      ),
      thumbnail: applyImageBaseUrl(
        data.bio_image?.data?.attributes.formats?.thumbnail?.url
      )
    },
    episodeImage: {
      large: applyImageBaseUrl(
        data.episode_image?.image?.data?.attributes.formats.large?.url
      ),
      small: applyImageBaseUrl(
        data.episode_image?.image?.data?.attributes.formats.small?.url
      ),
      medium: applyImageBaseUrl(
        data.episode_image?.image?.data?.attributes.formats.medium?.url
      ),
      thumbnail: applyImageBaseUrl(
        data.episode_image?.image?.data?.attributes.formats.thumbnail?.url
      )
    },
    guests:
      data.guests?.reduce<Episode['guests']>((acc, guest) => {
        if (guest.name) {
          acc.push({
            name: guest.name,
            occupation: guest.occupation ?? null
          });
        }
        return acc;
      }, []) || [],
    links:
      data.links?.reduce<Episode['links']>((acc, link) => {
        if (link.link_url) {
          acc.push({
            label: link.link_text,
            url: link.link_url
          });
        }
        return acc;
      }, []) || []
  }));

export function parseEpisodeListResponse(data: any): EpisodeList {
  return z
    .object({
      data: z
        .array(
          z.object({
            attributes: EpisodeSchema
          })
        )
        .nullish(),
      meta: z.object({
        pagination: z.object({
          start: z.number(),
          limit: z.number(),
          total: z.number()
        })
      })
    })
    .transform<EpisodeList>((data) => ({
      episodes: data.data?.map((d) => d.attributes) ?? [],
      start: data.meta.pagination.start,
      limit: data.meta.pagination.limit,
      total: data.meta.pagination.total
    }))
    .parse(data);
}
