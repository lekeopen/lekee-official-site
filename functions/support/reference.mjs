export function createSupportReference(now, randomBytes) {
  const date = now.toISOString().slice(0, 10).replaceAll('-', '');
  const random = [...randomBytes].map((byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `LK-${date}-${random}`;
}
