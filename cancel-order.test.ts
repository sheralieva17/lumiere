import { describe, expect, it } from "vitest";

type ClientOrderStatus =
  | "processing"
  | "assembling"
  | "in_transit"
  | "delivered"
  | "cancelled";

type CancellationStatus = "none" | "requested" | "approved";

type CancelOrderResult =
  | "Запрос на отмену успешно отправлен."
  | "Ошибка: Причина отмены обязательна."
  | "Ошибка: Заказ не найден."
  | "Ошибка: Нельзя отменить заказ, который уже в пути или доставлен."
  | "Ошибка: Этот заказ уже отменен."
  | "Ошибка: Запрос на отмену уже отправлен.";

function requestOrderCancellation(input: {
  orderExists: boolean;
  status: ClientOrderStatus;
  cancellationStatus: CancellationStatus;
  cancellationReason: string;
}): CancelOrderResult {
  const normalizedReason = input.cancellationReason.trim();

  if (!normalizedReason) {
    return "Ошибка: Причина отмены обязательна.";
  }

  if (!input.orderExists) {
    return "Ошибка: Заказ не найден.";
  }

  if (input.status === "in_transit" || input.status === "delivered") {
    return "Ошибка: Нельзя отменить заказ, который уже в пути или доставлен.";
  }

  if (input.status === "cancelled" || input.cancellationStatus === "approved") {
    return "Ошибка: Этот заказ уже отменен.";
  }

  if (input.cancellationStatus === "requested") {
    return "Ошибка: Запрос на отмену уже отправлен.";
  }

  return "Запрос на отмену успешно отправлен.";
}

const testCases = [
  {
    number: 1,
    description: "успешная отправка запроса на отмену",
    input: {
      orderExists: true,
      status: "processing" as const,
      cancellationStatus: "none" as const,
      cancellationReason: "Изменились обстоятельства",
    },
    expected: "Запрос на отмену успешно отправлен.",
  },
  {
    number: 2,
    description: "причина отмены не указана",
    input: {
      orderExists: true,
      status: "processing" as const,
      cancellationStatus: "none" as const,
      cancellationReason: "",
    },
    expected: "Ошибка: Причина отмены обязательна.",
  },
  {
    number: 3,
    description: "выбран активный заказ, доступный для отмены",
    input: {
      orderExists: true,
      status: "assembling" as const,
      cancellationStatus: "none" as const,
      cancellationReason: "Хочу отменить заказ",
    },
    expected: "Запрос на отмену успешно отправлен.",
  },
  {
    number: 4,
    description: "запрос на отмену уже отправлен",
    input: {
      orderExists: true,
      status: "processing" as const,
      cancellationStatus: "requested" as const,
      cancellationReason: "Повторная попытка",
    },
    expected: "Ошибка: Запрос на отмену уже отправлен.",
  },
] as const;

describe("Запрос на отмену заказа", () => {
  it.each(testCases)(
    "Тест #%number: $description -> $expected",
    ({ input, expected }) => {
      expect(requestOrderCancellation(input)).toBe(expected);
    },
  );
});
