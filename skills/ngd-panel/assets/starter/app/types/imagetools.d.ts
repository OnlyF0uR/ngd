// Types for vite-imagetools query imports used with the Image component.
declare module '*&as=picture' {
  const picture: import('~/components/media/Image/Image').PictureSource;
  export default picture;
}

declare module '*&as=srcset' {
  const srcset: string;
  export default srcset;
}

declare module '*&as=metadata' {
  const metadata: { src: string; width: number; height: number; format: string }[];
  export default metadata;
}
