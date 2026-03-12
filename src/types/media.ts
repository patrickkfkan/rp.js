export interface Channel {
  id: string;
  title: string;
  streamName: string;
  slug: string;
  type: string;
  isEpisodicRadio: boolean;
  images: {
    default: string | null;
    banner: string | null;
    bannerMini: string | null;
    carousel: string | null;
  };
}

export interface Track {
  id: string | null;
  title: string | null;
  artist: string | null;
  album: string | null;
  year: string | null;
  /**
   * Duration in milliseconds.
   */
  duration: number | null;
  slideshow: string[] | null;
  rating: string | null;
  cover: {
    large: string;
    medium: string;
    small: string;
  };
  event: string;
}

export type BlockTrack = Track & {
  /**
   * Track type.
   *
   * Known types and inferred meaning:
   * - 'M': Music
   * - 'T': Talk
   * - 'P': Promotion
   */
  type: string;
  sliceNum: string;
  /**
   * Scheduled playback date/time in milliseconds.
   */
  schedTimeMillis: number;
  /**
   * Position of track within the block's stream, in milliseconds.
   */
  elapsed?: number;
  episodeId: string;
  eventNum?: number;
  updateHistory: boolean;
  format: string | null;
  bitrate: string | null;
};

export interface Block {
  event: string;
  sliceNum: string;
  /**
   * Block type.
   *
   * Known types and inferred meaning:
   * - 'M': Music
   * - 'T': Talk
   */
  type: string;
  /**
   * Data/time of expiry in milliseconds
   */
  expiration: number;
  /**
   * Duration of the block in milliseconds
   */
  duration: number;
  url: string;
  channel: {
    id: string;
    title: string;
    streamName: string;
    isEpisodicRadio: boolean;
  };
  ext: string;
  slideBase: string;
  imageBase: string;
  tracks: BlockTrack[];
}
