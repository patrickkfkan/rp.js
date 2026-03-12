export interface Channel {
  id: string;
  title: string;
  stream_name: string;
  slug: string;
  type: string;
  is_episodic_radio: boolean;
  images: {
    default: string;
    banner: string;
    banner_mini: string;
    carousel: string;
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
  slice_num: string;
  /**
   * Scheduled playback date/time in milliseconds.
   */
  sched_time_millis: number;
  /**
   * Position of track within the block's stream, in milliseconds.
   */
  elapsed?: number;
  episode_id: string;
  event_num?: number;
  updateHistory: boolean;
  format: string | null;
  bitrate: string | null;
};

export interface Block {
  event: string;
  slice_num: string;
  type: string;
  url: string;
  channel: {
    id: string;
    title: string;
    stream_name: string;
    /**
     * Is episode radio (e.g. Radio 2050)?
     */
    isER: boolean;
  };
  ext: string;
  slide_base: string;
  image_base: string;
  tracks: BlockTrack[];
}
