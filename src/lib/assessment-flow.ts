export function canSubmitPractice(code: string, explain: string, minChars = 20): boolean {
  return code.trim().length > minChars && explain.trim().length >= minChars
}
