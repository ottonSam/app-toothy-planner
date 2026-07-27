import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_PROFILE_IMAGE_DIMENSION = 512;
const PROFILE_IMAGE_QUALITY = 0.7;

type ProfileImageSource = {
  height: number;
  uri: string;
  width: number;
};

export async function compressProfileImage({ height, uri, width }: ProfileImageSource) {
  const context = ImageManipulator.manipulate(uri);
  const largestDimension = Math.max(width, height);

  if (largestDimension > MAX_PROFILE_IMAGE_DIMENSION) {
    context.resize(
      width >= height
        ? { width: MAX_PROFILE_IMAGE_DIMENSION }
        : { height: MAX_PROFILE_IMAGE_DIMENSION }
    );
  }

  const renderedImage = await context.renderAsync();
  const compressedImage = await renderedImage.saveAsync({
    base64: true,
    compress: PROFILE_IMAGE_QUALITY,
    format: SaveFormat.JPEG,
  });

  if (!compressedImage.base64) {
    throw new Error('Nao foi possivel compactar a imagem selecionada.');
  }

  return `data:image/jpeg;base64,${compressedImage.base64}`;
}
