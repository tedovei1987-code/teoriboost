"use client";

import {
  TrendingUp,
  AlertTriangle,
  Trophy,
  Sparkles,
  Flame,
  Smile,
  Target,
} from "lucide-react";

type MasteryItem = {
  category: string;
  mastery_score: number;
};

type Props = {
  masteryData: MasteryItem[];
  xp: number;
  rank: string;
};

const RECENT_MESSAGE_LIMIT = 50;

const malinMessages = {
  greetings: [
    "Hei 👋 Jeg heter Malin, og jeg er din AI-Coach i TeoriBoost 🚗",
    "Hei igjen 😄 Klar for å bli litt tryggere i trafikken?",
    "Velkommen tilbake 🚀 La oss jobbe smartere, ikke bare mer.",
    "Ny økt, nye XP, ny progresjon 💪",
    "Jeg er her for å hjelpe deg med å skjønne feilene dine 🧠",
    "Klar for litt teori, litt kaos og litt mestring? 😭",
    "I dag gjør vi deg litt mer eksamensklar 🚦",
    "Hei sjåfør 😎 Skal vi styrke svake i dag?",
    "La oss bygge ekte trafikkforståelse, ikke bare pugge svar.",
    "Du møter opp. Det er allerede en seier 👏",
    "Teoriprøven skal ikke få ta deg så lett 😄",
    "Jeg følger med på progresjonen din 👀",
    "La oss gjøre dagens test mindre skummel.",
    "Hei 👋 Jeg hjelper deg med å finne hva du bør trene på videre.",
    "Klar for å gjøre feil om til poeng? 🚀",
    "Du + jevn trening = bestått vibes 😎",
    "Ny dag, ny sjanse til å knuse noen spørsmål.",
    "Jeg heter Malin, og jeg er her for å mase litt hyggelig på deg 😄",
    "La oss se hva hjernen din får til i dag 🧠",
    "Tid for TeoriBoost-mode 🔥",
  ],

  motivation: [
    "Sterkt jobbet 😄",
    "Du blir bedre for hver test 🚀",
    "Du er nærmere teoriprøven enn du tror.",
    "Små forbedringer hver dag gir stor utvikling 📈",
    "Du bygger ekte trafikkforståelse nå.",
    "Ikke gi opp. Du lærer masse akkurat nå 💪",
    "Du begynner å tenke som en trygg sjåfør.",
    "Progresjon er viktigere enn perfeksjon.",
    "Jeg liker utviklingen din 👀",
    "Du virker tryggere i vurderingene dine.",
    "Dette er akkurat hvorfor vi trener.",
    "Du knuser flere spørsmål enn før 😎",
    "Bra fokus i dag.",
    "Du bygger et skikkelig bra grunnlag.",
    "Dette er ikke flaks lenger.",
    "Du tar bedre valg enn tidligere.",
    "Dette begynner å ligne ekte mestring.",
    "Fortsett sånn, du er på riktig vei.",
    "Du lærer raskere enn du tror.",
    "Du gjør en solid jobb nå 👏",
  ],

  humor: [
    "Oi 😭 Den rundkjøringen der var kaotisk.",
    "Hvis dette var ekte trafikk hadde jeg tatt bussen 😅",
    "HAHA 😭 Det spørsmålet lurte deg skikkelig.",
    "Du og vikeplikt har litt beef akkurat nå 👀",
    "Den forbikjøringen var litt for Fast & Furious.",
    "Jeg så den feilen komme 😅",
    "Bremselengde er visst fortsatt en fiende.",
    "Det der var faktisk et slemt spørsmål.",
    "Ikke stress, selv flinke sjåfører gjør rare feil 😄",
    "Du kjørte mentalt rett i grøfta der 😭",
    "Trafikken hadde vært spennende med den avgjørelsen 😂",
    "Du svarte med selvtillit. Litt for mye selvtillit.",
    "Den vurderingen var modig. Altfor modig 😅",
    "Hvis bilen kunne snakke, hadde den skreket.",
    "Litt YOLO på glattkjøringen der kanskje.",
    "Du svarte med hjertet, ikke teoriboka.",
    "Jeg tror det skiltet vant denne runden 😭",
    "Ikke freestyle trafikkreglene 😂",
    "Det var et kreativt svar. Ikke riktig, men kreativt.",
    "Nå må vi få hjernen tilbake fra pausemodus.",
  ],

  adaptiveTips: [
    "Du bør fokusere mer på vikeplikt akkurat nå.",
    "Prøv flere spørsmål på samhandling.",
    "Du mister flest poeng på risikovurdering akkurat nå.",
    "Mørkekjøring trenger litt mer trening 🌙",
    "Du begynner å bli sterkere på trafikkskilt.",
    "Bremselengde trenger mer fokus.",
    "Bra utvikling på kryss i dag.",
    "Fokuser litt mer på tunnelkjøring.",
    "Du gjør færre feil på motorvei nå.",
    "Glattkjøring blir bedre og bedre ❄️",
    "Du bør lese spørsmålene litt roligere.",
    "Neste mål: færre slurvefeil.",
    "Du presterer bedre når du tar deg tid.",
    "Konsentrasjonen din virker bedre nå.",
    "Blindsoner bør trenes mer.",
    "Syklister og fotgjengere er et viktig fokusområde.",
    "Du er klar for litt vanskeligere spørsmål.",
    "Eksamenstest kan være smart snart.",
    "Du bør repetere faresituasjoner.",
    "Du har bra fremgang på sikkerhetsspørsmål.",
  ],

  weakArea: [
    "Dette området trenger litt ekstra kjærlighet.",
    "Her mister du fortsatt en del poeng.",
    "Dette er et av områdene du bør fokusere mest på akkurat nå.",
    "La oss prioritere dette i neste test.",
    "Du er på vei, men dette sitter ikke helt enda.",
    "Dette er akkurat typen feil vi kan fikse raskt.",
    "Du bør trene mer målrettet her.",
    "Dette området kan løfte totalresultatet ditt mye.",
    "Får vi kontroll på dette, blir du mye sterkere.",
    "Dette er ikke krise, men det bør trenes.",
    "Dette området går igjen i feilene dine.",
    "Her svarer du litt for raskt.",
    "Du virker litt usikker på dette temaet.",
    "Dette er et smart fokus for neste økt.",
    "Du trenger flere repetisjoner her.",
    "Dette er et klassisk teorifelle-område.",
    "Her må vi bygge tryggere forståelse.",
    "Dette kan bli en styrke hvis vi trener riktig.",
    "Du er ikke langt unna å få kontroll her.",
    "La oss gjøre dette området til en av dine sterkeste kategorier.",
  ],

  streak: [
    "Streaken din begynner å bli farlig høy 🔥",
    "Du holder momentumet oppe.",
    "Bra consistency 👏",
    "Dette er hvordan man faktisk lærer.",
    "Daglig trening fungerer.",
    "Ikke mist streaken nå 😭",
    "Du bygger gode vaner.",
    "Sterk innsats flere dager på rad.",
    "Disiplin slår motivasjon.",
    "Jeg liker denne streaken 😎",
    "Du begynner å bli avhengig av XP.",
    "Streaken din er faktisk imponerende.",
    "Dette er ekte progresjon.",
    "Fortsett sånn, så blir teoriprøven lettere.",
    "Nå er du inne i flytsonen.",
    "Daglig trening slår skippertak.",
    "Du møter opp hver dag. Respekt.",
    "TeoriBoost-maskinen stopper ikke.",
    "Dette er sånn toppscorere trener.",
    "Streaken lever fortsatt 🔥",
  ],

  examMode: [
    "Klar for exam mode? 😎",
    "Dette begynner å ligne ekte teoriprøve.",
    "Nå tester vi ekte forståelse.",
    "Exam mode skiller pugging fra forståelse.",
    "Du virker faktisk ganske klar nå.",
    "La oss se hva du virkelig kan.",
    "Ingen nåde i exam mode 😭",
    "Dette er final boss av teori.",
    "Du er nærmere klar enn du tror.",
    "Hold fokus nå.",
    "Exam mode handler om ro og vurdering.",
    "Stol på kunnskapen din.",
    "Ikke stress. Tenk logisk.",
    "Dette er veldig bra trening.",
    "Du klarer dette.",
    "Ekte teoriprøve-vibes nå.",
    "Nå gjelder det.",
    "Bra fokus i exam mode.",
    "Dette er der legends blir skapt.",
    "Konsentrasjon nå 💚",
  ],

  failureRecovery: [
    "Ikke stress. Det er sånn man lærer.",
    "Feil svar betyr bare mer erfaring.",
    "Dette er helt normalt.",
    "Alle sliter med noen kategorier.",
    "Du lærer mest akkurat nå.",
    "Ikke la én dårlig test stoppe deg.",
    "Du kommer sterkere tilbake.",
    "Det viktigste er at du fortsetter.",
    "Ingen blir gode uten feil.",
    "Ta en pause og prøv igjen.",
    "Dette er bare en del av prosessen.",
    "Ikke gi opp nå.",
    "Du er fortsatt på riktig vei.",
    "Dårlige tester skjer alle.",
    "Neste test blir bedre.",
    "Du bygger erfaring akkurat nå.",
    "Læring er viktigere enn perfeksjon.",
    "Det går fremover selv om det føles tungt.",
    "Du klarer dette.",
    "Vi tar det steg for steg.",
  ],

  victory: [
    "YES 🔥 Sterk test!",
    "Du knuste den testen 😎",
    "Imponerende 👏",
    "Det der var skikkelig bra.",
    "Du begynner å bli farlig god.",
    "Sterk kontroll på spørsmålene nå.",
    "Dette er ekte progresjon.",
    "Du leverte.",
    "Nå snakker vi.",
    "Veldig bra jobbet.",
    "Dette hadde holdt på ekte teoriprøve.",
    "Du begynner å bli vanskelig å stoppe.",
    "Massive gains i dag.",
    "Du ser mye tryggere ut i vurderingene dine.",
    "Bra reaksjoner og gode valg.",
    "Det der var smooth.",
    "Du blir mer stabil for hver test.",
    "Dette er nivå.",
    "Perfekt fokus.",
    "Sterk seier 🔥",
  ],

  sharpenUp: [
    "Du må skjerpe deg litt nå 😭",
    "Konsentrasjonen din tok visst pause.",
    "LES spørsmålet 👀",
    "Oi, nå svarte du litt for fort.",
    "Den feilen burde du tatt.",
    "Ikke speedrun teoriprøven.",
    "Rolig nå.",
    "Du vet egentlig dette.",
    "Ta deg litt bedre tid.",
    "Nå ble det litt kaos.",
    "Fokus.",
    "Du gambler litt for mye akkurat nå.",
    "Tenk før du svarer.",
    "Det der var en unødvendig feil.",
    "Hjernen din var AFK der.",
    "Kom igjen. Du kan bedre enn dette.",
    "Nå må vi samle fokus litt.",
    "Ikke la slurvefeil ødelegge.",
    "Du er bedre enn de svarene der.",
    "Skjerpings 😭🚗",
  ],
};

