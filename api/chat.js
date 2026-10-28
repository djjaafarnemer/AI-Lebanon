export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "هذه العملية غير مسموحة."
        });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: "لم يتم إعداد مفتاح الذكاء الاصطناعي."
        });
    }

    const message = req.body?.message;

    if (typeof message !== "string" || !message.trim()) {
        return res.status(400).json({
            error: "اكتب سؤالًا أولًا."
        });
    }

    if (message.length > 4000) {
        return res.status(400).json({
            error: "الرسالة طويلة جدًا."
        });
    }

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: message
                                }
                            ]
                        }
                    ]
                })
            }
        );

        if (!response.ok) {
            console.error("Gemini API error:", response.status);

            return res.status(502).json({
                error: "تعذر الحصول على إجابة. حاول مجددًا."
            });
        }

        const data = await response.json();

        const answer = data.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();

        if (!answer) {
            return res.status(502).json({
                error: "لم تصل إجابة من الذكاء الاصطناعي."
            });
        }

        return res.status(200).json({
            answer: answer
        });

    } catch (error) {
        console.error("Chat request failed.");

        return res.status(500).json({
            error: "حدث خطأ في الاتصال."
        });
    }
}
