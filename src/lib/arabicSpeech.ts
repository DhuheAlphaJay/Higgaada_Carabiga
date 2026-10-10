import { pacedSpeech, spokenSyllable } from "@/lib/data/curriculum";

/** Spoken Arabic names so each letter is clear for children. */
const LETTER_NAMES: Record<string, string> = {
  ا: "أَلِف",
  أ: "أَلِف",
  إ: "أَلِف",
  آ: "أَلِف",
  ب: "بَاء",
  ت: "تَاء",
  ث: "ثَاء",
  ج: "جِيم",
  ح: "حَاء",
  خ: "خَاء",
  د: "دَال",
  ذ: "ذَال",
  ر: "رَاء",
  ز: "زَاي",
  س: "سِين",
  ش: "شِين",
  ص: "صَاد",
  ض: "ضَاد",
  ط: "طَاء",
  ظ: "ظَاء",
  ع: "عَيْن",
  غ: "غَيْن",
  ف: "فَاء",
  ق: "قَاف",
  ك: "كَاف",
  ل: "لاَم",
  م: "مِيم",
  ن: "نُون",
  ه: "هَاء",
  و: "وَاو",
  ي: "يَاء",
  ى: "يَاء",
};

const PREFERRED_VOICES = ["maged", "tarik", "laila", "zeina", "naayf", "hoda"];

export const TRY_AGAIN = "حَاوِلْ مَرَّةً أُخْرَى!";
export const PRAISE = "أَحْسَنْت! مُمْتَاز!";
export const WRITING_PRAISE = "أَحْسَنْتَ كِتَابَةً! مُمْتَاز!";

type SpeakOptions = {
  queue?: boolean;
  onEnd?: () => void;
  rate?: number;
};

const retainedUtterances: SpeechSynthesisUtterance[] = [];
const MARKS = /[\u0640\u064B-\u0652\u0670]/g;

function bareLetter(token: string) {
  return token.replace(MARKS, "");
}

export function arabicLetterName(token: string) {
  const bare = bareLetter(token);
  return LETTER_NAMES[bare] ?? LETTER_NAMES[token] ?? token;
}

/** Syllable when the token has vowels, otherwise a long madd or the letter name. */
export function arabicLetterSound(token: string) {
  const bare = bareLetter(token);
  const syllable = spokenSyllable(token);
  if (syllable !== bare) return syllable;
  if (bare === "ا" || bare === "أ" || bare === "آ" || bare === "إ") return "آ";
  if (bare === "و") return "أُو";
  if (bare === "ي" || bare === "ى") return "إِي";
  return LETTER_NAMES[bare] ?? syllable;
}

function langOf(voice: SpeechSynthesisVoice) {
  return voice.lang.toLowerCase().replace(/_/g, "-");
}

function isArabicVoice(voice: SpeechSynthesisVoice) {
  const lang = langOf(voice);
  const name = voice.name.toLowerCase();
  if (lang === "ar" || lang.startsWith("ar-")) return true;
  const branded = name.includes("google") || name.includes("apple") || name.includes("siri");
  return branded && (name.includes("arab") || name.includes("arabic"));
}

function voiceRank(voice: SpeechSynthesisVoice) {
  if (!isArabicVoice(voice)) return 0;
  const lang = langOf(voice);
  const name = voice.name.toLowerCase();
  let rank = 1;
  if (lang.startsWith("ar-sa")) rank += 50;
  else if (lang === "ar") rank += 20;
  else rank += 10;
  if (PREFERRED_VOICES.some((item) => name.includes(item))) rank += 30;
  if (name.includes("google")) rank += 15;
  if (name.includes("apple") || name.includes("siri") || name.includes("premium") || name.includes("enhanced")) rank += 12;
  return rank;
}

function bestArabicVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  let best: SpeechSynthesisVoice | null = null;
  let bestRank = 0;
  voices.forEach((voice) => {
    const rank = voiceRank(voice);
    if (rank > bestRank) {
      best = voice;
      bestRank = rank;
    }
  });
  return best;
}

function configure(utterance: SpeechSynthesisUtterance, rate = 0.75) {
  utterance.lang = "ar-SA";
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 1;
  const voice = bestArabicVoice();
  if (voice) utterance.voice = voice;
}

export function speakArabic(text: string, options?: SpeakOptions) {
  speakSequence([text], options);
}

export function speakVocalized(letters: readonly string[], fallback: string) {
  speakArabic(pacedSpeech(letters, fallback), { rate: 0.75 });
}

export function speakSequence(phrases: string[], options?: SpeakOptions) {
  const lines = phrases.map((phrase) => phrase.trim()).filter(Boolean);
  if (typeof window === "undefined" || !("speechSynthesis" in window) || lines.length === 0) {
    options?.onEnd?.();
    return;
  }

  try {
    const synth = window.speechSynthesis;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      options?.onEnd?.();
    };

    const start = () => {
      const synthNow = window.speechSynthesis;
      if (synthNow.getVoices().length === 0) {
        let began = false;
        const begin = () => {
          if (began) return;
          began = true;
          synthNow.removeEventListener("voiceschanged", begin);
          speakLines();
        };
        synthNow.addEventListener("voiceschanged", begin);
        window.setTimeout(begin, 250);
        return;
      }
      speakLines();

      function speakLines() {
      lines.forEach((line, index) => {
        const utterance = new SpeechSynthesisUtterance(line);
        configure(utterance, options?.rate);
        if (index === lines.length - 1) {
          utterance.onend = finish;
          utterance.onerror = (event) => {
            if (event.error === "interrupted" || event.error === "canceled") return;
            finish();
          };
        }
        retainedUtterances.push(utterance);
        if (retainedUtterances.length > 8) retainedUtterances.shift();
        synth.speak(utterance);
      });
      }
    };

    if (!options?.queue && (synth.speaking || synth.pending)) {
      synth.cancel();
      window.setTimeout(start, 60);
      return;
    }

    start();
  } catch {
    options?.onEnd?.();
  }
}

export function speakLetterName(token: string) {
  speakArabic(arabicLetterName(token));
}

export function speakLetterSound(token: string) {
  speakArabic(arabicLetterSound(token));
}

export function speakTryAgain() {
  speakArabic(TRY_AGAIN);
}

export function speakPraise(onEnd?: () => void) {
  speakArabic(PRAISE, { onEnd });
}

export function speakWritingPraise() {
  speakArabic(WRITING_PRAISE);
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    window.speechSynthesis.getVoices();
  });
}
