export function generateKeyBetween(prev: number | null, next: number | null): number {
  if (prev === null && next === null) {
    return 1.0
  }

  if (prev === null) {
    // Inserted at the top
    return next! - 1.0
  }
  if (next === null) {
    // Inserted at the bottom
    return prev + 1.0
  }
  // Inserted between two tasks
  return (prev + next) / 2
}
