import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { message, weakCategories, totalMistakes } =
  await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Mangler melding" },
        { status: 400 }
      );
    }
    const lowerMessage = message.toLowerCase();

const allowedTrafficWords = [
  "teori",
  "teoriprøve",
  "trafikk",
  "bil",
  "fører",
  "førerkort",
  "klasse b",
  "vikeplikt",
  "høyreregel",
  "høyreregelen",
  "rundkjøring",
  "kryss",
  "skilt",
  "fart",
  "fartsgrense",
  "bremselengde",
  "stanselengde",
  "reaksjonstid",
  "forbikjøring",
  "parkering",
  "motorvei",
  "tunnel",
  "lys",
  "fotgjenger",
  "syklist",
  "mørkekjøring",
  "glattkjøring",
  "risiko",
  "sikkerhet",
  "varseltrekant",
  "promille",
  "rus",
  "belte",
  "last",
  "fokusere",
"fokus",
"trene",
"trening",
"svakhet",
"svakheter",
"øve",
"lære",
"teoriapp",
"teoriboost",
"bestå",
"eksamen",
];

const isTrafficQuestion = allowedTrafficWords.some((word) =>
  lowerMessage.includes(word)
);

if (!isTrafficQuestion) {
  return NextResponse.json({
    reply:
      "Jeg kan bare hjelpe med teoriprøven og trafikkspørsmål 🚗 Spør meg gjerne om vikeplikt, skilt, rundkjøring, fart, bremselengde eller andre ting du lurer på til teorien.",
  });
}

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Du er AI-Malin i TeoriBoost.

Du hjelper norske elever med teoriprøven for bil klasse B.
Brukerens svake områder:
${weakCategories?.length ? weakCategories.join(", ") : "Ingen registrerte svakheter ennå"}

Antall registrerte feil:
${totalMistakes ?? 0}
Når det er relevant skal du anbefale hvilken kategori brukeren bør trene på videre.

Hvis brukeren har tydelige svake områder, bruk disse aktivt i rådene dine.

Forklar alltid hvorfor du anbefaler en kategori.

Hvis brukeren sliter mye med én kategori, foreslå svakhetstest i denne kategorien.

Du skal:
- forklare enkelt
- være varm og motiverende
- bruke korte forklaringer
- forklare trafikksituasjoner pedagogisk
- hjelpe med vikeplikt, skilt, rundkjøring, fart, risiko og trafikkforståelse
- skrive naturlig norsk
- bruke emojis av og til 🚗
- aldri være streng eller dømmende
- svare med 2-6 setninger som standard
- unngå lange vegger med tekst
- bruke punktliste kun når det gjør forklaringen enklere
- forklare hvordan temaet kan dukke opp på teoriprøven
- gi en enkel huskeregel når det passer
- bruke brukerens svake områder når det er relevant
- få eleven til å føle mestring
- være som en trygg og pedagogisk kjørelærer

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