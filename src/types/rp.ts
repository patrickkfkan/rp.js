import { type Track } from './media';

export interface NowPlayingList {
  tracks: (Track & {
    playTime?: number;
  })[];
}

export interface SongInfo {
  wikiHtml: string | null;
  songId: string;
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
    releaseYear: string | null;
    url: string | null;
  } | null;
  releaseDate: string | null;
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
  timedLyrics:
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
  artistId: string;
  name: string | null;
  bio: string | null;
  images: {
    default: string;
    all: string[];
  } | null;
}

export interface AlbumInfo {
  albumId: string;
  name: string | null;
  artistId: string | null;
  releaseDate: string | null;
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
    releaseDate: string | null;
    year: string | null;
  }[];
}
