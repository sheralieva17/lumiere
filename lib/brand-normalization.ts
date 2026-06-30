const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  А: 'A',
  е: 'e',
  Е: 'E',
  о: 'o',
  О: 'O',
  р: 'p',
  Р: 'P',
  с: 'c',
  С: 'C',
  у: 'y',
  У: 'Y',
  х: 'x',
  Х: 'X',
  к: 'k',
  К: 'K',
  м: 'm',
  М: 'M',
  т: 't',
  Т: 'T',
  в: 'b',
  В: 'B',
  н: 'h',
  Н: 'H',
}

function replaceConfusableChars(value: string) {
  return Array.from(value)
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join('')
}

function compactBrandKey(value: string) {
  return replaceConfusableChars(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

const BRAND_CANONICAL_BY_KEY: Record<string, string> = {
  manyo: 'Ma:nyo',
  manyofactory: 'Ma:nyo',
  manyofactoryofficial: 'Ma:nyo',
  mannyo: 'Ma:nyo',
  manyoofficial: 'Ma:nyo',
}

export function normalizeBrandName(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) return ''

  const key = compactBrandKey(trimmed)
  return BRAND_CANONICAL_BY_KEY[key] ?? replaceConfusableChars(trimmed)
}

export function expandBrandAliases(value?: string) {
  const normalized = normalizeBrandName(value)
  if (!normalized) return []

  if (normalized === 'Ma:nyo') {
    return ['Ma:nyo', 'Manyo', 'Manyo Factory']
  }

  return [normalized]
}
