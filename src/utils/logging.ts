export interface Logger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  debug: (msg: string) => void;
  error: (msg: string) => void;
}

export const NULL_LOGGER: Logger = {
  info: () => {
    return;
  },
  warn: () => {
    return;
  },
  debug: () => {
    return;
  },
  error: () => {
    return;
  }
};
