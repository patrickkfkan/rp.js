import { type Track } from './media';

export interface NowPlayingList {
  tracks: (Track & {
    play_time?: number;
  })[];
}

export interface SongInfo {
  wiki_html: string | null;
  song_id: string;
  cover: string | null;
  title: string | null;
  artist: {
    id: string | null;
    name: string;
    image: string | null;
    url: string | null;
  } | null;
  album: {
    id: string | null;
    name: string;
    release_year: string | null;
    url: string | null;
  } | null;
  release_date: string | null;
  rating: string | null;
  length: string | null;
  /**
   * Lyrics (may contain HTML tags)
   */
  lyrics: string | null;
  /**
   * Timed lyrics. If available, each entry represents a
   * line of lyrics synchronized to a specific playback time.
   */
  timed_lyrics:
    | {
        /** Text of the lyric line. */
        text: string;
        /** Playback time in milliseconds. */
        time: number;
      }[]
    | null;
  url: string | null;
}

export interface ArtistInfo {
  artist_id: string;
  name: string | null;
  bio: string | null;
  images: {
    default: string;
    all: string[];
  } | null;
}

export interface AlbumInfo {
  album_id: string;
  name: string | null;
  artist_id: string | null;
  release_date: string | null;
  year: string | null;
  label: string | null;
  cover: string | null;
  songs: {
    id: string | null;
    title: string | null;
    artist: {
      id: string | null;
      name: string;
    } | null;
    album: {
      id: string | null;
      name: string;
    } | null;
    /**
     * Duration in milliseconds.
     */
    duration: number | null;
    release_date: string | null;
    year: string | null;
  }[];
}
