import { describe, expect, it } from "vitest";

type RegisterResult =
  | "Успешная регистрация"
  | "Ошибка: Необходимо заполнить имя, фамилию, e-mail и пароль."
  | "Ошибка: Этот e-mail уже зарегистрирован.";

const existingEmails = [
  "existing@mail.com",
  "admin@lumiere.com",
  "manager@lumiere.com",
];

function registerUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): RegisterResult {
  const { firstName, lastName, email, password } = input;

  if (!firstName || !lastName || !email || !password) {
    return "Ошибка: Необходимо заполнить имя, фамилию, e-mail и пароль.";
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (existingEmails.includes(normalizedEmail)) {
    return "Ошибка: Этот e-mail уже зарегистрирован.";
  }

  return "Успешная регистрация";
}

const testCases = [
  {
    number: 1,
    firstName: "Zhanara",
    lastName: "Abdrai kyzy",
    email: "zhanara@mail.com",
    password: "user123",
    expected: "Успешная регистрация",
  },
  {
    number: 2,
    firstName: "",
    lastName: "Abdrai kyzy",
    email: "zhanara@mail.com",
    password: "user123",
    expected: "Ошибка: Необходимо заполнить имя, фамилию, e-mail и пароль.",
  },
  {
    number: 3,
    firstName: "Zhanara",
    lastName: "",
    email: "zhanara@mail.com",
    password: "user123",
    expected: "Ошибка: Необходимо заполнить имя, фамилию, e-mail и пароль.",
  },
  {
    number: 4,
    firstName: "Zhanara",
    lastName: "Abdrai kyzy",
    email: "",
    password: "user123",
    expected: "Ошибка: Необходимо заполнить имя, фамилию, e-mail и пароль.",
  },
  {
    number: 5,
    firstName: "Zhanara",
    lastName: "Abdrai kyzy",
    email: "zhanara@mail.com",
    password: "",
    expected: "Ошибка: Необходимо заполнить имя, фамилию, e-mail и пароль.",
  },
  {
    number: 6,
    firstName: "Zhanara",
    lastName: "Abdrai kyzy",
    email: "existing@mail.com",
    password: "user123",
    expected: "Ошибка: Этот e-mail уже зарегистрирован.",
  },
] as const;

describe("Регистрация пользователя", () => {
  it.each(testCases)(
    "Тест #%number: firstName=%firstName, lastName=%lastName, email=%email, password=%password -> $expected",
    ({ firstName, lastName, email, password, expected }) => {
      expect(registerUser({ firstName, lastName, email, password })).toBe(
        expected,
      );
    },
  );
});
