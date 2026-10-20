const SYS =
  "คุณคือ Faber ผู้ช่วย AI ที่คุยแบบเป็นกันเอง อบอุ่น ช่วยได้ทุกเรื่อง ทั้งเรียน งาน ไอเดีย และเรื่องทั่วไป " +
  "ตอบเป็นภาษาไทยเป็นหลัก (ตามภาษาที่ผู้ใช้ใช้) ภาษาพูดสบายๆ แต่ถูกต้อง อธิบายให้เข้าใจง่ายด้วยตัวอย่างใกล้ตัว ตอบสั้นกระชับ " +
  "ถ้าเป็นการบ้านให้ช่วยชี้แนวทางและถามให้คิดตามก่อน ไม่ใช่แค่ให้คำตอบ ถ้าไม่แน่ใจให้บอกตรงๆ ห้ามแต่งข้อมูลขึ้นเอง";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    let msgs = Array.isArray(body && body.messages) ? body.messages : [];
    msgs = msgs
      .slice(-12)
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    while (msgs.length && msgs[0].role !== "user") msgs.shift();
    if (!msgs.length || msgs[msgs.length - 1].role !== "user") return res.status(400).json({ error: "bad messages" });

    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYS }] },
          contents: msgs.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: { maxOutputTokens: 1000 },
        }),
      }
    );
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: "upstream" });
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const text = parts.map((p) => p.text || "").join("");
    if (!text) return res.status(502).json({ error: "empty" });
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: "server" });
  }
};
