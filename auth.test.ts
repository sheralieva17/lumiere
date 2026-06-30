import { describe, expect, it } from "vitest";

type AuthResult =
  | "Успешная авторизация"
  | "Ошибка: введите email"
  | "Ошибка: введите пароль"
  | "Ошибка: неверный пароль"
  | "Ошибка: пользователь не найден";

const users = [
  { email: "user@lumiere.com", password: "user123" },
  { email: "manager@lumiere.com", password: "manager123" },
  { email: "admin@lumiere.com", password: "admin123" },
];

function authorize(email: string, password: string): AuthResult {
  if (!email.trim()) {
    return "Ошибка: введите email";
  }

  if (!password.trim()) {
    return "Ошибка: введите пароль";
  }

  const user = users.find((item) => item.email === email);

  if (!user) {
    return "Ошибка: пользователь не найден";
  }

  if (user.password !== password) {
    return "Ошибка: неверный пароль";
  }

  return "Успешная авторизация";
}

const testCases = [
  {
    number: 1,
    email: "user@lumiere.com",
    password: "user123",
    expected: "Успешная авторизация",
  },
  {
    number: 2,
    email: "user@lumiere.com",
    password: "wrong123",
    expected: "Ошибка: неверный пароль",
  },
  {
    number: 3,
    email: "wrong@lumiere.com",
    password: "user123",
    expected: "Ошибка: пользователь не найден",
  },
  {
    number: 4,
    email: "",
    password: "user123",
    expected: "Ошибка: введите email",
  },
  {
    number: 5,
    email: "user@lumiere.com",
    password: "",
    expected: "Ошибка: введите пароль",
  },
  {
    number: 6,
    email: "manager@lumiere.com",
    password: "manager123",
    expected: "Успешная авторизация",
  },
  {
    number: 7,
    email: "admin@lumiere.com",
    password: "admin123",
    expected: "Успешная авторизация",
  },
] as const;

describe("Авторизация пользователя", () => {
  it.each(testCases)(
    "Тест #%number: email=%email, password=%password -> $expected",
    ({ email, password, expected }) => {
      expect(authorize(email, password)).toBe(expected);
    },
  );
});
