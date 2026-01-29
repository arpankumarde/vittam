export const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL as string;
export const CDN_PREFIX = process.env.NEXT_PUBLIC_CDN_PREFIX as string;

export const getAssetUrl = (path: string) => {
  return `${CDN_URL}/${CDN_PREFIX}/${path}`;
};
