import { buildCatalogContext, searchProductsForChat } from "@/lib/chat-catalog"

const BASE_SYSTEM_PROMPT = `You are LUMIERE's friendly and knowledgeable beauty assistant. You help customers with:
- Product recommendations based on their skin type, concerns, and preferences
- Skincare routine advice
- Makeup tips and application guidance
- Ingredient information and benefits
- Order and shipping inquiries

Be warm, professional, and concise. Use short paragraphs. When recommending products, mention specific product names and prices. Use the supplied catalog context as your source of truth for product availability and details. If a question is outside beauty/cosmetics, politely redirect to how you can help with beauty needs.`

function shouldReplyInRussian(text: string) {
  return /[а-яё]/i.test(text)
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return Response.json(
        { error: "Не настроен ключ OPENAI_API_KEY." },
        { status: 500 }
      )
    }

    const { messages }: { messages?: Array<{ role: string; text: string }> } =
      await req.json()
    const history = Array.isArray(messages) ? messages : []
    const latestUserMessage = [...history]
      .reverse()
      .find((message) => message.role !== "assistant")
      ?.text?.trim() ?? ""

    const matchedProducts = latestUserMessage
      ? await searchProductsForChat(latestUserMessage, 6)
      : []
    const catalogContext = buildCatalogContext(matchedProducts)
    const replyLanguage = shouldReplyInRussian(latestUserMessage)
      ? "Russian"
      : "the same language as the user's last message"

    const formattedMessages = history.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.text ?? "",
    }))

    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `${BASE_SYSTEM_PROMPT}

Reply in ${replyLanguage}.

Relevant catalog context for the current customer request:
${catalogContext}

Strict rules:
- Recommend or mention only products that appear in the catalog context above.
- Do not invent products, brands, prices, ingredients, or availability.
- Use the availability line from the catalog context as the source of truth for stock status.
- If a product is marked "out of stock", clearly say that it is currently unavailable.
- If a product is marked "in stock", you may say that it is available.
- If the catalog context says that no relevant products were found, clearly say that you could not find a matching product in the current catalog.
- In Russian, this may appear as "В каталоге не найдено подходящих товаров."
- If useful, you may still give general beauty advice, but separate it clearly from product availability and do not attach non-existent product names to that advice.
- Format recommendation answers in this structure when products are found:
  1. A short conclusion sentence.
  2. If there is exactly one strong product match, present it naturally as a short focused recommendation instead of a long list.
  3. If there are multiple matches, use "Recommended products:" followed by a short list of products.
  4. Finish with "Why these fit:" followed by short reasons.
- Present products as a numbered list.
- For each listed product, include:
  - product name
  - price
  - one short description line
- Keep the answer concise and easy to scan.
- If the customer asks in Russian, keep the section labels in Russian too, for example:
  - "Кратко:"
  - "Подходящие товары:"
  - "Почему они подходят:"`,
          },
          ...formattedMessages,
        ],
      }),
      signal: req.signal,
    })

    const data = await openAiRes.json()
    if (!openAiRes.ok) {
      const errorMessage =
        data?.error?.message ?? "Не удалось получить ответ от чат-ассистента."
      return Response.json({ error: errorMessage }, { status: openAiRes.status })
    }

    const text = data?.choices?.[0]?.message?.content ?? ""
    return Response.json({ text })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Произошла неизвестная ошибка чата."
    return Response.json({ error: message }, { status: 500 })
  }
}
