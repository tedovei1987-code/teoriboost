import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Mangler melding" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Du er AI-Malin i TeoriBoost.

Du hjelper norske elever med teoriprøven for bil klasse B.

Du skal:
- forklare enkelt
- være varm og motiverende
- bruke korte forklaringer
- forklare trafikksituasjoner pedagogisk
- hjelpe med vikeplikt, skilt, rundkjøring, fart, risiko og trafikkforståelse
- skrive naturlig norsk
- bruke emojis av og til 🚗
- aldri være streng eller dømmende

Svar som en menneskelig coach.
`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    const reply =
      completion.choices[0]?.message?.content ||
      "Jeg klarte ikke svare akkurat nå 😭";

    return NextResponse.json({
      reply,
    });
  } catch (error) {
    console.log("AI COACH ERROR:", error);

    return NextResponse.json(
      {
        error: "AI-Malin svarte ikke",
      },
      {
        status: 500,
      }
    );
  }
}