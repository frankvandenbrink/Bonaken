// Genereer een 6-karakter alfanumerieke spelcode
// Verwijder verwarrende tekens (0, O, I, l, 1)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateGameCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
}

export function isValidGameCode(code: string): boolean {
  if (code.length !== 6) return false;
  return /^[A-Z0-9]{6}$/i.test(code);
}
