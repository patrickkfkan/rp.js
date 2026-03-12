export interface Episode {
  id: string;
  title: string;
  slug: string;
  date: string;
  credits: {
    name: string;
    role: string | null;
  }[];
  guest_bio: string | null;
  overview: string | null;
  season: number;
  bio_image: {
    large: string | null;
    small: string | null;
    medium: string | null;
    thumbnail: string | null;
  };
  episode_image: {
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
