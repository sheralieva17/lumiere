import { describe, expect, it } from "vitest";

type PaymentMethod = "mock_card" | "cash_on_delivery";

type OrderResult =
  | "Заказ успешно оформлен"
  | "Ошибка: Необходимо передать товары и адрес доставки."
  | "Ошибка: Необходимо заполнить город, улицу, дом, квартиру и номер телефона."
  | "Ошибка: Выберите корректный способ оплаты."
  | "Ошибка: В заказе нет корректных товаров.";

function placeOrder(input: {
  items: Array<{ productId: string; quantity: number }> | null;
  shippingAddress:
    | {
        city: string;
        street: string;
        house: string;
        apartment: string;
        phone: string;
      }
    | null;
  paymentMethod: string;
}): OrderResult {
  const { items, shippingAddress, paymentMethod } = input;

  if (!Array.isArray(items) || items.length === 0 || !shippingAddress) {
    return "Ошибка: Необходимо передать товары и адрес доставки.";
  }

  if (
    !shippingAddress.city.trim() ||
    !shippingAddress.street.trim() ||
    !shippingAddress.house.trim() ||
    !shippingAddress.apartment.trim() ||
    !shippingAddress.phone.trim()
  ) {
    return "Ошибка: Необходимо заполнить город, улицу, дом, квартиру и номер телефона.";
  }

  const paymentMethods: PaymentMethod[] = [
    "mock_card",
    "cash_on_delivery",
  ];

  if (!paymentMethods.includes(paymentMethod as PaymentMethod)) {
    return "Ошибка: Выберите корректный способ оплаты.";
  }

  const normalizedItems = items
    .map((item) => ({
      productId: item.productId,
      quantity: Math.max(0, Math.floor(item.quantity)),
    }))
    .filter((item) => item.quantity > 0);

  if (normalizedItems.length === 0) {
    return "Ошибка: В заказе нет корректных товаров.";
  }

  return "Заказ успешно оформлен";
}

const validAddress = {
  city: "Bishkek",
  street: "7-й микрорайон",
  house: "5",
  apartment: "67",
  phone: "+996700123456",
};

const validItems = [{ productId: "prod_1", quantity: 1 }];

const testCases = [
  {
    number: 1,
    description: "успешное оформление заказа",
    items: validItems,
    shippingAddress: validAddress,
    paymentMethod: "mock_card",
    expected: "Заказ успешно оформлен",
  },
  {
    number: 2,
    description: "не указан город",
    items: validItems,
    shippingAddress: { ...validAddress, city: "" },
    paymentMethod: "mock_card",
    expected:
      "Ошибка: Необходимо заполнить город, улицу, дом, квартиру и номер телефона.",
  },
  {
    number: 3,
    description: "не указана улица",
    items: validItems,
    shippingAddress: { ...validAddress, street: "" },
    paymentMethod: "mock_card",
    expected:
      "Ошибка: Необходимо заполнить город, улицу, дом, квартиру и номер телефона.",
  },
  {
    number: 4,
    description: "не указан дом",
    items: validItems,
    shippingAddress: { ...validAddress, house: "" },
    paymentMethod: "mock_card",
    expected:
      "Ошибка: Необходимо заполнить город, улицу, дом, квартиру и номер телефона.",
  },
  {
    number: 5,
    description: "не указана квартира",
    items: validItems,
    shippingAddress: { ...validAddress, apartment: "" },
    paymentMethod: "mock_card",
    expected:
      "Ошибка: Необходимо заполнить город, улицу, дом, квартиру и номер телефона.",
  },
  {
    number: 6,
    description: "не указан номер телефона",
    items: validItems,
    shippingAddress: { ...validAddress, phone: "" },
    paymentMethod: "mock_card",
    expected:
      "Ошибка: Необходимо заполнить город, улицу, дом, квартиру и номер телефона.",
  },
  {
    number: 7,
    description: "пустая корзина",
    items: Array<{ productId: string; quantity: number }>(),
    shippingAddress: validAddress,
    paymentMethod: "mock_card",
    expected: "Ошибка: Необходимо передать товары и адрес доставки.",
  },
] as const;

describe("Оформление заказа", () => {
  it.each(testCases)(
    "Тест #%number: $description -> $expected",
    ({ items, shippingAddress, paymentMethod, expected }) => {
      expect(placeOrder({ items, shippingAddress, paymentMethod })).toBe(expected);
    },
  );
});