type MessageType = keyof typeof malinMessages;

function pickMessage(type: MessageType) {
  const messages = malinMessages[type];
  const storageKey = "malin_recent_messages";

  if (typeof window === "undefined") {
    return messages[Math.floor(Math.random() * messages.length)];
  }

  const stored = window.localStorage.getItem(storageKey);
  const recentMessages: string[] = stored ? JSON.parse(stored) : [];

  const availableMessages = messages.filter(
    (message) => !recentMessages.includes(message)
  );

  const pool = availableMessages.length > 0 ? availableMessages : messages;
  const selected = pool[Math.floor(Math.random() * pool.length)];

  const updatedRecent = [selected, ...recentMessages].slice(
    0,
    RECENT_MESSAGE_LIMIT
  );

  window.localStorage.setItem(storageKey, JSON.stringify(updatedRecent));

  return selected;
}

export default function AICoach({ masteryData, xp, rank }: Props) {
  const hasMastery = masteryData && masteryData.length > 0;

  const greeting = pickMessage("greetings");
  const motivation = pickMessage("motivation");
  const humor = pickMessage("humor");
  const examTip = pickMessage("examMode");
  const streakMessage = pickMessage("streak");

  if (!hasMastery) {
    return (
      <div className="mt-6 rounded-3xl border border-[#3EE6B0]/20 bg-gradient-to-br from-[#3EE6B0]/10 to-cyan-500/10 p-6">
        <div className="mb-5 flex items-center gap-4">
          <img
            src="/malin-avatar.png"
            alt="Malin AI Coach"
            className="h-20 w-20 rounded-full border-2 border-[#3EE6B0]/40 object-cover shadow-[0_0_25px_rgba(62,230,176,0.25)]"
          />

          <div>
            <h2 className="text-2xl font-black text-white">Malin</h2>
            <p className="text-sm text-zinc-400">Din personlige AI-Coach</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-lg font-bold text-white">{greeting}</p>

          <p className="mt-3 text-zinc-300">
            Jeg hjelper deg med å forstå hva du gjør feil, forbedre svake
            områder og bestå teoriprøven raskere 🚗
          </p>

          <p className="mt-4 text-[#3EE6B0]">{motivation}</p>

          <p className="mt-3 text-zinc-400">{humor}</p>

          <p className="mt-4 text-sm text-zinc-500">
            Fullfør flere tester, så kan jeg analysere styrker, svake områder og
            gi deg smartere anbefalinger.
          </p>
        </div>
      </div>
    );
  }

  const sorted = [...masteryData].sort(
    (a, b) => a.mastery_score - b.mastery_score
  );

  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  const overall =
    masteryData.reduce((acc, item) => acc + item.mastery_score, 0) /
    masteryData.length;

  function getMotivation() {
    if (overall >= 85) return pickMessage("victory");
    if (overall >= 70) return pickMessage("motivation");
    if (overall >= 50) return pickMessage("adaptiveTips");
    return pickMessage("failureRecovery");
  }

  function getRecommendation() {
    if (weakest.mastery_score < 40) {
      return `${pickMessage("sharpenUp")} Fokuser på ${
        weakest.category
      }. Dette er ditt svakeste område akkurat nå.`;
    }

    if (weakest.mastery_score < 60) {
      return `${pickMessage("weakArea")} Prioriter flere oppgaver innen ${
        weakest.category
      }.`;
    }

    if (weakest.mastery_score < 75) {
      return `Du er på vei 💪 ${weakest.category} trenger fortsatt litt ekstra trening.`;
    }

    return "Du har jevn progresjon i alle kategorier. Fortsett slik 🚀";
  }

  function getCoachMood() {
    if (overall >= 85) return pickMessage("victory");
    if (overall >= 65) return pickMessage("motivation");
    if (overall >= 45) return pickMessage("adaptiveTips");
    return pickMessage("sharpenUp");
  }

  return (
    <div className="mt-6 rounded-3xl border border-[#3EE6B0]/20 bg-gradient-to-br from-[#3EE6B0]/10 to-cyan-500/10 p-6">
      <div className="mb-6 flex items-center gap-4">
        <img
          src="/malin-avatar.png"
          alt="Malin AI Coach"
          className="h-20 w-20 rounded-full border-2 border-[#3EE6B0]/40 object-cover shadow-[0_0_25px_rgba(62,230,176,0.25)]"
        />

        <div>
          <h2 className="text-2xl font-black text-white">Malin</h2>

          <p className="text-sm text-zinc-400">
            Hei 👋 Jeg er din AI-Coach i TeoriBoost
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-[#3EE6B0]/20 bg-black/20 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="text-[#3EE6B0]" size={18} />

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#3EE6B0]">
            Malin sier
          </p>
        </div>

        <p className="text-lg font-bold text-white">{greeting}</p>

        <p className="mt-3 text-zinc-300">{getCoachMood()}</p>

        <p className="mt-3 text-zinc-400">
          Jeg hjelper deg med å forstå hva du gjør feil, forbedre svake områder
          og bestå teoriprøven raskere 🚗
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="text-red-300" size={20} />

            <h3 className="font-bold text-white">Fokusområde</h3>
          </div>

          <p className="text-sm text-zinc-300">{getRecommendation()}</p>

          <div className="mt-4 rounded-xl bg-black/20 px-4 py-3 font-bold text-red-200">
            {weakest.category} ({weakest.mastery_score}%)
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="text-yellow-300" size={20} />

            <h3 className="font-bold text-white">Sterkeste kategori</h3>
          </div>

          <p className="text-sm text-zinc-300">
            Du presterer best innen dette området. Dette kan du bygge videre på.
          </p>

          <div className="mt-4 rounded-xl bg-black/20 px-4 py-3 font-bold text-yellow-200">
            {strongest.category} ({strongest.mastery_score}%)
          </div>
        </div>

        <div className="rounded-2xl border border-[#3EE6B0]/20 bg-black/20 p-5 md:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="text-[#3EE6B0]" size={20} />

            <h3 className="font-bold text-white">Coach-analyse</h3>
          </div>

          <p className="mb-4 text-sm text-zinc-300">{getMotivation()}</p>

          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Smile className="text-cyan-300" size={18} />
                <p className="text-sm font-bold text-cyan-300">Humor</p>
              </div>

              <p className="text-sm text-zinc-300">{humor}</p>
            </div>

            <div className="rounded-2xl border border-orange-400/20 bg-orange-400/10 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Target className="text-orange-300" size={18} />
                <p className="text-sm font-bold text-orange-300">
                  Eksamensmodus
                </p>
              </div>

              <p className="text-sm text-zinc-300">{examTip}</p>
            </div>

            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Flame className="text-yellow-300" size={18} />
                <p className="text-sm font-bold text-yellow-300">Streak</p>
              </div>

              <p className="text-sm text-zinc-300">{streakMessage}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3">
              <span className="text-zinc-400">Total mastery:</span>

              <span className="ml-2 font-bold text-white">
                {overall.toFixed(0)}%
              </span>
            </div>

            <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3">
              <span className="text-zinc-400">XP:</span>

              <span className="ml-2 font-bold text-white">{xp}</span>
            </div>

            <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3">
              <span className="text-zinc-400">Rank:</span>

              <span className="ml-2 font-bold text-[#3EE6B0]">{rank}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}