export function generateCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return (arr[0] % 1_000_000).toString().padStart(6, '0');
}

export function isValidCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}
