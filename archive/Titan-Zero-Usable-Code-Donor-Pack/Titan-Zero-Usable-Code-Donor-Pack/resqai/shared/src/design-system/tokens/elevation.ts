export interface ElevationTokens {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  [key: string]: string;
}

export const lightElevation: ElevationTokens = {
  0: 'none',
  1: '0px 1px 2px rgba(0, 0, 0, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.1)',
  2: '0px 2px 4px rgba(0, 0, 0, 0.06), 0px 4px 6px rgba(0, 0, 0, 0.1)',
  3: '0px 4px 8px rgba(0, 0, 0, 0.06), 0px 8px 16px rgba(0, 0, 0, 0.1)',
  4: '0px 8px 16px rgba(0, 0, 0, 0.06), 0px 16px 24px rgba(0, 0, 0, 0.1)',
  5: '0px 16px 24px rgba(0, 0, 0, 0.06), 0px 24px 48px rgba(0, 0, 0, 0.1)',
};

export const darkElevation: ElevationTokens = {
  0: 'none',
  1: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px rgba(0, 0, 0, 0.4)',
  2: '0px 2px 4px rgba(0, 0, 0, 0.3), 0px 4px 6px rgba(0, 0, 0, 0.4)',
  3: '0px 4px 8px rgba(0, 0, 0, 0.3), 0px 8px 16px rgba(0, 0, 0, 0.4)',
  4: '0px 8px 16px rgba(0, 0, 0, 0.3), 0px 16px 24px rgba(0, 0, 0, 0.4)',
  5: '0px 16px 24px rgba(0, 0, 0, 0.3), 0px 24px 48px rgba(0, 0, 0, 0.4)',
};
