const HARAKAT = /[\u064B-\u0652\u0670]/g;

export function baseLetter(token: string) {
  return token.replace(HARAKAT, "");
}
