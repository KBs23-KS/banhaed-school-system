export async function compressSquareImage(file, size = 420, quality = 0.82) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d");
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2, sy = (bitmap.height - side) / 2;
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
  return new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
}
