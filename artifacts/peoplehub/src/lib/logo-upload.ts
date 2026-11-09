/** Small logos are stored with the CMS content, not on an ephemeral upload disk. */
export async function encodeLogo(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPEG or WebP image.');
  if (file.size > 10_000_000) throw new Error('Choose an image smaller than 10MB.');
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the image.'));
    reader.readAsDataURL(file);
  });
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Could not open the image.'));
    image.src = original;
  });
  const scale = Math.min(1, 800 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image processing is unavailable in this browser.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const compressed = canvas.toDataURL('image/webp', 0.88);
  const output = compressed.startsWith('data:image/webp') && (compressed.length < original.length || scale < 1) ? compressed : original;
  if (output.length > 200000) throw new Error('The processed image exceeds 150KB. Choose a smaller image.');
  return output;
}
