export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Empty" | "Weak" | "Fair" | "Good" | "Strong";
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    symbol: boolean;
  };
}

export function getPasswordStrength(password: string): PasswordStrength {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const met = Object.values(requirements).filter(Boolean).length;
  const score =
    password.length === 0 ? 0 : met <= 1 ? 1 : met <= 3 ? 2 : met === 4 ? 3 : 4;

  const labels: PasswordStrength["label"][] = [
    "Empty",
    "Weak",
    "Fair",
    "Good",
    "Strong",
  ];

  return {
    score,
    label: labels[score],
    requirements,
  };
}

export function validateStrongPassword(
  password: string,
  label = "Password",
): string | null {
  if (password.length < 8) return `${label} must be at least 8 characters`;
  if (password.length > 128) return `${label} must be 128 characters or fewer`;
  if (!/[A-Z]/.test(password))
    return `${label} must include an uppercase letter`;
  if (!/[a-z]/.test(password))
    return `${label} must include a lowercase letter`;
  if (!/\d/.test(password)) return `${label} must include a number`;
  if (!/[^A-Za-z0-9]/.test(password)) return `${label} must include a symbol`;
  return null;
}
