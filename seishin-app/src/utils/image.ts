export async function resizeImage(file: File, size = 256, square = false) {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (square) {
      const side = Math.min(img.width, img.height)
      const target = Math.min(size, side)
      canvas.width = target
      canvas.height = target
      ctx?.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, target, target)
      return canvas.toDataURL('image/jpeg', 0.88)
    }
    const scale = Math.min(1, size / Math.max(img.width, img.height))
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}
