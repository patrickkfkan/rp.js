import { z } from 'zod';
import { type AlbumInfo, type ArtistInfo, type SongInfo } from '../types';

const SITE_URL = 'https://radioparadise.com';

const SongInfoResponseSchema = z
  .object({
    wiki_html: z.string().nullish(),
    artist_image: z.url(),
    song_id: z.coerce.string(),
    cover: z.url().nullish(),
    title: z.string().nullish(),
    artist_id: z.string().nullish(),
    artist: z.string().nullish(),
    rp_artist_link: z.string().nullish(),
    album_id: z.string().nullish(),
    album: z.string().nullish(),
    album_release_year: z.string().nullish(),
    rp_album_link: z.string().nullish(),
    release_date: z.string().nullish(),
    avg_rating: z.coerce.string().nullish(),
    length: z.string().nullish(),
    lyrics: z.string().nullish(),
    mm_lyrics: z
      .array(
        z.object({
          text: z.string(),
          time: z.object({
            total: z.number() // seconds
          })
        })
      )
      .nullish(),
    rp_song_link: z.string().nullish()
  })
  .transform<SongInfo>((data) => ({
    wiki_html: data.wiki_html ?? null,
    song_id: data.song_id,
    cover: data.cover ?? null,
    title: data.title ?? null,
    artist:
      data.artist ?
        {
          id: data.artist_id ?? null,
          name: data.artist,
          image: data.artist_image ?? null,
          url:
            data.rp_artist_link ?
              new URL(data.rp_artist_link, SITE_URL).toString()
            : null
        }
      : null,
    album:
      data.album ?
        {
          id: data.album_id ?? null,
          name: data.album,
          release_year: data.album_release_year ?? null,
          url:
            data.rp_album_link ?
              new URL(data.rp_album_link, SITE_URL).toString()
            : null
        }
      : null,
    release_date: data.release_date ?? null,
    rating: data.avg_rating ?? null,
    length: data.length ?? null,
    lyrics: data.lyrics ?? null,
    timed_lyrics:
      data.mm_lyrics ?
        data.mm_lyrics.map((line) => ({
          text: line.text,
          time: line.time.total * 1000 // convert to milliseconds
        }))
      : null,
    url:
      data.rp_song_link ? new URL(data.rp_song_link, SITE_URL).toString() : null
  }));

export function parseSongInfoResponse(data: any) {
  return SongInfoResponseSchema.parse(data);
}

const ArtistInfoResponseSchema = z
  .object({
    artist: z.object({
      artist_id: z.string(),
      name: z.string().nullish(),
      bio: z.string().nullish(),
      artist_image: z.url().nullish(),
      artist_images: z.array(z.url()).nullish()
    })
  })
  .transform(({ artist: data }) => ({
    artist_id: data.artist_id,
    name: data.name ?? null,
    bio: data.bio ?? null,
    /**
     * Even if there's no artist_image, RP still sets a placeholder image URL which,
     * as of this moment, is a broken link. To determine whether there is actually an image
     * for this artist, check the artist_images array, which wil be empty if there's no image.
     */
    images:
      data.artist_image && data.artist_images && data.artist_images.length > 0 ?
        {
          default: data.artist_image,
          all: data.artist_images
        }
      : null
  }));

export function parseArtistInfoResponse(data: any): ArtistInfo {
  return ArtistInfoResponseSchema.parse(data);
}

const SongInAlbumInfoResponseSchema = z
  .object({
    song_id: z.string().nullish(),
    title: z.string().nullish(),
    artist_id: z.string().nullish(),
    album_id: z.string().nullish(),
    listener_rating: z.coerce.string().nullish(),
    duration: z.coerce.number().nullish(),
    release_date: z.string().nullish(),
    year: z.string().nullish(),
    artist_name: z.string().nullish(),
    album_title: z.string().nullish()
  })
  .transform((data) => ({
    id: data.song_id ?? null,
    title: data.title ?? null,
    artist:
      data.artist_name ?
        {
          id: data.artist_id ?? null,
          name: data.artist_name
        }
      : null,
    album:
      data.album_title ?
        {
          id: data.album_id ?? null,
          name: data.album_title
        }
      : null,
    duration: data.duration ?? null,
    release_date: data.release_date ?? null,
    year: data.year ?? null
  }));

const AlbumInfoResponseSchema = z
  .object({
    album: z.object({
      album_id: z.string(),
      title: z.string().nullish(),
      artist_id: z.string().nullish(),
      release_date: z.string().nullish(),
      year: z.string().nullish(),
      label: z.string().nullish(),
      cover: z.url().nullish()
    }),
    songs: z.array(SongInAlbumInfoResponseSchema)
  })
  .transform(({ album: data, songs }) => ({
    album_id: data.album_id,
    name: data.title ?? null,
    artist_id: data.artist_id ?? null,
    release_date: data.release_date ?? null,
    year: data.year ?? null,
    label: data.label ?? null,
    cover: data.cover ?? null,
    songs
  }));

export function parseAlbumInfoResponse(data: any): AlbumInfo {
  return AlbumInfoResponseSchema.parse(data);
}
