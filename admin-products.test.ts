import { describe, expect, it } from "vitest";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  category: "skincare" | "makeup" | "fragrance" | "haircare";
  brand: string;
};

type AdminProductResult =
  | "Товар успешно добавлен в каталог"
  | "Ошибка добавления товара"
  | "Данные товара успешно обновлены"
  | "Остаток товара обновлен"
  | "Товар удален из каталога";

function createProduct(
  input: Omit<Product, "id">,
): AdminProductResult {
  if (
    !input.name ||
    !input.description ||
    !input.image ||
    Number.isNaN(input.price) ||
    Number.isNaN(input.stock)
  ) {
    return "Ошибка добавления товара";
  }

  return "Товар успешно добавлен в каталог";
}

function updateProduct(
  existing: Product,
  updates: Partial<Omit<Product, "id">>,
): { result: AdminProductResult; product: Product } {
  const updated = { ...existing, ...updates };
  return {
    result: "Данные товара успешно обновлены",
    product: updated,
  };
}

function updateStock(existing: Product, newStock: number) {
  return {
    result: "Остаток товара обновлен" as const,
    product: {
      ...existing,
      stock: Math.max(0, Math.floor(newStock)),
    },
  };
}

function deleteProduct(existing: Product | null): AdminProductResult {
  if (!existing) {
    throw new Error("Товар не найден.");
  }

  return "Товар удален из каталога";
}

const baseProduct: Product = {
  id: "prod_1",
  name: "Hydra-Glow Moisturizer",
  description: "Увлажняющий крем для ежедневного ухода.",
  price: 32,
  stock: 15,
  image: "/images/product-cream.jpg",
  category: "skincare",
  brand: "LUMIERE",
};

describe("Управление товарами администратора", () => {
  it("Тест #1: добавление товара -> Товар успешно добавлен в каталог", () => {
    expect(
      createProduct({
        name: "Radiance Serum",
        description: "Сыворотка для сияния кожи.",
        price: 28,
        stock: 10,
        image: "/images/product-serum.jpg",
        category: "skincare",
        brand: "LUMIERE",
      }),
    ).toBe("Товар успешно добавлен в каталог");
  });

  it("Тест #2: добавление товара без названия -> Ошибка добавления товара", () => {
    expect(
      createProduct({
        name: "",
        description: "Сыворотка для сияния кожи.",
        price: 28,
        stock: 10,
        image: "/images/product-serum.jpg",
        category: "skincare",
        brand: "LUMIERE",
      }),
    ).toBe("Ошибка добавления товара");
  });

  it("Тест #3: редактирование товара -> Данные товара успешно обновлены", () => {
    const result = updateProduct(baseProduct, {
      name: "Hydra-Glow Moisturizer Plus",
      price: 35,
      description: "Обновленный увлажняющий крем.",
    });

    expect(result.result).toBe("Данные товара успешно обновлены");
    expect(result.product.name).toBe("Hydra-Glow Moisturizer Plus");
    expect(result.product.price).toBe(35);
  });

  it("Тест #4: изменение остатка товара -> Остаток товара обновлен", () => {
    const result = updateStock(baseProduct, 25);

    expect(result.result).toBe("Остаток товара обновлен");
    expect(result.product.stock).toBe(25);
  });

  it("Тест #5: удаление товара -> Товар удален из каталога", () => {
    expect(deleteProduct(baseProduct)).toBe("Товар удален из каталога");
  });
});
