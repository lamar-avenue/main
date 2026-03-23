export type MediaBlock =
  | { type: "text"; value: string }
  | { type: "image"; src: string; alt?: string }
  | { type: "audio"; src: string; title?: string }
  | { type: "video"; src: string; title?: string; poster?: string; pauseAt?: number }
  | { type: "youtube"; id: string; title?: string };

export type QuestStep = {
  id: string;
  title: string;
  blocks?: MediaBlock[];
  prompt: string;
  answer: string | string[];
  answerMode?: "exact" | "contains" | "keywords";
  keywords?: string[];
  choices?: string[];
  hint?: string;
};

export const quest: QuestStep[] = [
  {
    id: "1",
    title: "РЁР°Рі 1 - Р Р°Р·РјРёРЅРєР°",
    blocks: [{ type: "text", value: "Р”РѕР±СЂРѕ РїРѕР¶Р°Р»РѕРІР°С‚СЊ. Р­С‚Рѕ С‚РµСЃС‚РѕРІС‹Р№ С€Р°Рі." }],
    prompt: "Р’РІРµРґРё РєРѕРґРѕРІРѕРµ СЃР»РѕРІРѕ:",
    answer: ["mark", "РјР°СЂРєРѕ", "РјР°СЂРє"],
    choices: ["mark", "john", "hello"],
    hint: "РџРѕРґСЃРєР°Р·РєР°: РёРјСЏ.",
  },
  {
    id: "2",
    title: "РЁР°Рі 2 - РљР°СЂС‚РёРЅРєР°",
    blocks: [{ type: "image", src: "/media/images/step2.jpg", alt: "РЁР°Рі 2" }],
    prompt: "Р§С‚Рѕ РёР·РѕР±СЂР°Р¶РµРЅРѕ РЅР° РєР°СЂС‚РёРЅРєРµ? (РѕРґРЅРѕ СЃР»РѕРІРѕ)",
    answerMode: "exact",
    answer: ["РјР°С€РёРЅР°", "car"],
    choices: ["РјР°С€РёРЅР°", "РІРµР»РѕСЃРёРїРµРґ", "РґРѕРј"],
  },
  {
    id: "3",
    title: "РЁР°Рі 3 - РњСѓР·С‹РєР°",
    blocks: [{ type: "audio", src: "/media/audio/scene/step3.mp3", title: "РўСЂРµРє" }],
    prompt: "РљР°РєРѕРµ РЅР°СЃС‚СЂРѕРµРЅРёРµ Сѓ С‚СЂРµРєР°? (РѕРґРЅРѕ СЃР»РѕРІРѕ)",
    answerMode: "contains",
    answer: ["РіСЂСѓСЃС‚СЊ", "СЂР°РґРѕСЃС‚СЊ", "С‚СЂРµРІРѕРіР°"],
    choices: ["С‡СѓРІСЃС‚РІСѓРµС‚СЃСЏ РіСЂСѓСЃС‚СЊ", "СЏСЂРєР°СЏ СЂР°РґРѕСЃС‚СЊ", "РїРѕР»РЅР°СЏ С‚СЂРµРІРѕРіР°"],
  },
  {
    id: "4",
    title: "РЁР°Рі 4 - Р’РёРґРµРѕ",
    blocks: [{ type: "video", src: "/media/video/step4.mp4", title: "РЎС†РµРЅР°", pauseAt: 2.8 }],
    prompt: "Р§С‚Рѕ Р±СѓРґРµС‚ РЅР° РІРёРґРµРѕ РґР°Р»СЊС€Рµ? (РєРѕСЂРѕС‚РєРѕ)",
    answerMode: "keywords",
    answer: ["РѕРЅ РїРѕРІРµСЂРЅРµС‚", "РѕРЅ РїРѕРІРµСЂРЅС‘С‚", "РїРѕРІРѕСЂРѕС‚"],
    keywords: ["РѕРЅ", "РїРѕРІРµСЂРЅРµС‚"],
    choices: ["РѕРЅ РїРѕРІРµСЂРЅРµС‚ РЅР°РїСЂР°РІРѕ", "РѕРЅ РѕСЃС‚Р°РЅРѕРІРёС‚СЃСЏ", "Р±СѓРґРµС‚ РїРѕРІРѕСЂРѕС‚"],
    hint: "РЎРјРѕС‚СЂРё РЅР° РґРІРёР¶РµРЅРёРµ РєР°РјРµСЂС‹.",
  },
];
