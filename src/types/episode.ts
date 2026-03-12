export interface Episode {
  id: string;
  title: string;
  slug: string;
  date: string;
  credits: {
    name: string;
    role: string | null;
  }[];
  guestBio: string | null;
  overview: string | null;
  season: number;
  bioImage: {
    large: string | null;
    small: string | null;
    medium: string | null;
    thumbnail: string | null;
  };
  episodeImage: {
    large: string | null;
    small: string | null;
    medium: string | null;
    thumbnail: string | null;
  };
  guests: {
    name: string;
    occupation: string | null;
  }[];
  links: {
    url: string;
    label: string;
  }[];
}

export interface EpisodeList {
  episodes: Episode[];
  start: number;
  limit: number;
  total: number;
}
