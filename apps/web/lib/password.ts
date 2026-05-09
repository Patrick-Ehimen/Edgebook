export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too short" | "Weak" | "Okay" | "Good" | "Strong";
};

const LABELS: Record<0 | 1 | 2 | 3 | 4, PasswordStrength["label"]> = {
  0: "Too short",
  1: "Weak",
  2: "Okay",
  3: "Good",
  4: "Strong",
};

export function scorePassword(value: string): PasswordStrength {
  if (!value) return { score: 0, label: LABELS[0] };

  let s = 0;
  if (value.length >= 8) s++;
  if (value.length >= 12) s++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) s++;
  if (/\d/.test(value) && /[a-zA-Z]/.test(value)) s++;
  if (/[^A-Za-z0-9]/.test(value) && value.length >= 14) s++;

  const score = Math.min(4, s) as 0 | 1 | 2 | 3 | 4;
  return { score, label: LABELS[score] };
}
