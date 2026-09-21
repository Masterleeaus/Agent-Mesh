export interface BorderTokens {
  width: BorderWidthTokens;
  style: BorderStyleTokens;
}

export interface BorderWidthTokens {
  none: string;
  thin: string;
  medium: string;
  thick: string;
}

export interface BorderStyleTokens {
  solid: string;
  dashed: string;
  dotted: string;
}

export const borders: BorderTokens = {
  width: {
    none: '0px',
    thin: '1px',
    medium: '2px',
    thick: '4px',
  },
  style: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
  },
};
