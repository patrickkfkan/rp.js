export function millisToMinutesAndSeconds(
  millis: number,
  notation: 'colon' | 'alphanumeric' = 'colon'
) {
  const sign = millis < 0 ? '-' : '';
  millis = Math.abs(millis);
  let minutes = Math.floor(millis / 60000);
  let seconds = Math.floor((millis % 60000) / 1000);
  if (seconds === 60) {
    minutes += 1;
    seconds = 0;
  }
  if (notation === 'alphanumeric') {
    const s: string[] = [];
    if (minutes > 0) {
      s.push(`${minutes}m`);
    }
    if (seconds > 0 || minutes === 0) {
      s.push(`${seconds}s`);
    }
    return sign + s.join(' ');
  }
  const formattedSeconds =
    seconds < 10 ? '0' + String(seconds) : String(seconds);
  return `${sign}${minutes}:${formattedSeconds}`;
}

export function millisToLocaleDateTimeString(millis: number) {
  return new Date(millis).toLocaleString();
}

export function maskPlayerIdFromUrl(url: string) {
  const urlObj = new URL(url);
  if (urlObj.searchParams.has('player_id')) {
    urlObj.searchParams.set('player_id', '********');
  }
  return urlObj.toString();
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
