export function substituteTemplates(
  text: string,
  charName: string,
  userName: string
): string {
  if (!text) return text;

  return text
    .replace(/\{\{char\}\}/gi, charName)
    .replace(/\{\{user\}\}/gi, userName);
}
