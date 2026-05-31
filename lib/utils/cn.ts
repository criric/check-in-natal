export type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | ClassValue[]
  | { [key: string]: boolean | null | undefined }

export function cn(...values: ClassValue[]): string {
  const out: string[] = []

  for (const value of values) {
    if (!value) continue

    if (typeof value === 'string' || typeof value === 'number') {
      out.push(String(value))
      continue
    }

    if (Array.isArray(value)) {
      const sub = cn(...value)
      if (sub) out.push(sub)
      continue
    }

    if (typeof value === 'object') {
      for (const key of Object.keys(value)) {
        if (value[key]) out.push(key)
      }
    }
  }

  return out.join(' ')
}
