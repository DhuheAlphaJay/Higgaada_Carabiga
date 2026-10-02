const MARKS = /[\u0640\u064B-\u0652\u0670]/g;

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

type SpeakOptions = {
  queue?: boolean;
  onEnd?: () => void;
};

const retainedUtterances: SpeechSynthesisUtterance[] = [];

function bareLetter(token: string) {
  return token.replace(MARKS, "");
}

export function arabicLetterName(token: string) {
  const bare = bareLetter(token);
  return LETTER_NAMES[bare] ?? LETTER_NAMES[token] ?? token;
}

/** Syllable when the token has vowels, otherwise the letter's Arabic name. */
export function arabicLetterSound(token: string) {
  const bare = bareLetter(token);
  const syllable = token.replace(/\u0640/g, "").trim();
  if (syllable !== bare) return syllable;
  return LETTER_NAMES[bare] ?? syllable;
}

function bestArabicVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  const arabic = voices.filter((voice) => voice.lang.toLowerCase().startsWith("ar"));
  return (
    arabic.find((voice) => PREFERRED_VOICES.some((name) => voice.name.toLowerCase().includes(name))) ??
    arabic.find((voice) => voice.lang.toLowerCase().startsWith("ar-sa")) ??
    arabic[0] ??
    null
  );
}

function configure(utterance: SpeechSynthesisUtterance) {
  utterance.lang = "ar-SA";
  utterance.rate = 0.85;
  const voice = bestArabicVoice();
  if (voice) utterance.voice = voice;
}

export function speakArabic(text: string, options?: SpeakOptions) {
  speakSequence([text], options);
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
      lines.forEach((line, index) => {
        const utterance = new SpeechSynthesisUtterance(line);
        configure(utterance);
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

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    window.speechSynthesis.getVoices();
  });
}
