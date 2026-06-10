// Maps any category string to one of the riso ink colors, deterministically,
// so the same category always gets the same sticker color across cards.
const TAG_COLORS = ["red", "blue", "green", "yellow"];

export function categoryColor(label) {
  if (!label) return "blue";
  let sum = 0;
  for (let i = 0; i < label.length; i++) {
    sum += label.charCodeAt(i);
  }
  return TAG_COLORS[sum % TAG_COLORS.length];
}