export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}س ${mins}د`;
}

export function formatPrice(price: number | null): string {
  if (!price) return "اتصل للسعر";
  return `$${price.toLocaleString()}`;
}
