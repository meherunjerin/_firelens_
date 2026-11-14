import { createContext, useContext } from "react";

export type Lang = "en" | "bn";
type Msg = string | ((...a: (string | number)[]) => string);
export const LangCtx = createContext<Lang>("en");

export const MONTHS: Record<Lang, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  bn: ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"],
};
export const SHORT: Record<Lang, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  bn: ["জানু", "ফেব", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"],
};

const D = (en: Msg, bn: Msg) => ({ en, bn });
export const DICT: Record<string, Record<Lang, Msg>> = {
  title1: D("Bangladesh", "বাংলাদেশের"), title2: D("burning calendar.", "অগ্নি-ক্যালেন্ডার।"),
  sub: D("MODIS and VIIRS merged into one VIIRS-equivalent history, compared with the median of the same month in earlier years.",
    "MODIS ও VIIRS মিলিয়ে একটি ধারাবাহিক ইতিহাস, এবং আগের বছরগুলোর একই মাসের মধ্যমানের সাথে তুলনা।"),
  eyebrow: D("Real data · NASA FIRMS", "প্রকৃত ডেটা · NASA FIRMS"), loading: D("Loading harmonized fire data…", "ডেটা লোড হচ্ছে…"),
  area: D("Area of interest", "নির্বাচিত এলাকা"), whole: D("Whole Bangladesh", "সমগ্র বাংলাদেশ"),
  divName: D((n) => `${n} division`, (n) => `${n} বিভাগ`), cellLabel: D((id) => `Grid cell ${id}`, (id) => `গ্রিড সেল ${id}`),
  custom: D("Custom bounds…", "নিজস্ব সীমা…"), customArea: D("Custom area", "নিজস্ব এলাকা"),
  north: D("north lat", "উত্তর অক্ষাংশ"), south: D("south lat", "দক্ষিণ অক্ষাংশ"), west: D("west lon", "পশ্চিম দ্রাঘিমা"), east: D("east lon", "পূর্ব দ্রাঘিমা"),
  cellsNote: D((n) => `${n} grid cells (0.25°). Each cell belongs to the division containing its centre point, so cells on a border are assigned to one side.`,
    (n) => `${n}টি গ্রিড সেল (০.২৫°)। প্রতিটি সেল তার কেন্দ্রবিন্দু যে বিভাগে পড়ে সেই বিভাগের অন্তর্ভুক্ত, তাই সীমান্তের সেল এক পাশে ধরা হয়।`),
  dateRange: D("Date range", "সময়সীমা"), from: D("From year", "শুরুর বছর"), to: D("To year", "শেষ বছর"),
  csv: D((n) => `Download CSV (${n} months)`, (n) => `CSV ডাউনলোড (${n} মাস)`), csvNote: D("Includes source flag, median, score and band.", "সূত্র, মধ্যমান, স্কোর ও ব্যান্ড সহ।"),
  whereBurns: D("Where it burns", "কোথায় আগুন"), layerCount: D("Detections", "হটস্পট"), layerZones: D("Zones", "জোন"),
  unitRange: D("detections in range", "নির্বাচিত সময়ের হটস্পট"), unitMonth: D("detections this month", "এই মাসের হটস্পট"),
  mapFew: D("few", "কম"), mapMany: D("many", "বেশি"), mapHint: D("Click a cell or a division name to analyse it.", "বিশ্লেষণ করতে সেল বা বিভাগের নামে ক্লিক করুন।"),
  mapDet: D((n) => `${n} detections`, (n) => `${n}টি হটস্পট`), mapBorder: D("Border area", "সীমান্ত এলাকা"),
  tmBtn: D("Time Machine", "টাইম মেশিন"), pause: D("Pause", "থামান"), speed: D("Playback speed", "চালানোর গতি"),
  rangeTotal: D("Range total", "সময়সীমার মোট"), showTotal: D("Show range total", "মোট দেখুন"), tmSlider: D("Time Machine month", "টাইম মেশিন মাস"),
  tmNote: D((a) => `Colors use one fixed scale across all months, so quiet months look dark. The line shows ${a}.`,
    (a) => `সব মাসে একই রঙের স্কেল ব্যবহার হয়েছে, তাই কম আগুনের মাস গাঢ় দেখায়। রেখাটি ${a}-এর।`),
  calTitle: D("Burning calendar · harmonized detections per month", "অগ্নি-ক্যালেন্ডার · মাসিক সমন্বিত হটস্পট"), median: D("Median", "মধ্যমান"),
  calFew: D("few", "কম"), calMany: D("many (log scale)", "বেশি (লগ স্কেল)"), calCal: D("calibrated from MODIS (lower confidence)", "MODIS থেকে ক্যালিব্রেটেড (কম আস্থা)"),
  calHint: D("Click a month to inspect it.", "বিস্তারিত দেখতে মাসে ক্লিক করুন।"), calTip: D("calibrated from MODIS", "MODIS থেকে ক্যালিব্রেটেড"),
  isNormal: D((a, m, y) => `${a} · is ${m} ${y} normal?`, (a, m, y) => `${a} · ${m} ${y} কি স্বাভাবিক?`),
  band_Normal: D("Normal", "স্বাভাবিক"), band_Elevated: D("Elevated", "বেশি"), band_Extreme: D("Extreme", "অতিরিক্ত"),
  "band_Low activity": D("Low activity", "কম সক্রিয়"), "band_No baseline": D("No baseline", "তুলনার ইতিহাস নেই"),
  meterNormal: D("Normal < 1.5", "স্বাভাবিক < 1.5"), meterElev: D("Elevated 1.5–3", "বেশি 1.5–3"), meterExt: D("Extreme ≥ 3", "অতিরিক্ত ≥ 3"),
  whyLabel: D("Why flagged?", "কেন চিহ্নিত?"),
  whyNoBase: D((m, n) => `Not enough history for ${m} (needs ${n} earlier years).`, (m, n) => `${m}-এর জন্য যথেষ্ট ইতিহাস নেই (আগের ${n} বছর লাগে)।`),
  whyLow: D((n, m, med) => `Only ${n} detections in ${m}; too few to judge. Typical is about ${med}.`, (n, m, med) => `${m} মাসে মাত্র ${n}টি হটস্পট; বিচার করার জন্য কম। সাধারণত প্রায় ${med}টি।`),
  whyNormal: D((x, m) => `${x}x the median for ${m}; within the normal range.`, (x, m) => `${m}-এর মধ্যমানের ${x} গুণ; স্বাভাবিক সীমার মধ্যে।`),
  whyFlag: D((x, m, r, of) => `${x}x the median for ${m}; rank ${r} of ${of} years.`, (x, m, r, of) => `${m}-এর মধ্যমানের ${x} গুণ; ${of} বছরের মধ্যে ${r} নম্বর।`),
  caveat: D((n) => `Counts are satellite hotspots, not fire size or damage; they include agricultural burning. Months with fewer than ${n} detections are labelled “Low activity”.`,
    (n) => `এগুলো স্যাটেলাইট হটস্পটের সংখ্যা, আগুনের আকার বা ক্ষতি নয়; কৃষি-পোড়ানোও এতে ধরা পড়ে। ${n}টির কম হটস্পটের মাসকে “কম সক্রিয়” বলা হয়েছে।`),
  detections: D("Detections", "হটস্পট"), medianOf: D((m) => `Median ${m}`, (m) => `${m}-এর মধ্যমান`), xMedian: D("× median", "মধ্যমানের গুণ"),
  score: D("Score", "স্কোর"), rank: D("Rank in history", "ইতিহাসে অবস্থান"), rankVal: D((r, of) => `${r} of ${of}`, (r, of) => `${of}-এর মধ্যে ${r}`),
  confidence: D("Confidence", "আস্থা"), conf_High: D("High", "উচ্চ"), conf_Medium: D("Medium", "মধ্যম"), conf_Low: D("Low", "নিম্ন"),
  calNote: D((c) => `Calibrated from MODIS (before ${c}).`, (c) => `MODIS থেকে ক্যালিব্রেট করা (${c}-এর আগে)।`), obsNote: D("Directly observed by VIIRS.", "সরাসরি VIIRS-এর পর্যবেক্ষণ।"),
  zonesTitle: D("Recurring and emerging zones", "পুনরাবৃত্ত ও উদীয়মান জোন"),
  zk_recurring: D("Recurring", "পুনরাবৃত্ত"), zk_emerging: D("Emerging", "উদীয়মান"), zk_both: D("Both", "দুটোই"), zk_none: D("Other", "অন্যান্য"), zk_unknown: D("Not enough years", "যথেষ্ট বছর নেই"),
  zStatRec: D("Recurring cells", "পুনরাবৃত্ত সেল"), zStatEmg: D("Emerging cells", "উদীয়মান সেল"), zSeason: D("Fire season", "আগুনের মৌসুম"),
  zNote: D((s, y) => `Season = ${s} (the busiest 3 months nationwide, ${y} full years). Recurring = at least 3 detections in the season in 80% of years. Emerging = last 3 years at least 2× the cell's earlier median (needs 8+ years).`,
    (s, y) => `মৌসুম = ${s} (সারা দেশে সবচেয়ে বেশি আগুনের ৩ মাস, ${y}টি পূর্ণ বছর)। পুনরাবৃত্ত = ৮০% বছরে মৌসুমে অন্তত ৩টি হটস্পট। উদীয়মান = শেষ ৩ বছর সেলের আগের মধ্যমানের অন্তত ২ গুণ (৮+ বছর লাগে)।`),
  zTopEmg: D("Fastest-rising cells", "দ্রুত বাড়ছে এমন সেল"), zTopRec: D("Most persistent cells", "সবচেয়ে স্থায়ী সেল"),
  zEmgItem: D((d, r) => `${d} · ${r}× earlier median`, (d, r) => `${d} · আগের মধ্যমানের ${r} গুণ`),
  zRecItem: D((d, a, y) => `${d} · ${a} of ${y} years`, (d, a, y) => `${d} · ${y} বছরের ${a}টিতে`),
  zNoneFound: D("No cells meet this rule in the selected years.", "নির্বাচিত বছরগুলোতে কোনো সেল এই শর্ত পূরণ করেনি।"),
  zDisclaimer: D("Decision support only: zones come from satellite hotspot counts and mix farming burns with wildfires. They help monitoring, not official decisions.",
    "শুধু সহায়ক তথ্য: জোনগুলো স্যাটেলাইট হটস্পট থেকে নেওয়া এবং এতে কৃষিকাজের আগুনও আছে। এটি পর্যবেক্ষণে সাহায্য করে, সরকারি সিদ্ধান্তের বিকল্প নয়।"),
  fpTitle: D("Fire Fingerprint", "ফায়ার ফিঙ্গারপ্রিন্ট"),
  fpSub: D("The shape of a place's fire season. Each line is scaled to its own peak, so places of different size can be compared.", "কোনো জায়গার আগুনের মৌসুমের আকৃতি। প্রতিটি রেখা নিজ নিজ সর্বোচ্চ মান অনুযায়ী মাপা, তাই ছোট-বড় এলাকা তুলনা করা যায়।"),
  fpTypical: D((a, b) => `Typical (${a}–${b})`, (a, b) => `সাধারণ (${a}–${b})`), fpYear: D((y) => `Year ${y}`, (y) => `${y} সাল`),
  fpCompare: D("Compare with", "তুলনা করুন"), fpNone: D("None", "কিছু নয়"),
  fpPeak: D((m, s, w) => `Peaks in ${m}; ${s}% of detections fall in ${w}.`, (m, s, w) => `সর্বোচ্চ ${m} মাসে; ${s}% হটস্পট ${w}-এর মধ্যে।`),
  methodTitle: D("Method · how MODIS and VIIRS were harmonized", "পদ্ধতি · MODIS ও VIIRS কীভাবে মেলানো হয়েছে"),
  m1: D("Keep vegetation fires only (type = 0) with nominal/high confidence; count per 0.25° cell per month.", "শুধু উদ্ভিদের আগুন (type = 0) এবং স্বাভাবিক/উচ্চ আস্থার হটস্পট রাখা হয়; প্রতি ০.২৫° সেলে মাসভিত্তিক গণনা।"),
  m2: D("On the overlap period, learn how many VIIRS detections correspond to one MODIS detection, separately for each calendar month.", "দুই সেন্সরের যৌথ সময়ে শেখা হয় একটি MODIS হটস্পটের বিপরীতে কয়টি VIIRS হটস্পট পাওয়া যায়, প্রতিটি ক্যালেন্ডার মাসের জন্য আলাদা করে।"),
  m3: D((c) => `Before ${c}, use MODIS × that ratio (flagged “calibrated”); afterwards use VIIRS directly.`, (c) => `${c}-এর আগে MODIS × সেই অনুপাত (“ক্যালিব্রেটেড” চিহ্নিত); পরে সরাসরি VIIRS।`),
  m4: D("Score = (log(1+count) − median of the same month in earlier years) ÷ max(1.4826 × MAD, 0.35). Elevated ≥ 1.5, Extreme ≥ 3, at least 5 earlier years.",
    "স্কোর = (log(1+সংখ্যা) − আগের বছরগুলোর একই মাসের মধ্যমান) ÷ max(1.4826 × MAD, 0.35)। বেশি ≥ 1.5, অতিরিক্ত ≥ 3, অন্তত ৫ বছরের ইতিহাস লাগে।"),
  vR2: D("R² (held-out years)", "R² (লুকানো বছরে)"), vMae: D("Mean abs. error / mo", "মাসিক গড় ত্রুটি"), vBias: D("Bias", "পক্ষপাত"), vR2Peak: D("R² Feb–Apr only", "R² (শুধু ফেব–এপ্রিল)"),
  vNote: D("Validation: calibrate on later years, predict VIIRS from MODIS alone for hidden earlier years. Seasonal peaks are the least accurate part.",
    "যাচাই: পরের বছরগুলো দিয়ে ক্যালিব্রেট করে, লুকানো আগের বছরগুলোর VIIRS শুধু MODIS থেকে অনুমান করা হয়েছে। মৌসুমি চূড়াগুলোই সবচেয়ে কম নির্ভুল।"),
  vMissing: D("Add validation.json to public/data/ to show validation numbers.", "যাচাইয়ের সংখ্যা দেখাতে public/data/-তে validation.json যোগ করুন।"),
  series: D("Data layer", "ডেটা স্তর"), serHarm: D("Harmonized", "সমন্বিত"), serModis: D("Raw MODIS", "কাঁচা MODIS"), serViirs: D("Raw VIIRS", "কাঁচা VIIRS"),
  serHint: D("Re-export monthly_cells.json from Colab with modis and viirs columns to enable the raw layers.", "কাঁচা স্তর চালু করতে Colab থেকে modis ও viirs কলামসহ monthly_cells.json আবার এক্সপোর্ট করুন।"),
  serFrp: D("Fire power (FRP)", "আগুনের তাপ-শক্তি (FRP)"), frpLabel: D("FRP (MW)", "FRP (মেগাওয়াট)"),
  whyLowFrp: D((n, m, med) => `Only ${n} MW of fire radiative power in ${m}; too little to judge. Typical is about ${med} MW.`, (n, m, med) => `${m} মাসে মাত্র ${n} মেগাওয়াট তাপ-শক্তি; বিচার করার জন্য কম। সাধারণত প্রায় ${med} মেগাওয়াট।`),
  staticToggle: D((n) => `Show excluded static heat sources (${n} detections)`, (n) => `বাদ দেওয়া স্থির তাপ-উৎস দেখান (${n}টি)`),
  staticNone: D("No static heat sources (gas flares, industry) were found in this data.", "এই ডেটায় কোনো স্থির তাপ-উৎস (গ্যাস ফ্লেয়ার, শিল্প) পাওয়া যায়নি।"),
  staticNote: D("Static sources are excluded from every score and calendar. Shown here only for transparency.", "স্থির উৎস কোনো স্কোর বা ক্যালেন্ডারে ধরা হয়নি; স্বচ্ছতার জন্য এখানে দেখানো।"),
  wlTitle: D("Priority watchlist", "অগ্রাধিকার নজরদারি তালিকা"),
  wlSub: D((m, y) => `Divisions ranked by anomaly for ${m} ${y}. Decision support for monitoring only, not an official fire-management decision.`, (m, y) => `${m} ${y}-এর অস্বাভাবিকতা অনুযায়ী বিভাগের র‍্যাঙ্ক। শুধু পর্যবেক্ষণে সহায়ক, সরকারি অগ্নি-ব্যবস্থাপনা সিদ্ধান্তের বিকল্প নয়।`),
  whyTrend: D((a, b, c) => `Same month, last 3 years: ${a}× → ${b}× → ${c}× the median.`, (a, b, c) => `একই মাস, শেষ ৩ বছর: মধ্যমানের ${a} গুণ → ${b} গুণ → ${c} গুণ।`),
  whyTop: D((n, s) => `Biggest contributor: ${n} (${s}% of detections).`, (n, s) => `সবচেয়ে বড় অবদান: ${n} (${s}% হটস্পট)।`),
  cnYears: D((n) => `${n} earlier years of history`, (n) => `আগের ${n} বছরের ইতিহাস`), cnCal: D("calibrated from MODIS (less certain)", "MODIS থেকে ক্যালিব্রেটেড (কম নিশ্চিত)"),
  cnSmall: D((n) => `small area (${n} cells), lowered one level`, (n) => `ছোট এলাকা (${n}টি সেল), এক ধাপ কমানো হয়েছে`),
  cnAgree: D((r) => `MODIS and VIIRS agree (r = ${r})`, (r) => `MODIS ও VIIRS মিলছে (r = ${r})`), cnDisagree: D((r) => `MODIS and VIIRS agree weakly (r = ${r}), lowered one level`, (r) => `MODIS ও VIIRS কম মিলছে (r = ${r}), এক ধাপ কমানো হয়েছে`),
  confBasis: D("Confidence based on", "আস্থার ভিত্তি"),
  repBtn: D("Area report (PDF)", "এলাকা রিপোর্ট (PDF)"), linkBtn: D("Copy share link", "শেয়ার লিংক কপি"), linkCopied: D("Link copied", "লিংক কপি হয়েছে"),
  repTitle: D("FireLens area report", "ফায়ারলেন্স এলাকা রিপোর্ট"),
  repLimits: D("Hotspot counts are not fire size, danger or damage. They include agricultural burns and industrial heat, and satellites pass only a few times a day, so small or short fires can be missed. Calibrated years (MODIS-based) are less certain than directly observed ones.",
    "হটস্পটের সংখ্যা আগুনের আকার, ঝুঁকি বা ক্ষতি নয়। এতে কৃষি-পোড়ানো ও শিল্পের তাপও ধরা পড়ে, আর স্যাটেলাইট দিনে মাত্র কয়েকবার পাস করে, তাই ছোট বা স্বল্পস্থায়ী আগুন বাদ পড়তে পারে। ক্যালিব্রেটেড (MODIS-ভিত্তিক) বছরগুলো সরাসরি পর্যবেক্ষণের চেয়ে কম নিশ্চিত।"),
  repSource: D("Data: NASA FIRMS (MODIS Collection 6.1 and VIIRS 375 m). Method: monthly counts per 0.25° cell; MODIS converted to a VIIRS-equivalent with monthly ratios learned on the overlap period; anomaly = robust log-scale score against the same month in earlier years.",
    "ডেটা: NASA FIRMS (MODIS কালেকশন 6.1 ও VIIRS 375 m)। পদ্ধতি: প্রতি ০.২৫° সেলে মাসভিত্তিক গণনা; যৌথ সময়ে শেখা মাসভিত্তিক অনুপাতে MODIS-কে VIIRS-সমতুল্য করা; অস্বাভাবিকতা = আগের বছরগুলোর একই মাসের সাথে লগ-স্কেলের শক্তিশালী স্কোর।"),
  indep: D("FireLens is an independent project using NASA FIRMS data. It is not an official NASA product.", "ফায়ারলেন্স NASA FIRMS ডেটা ব্যবহার করা একটি স্বাধীন প্রকল্প। এটি NASA-র অফিসিয়াল পণ্য নয়।"),
  dgModis: D("MODIS monthly counts", "MODIS মাসিক গণনা"), dgViirs: D("VIIRS monthly counts", "VIIRS মাসিক গণনা"),
  dgRatio: D("Overlap period: learn the monthly MODIS → VIIRS ratio", "যৌথ সময়: মাসভিত্তিক MODIS → VIIRS অনুপাত শেখা"),
  dgConvert: D((c) => `Before ${c}: MODIS × ratio (calibrated). From ${c}: VIIRS (observed)`, (c) => `${c}-এর আগে: MODIS × অনুপাত (ক্যালিব্রেটেড)। ${c} থেকে: VIIRS (পর্যবেক্ষিত)`),
  dgOne: D("One harmonized series + uncertainty flag", "একটি সমন্বিত সিরিজ + অনিশ্চয়তার চিহ্ন"),
  div_Dhaka: D("Dhaka", "ঢাকা"), div_Chattogram: D("Chattogram", "চট্টগ্রাম"), div_Sylhet: D("Sylhet", "সিলেট"), div_Rajshahi: D("Rajshahi", "রাজশাহী"),
  div_Rangpur: D("Rangpur", "রংপুর"), div_Khulna: D("Khulna", "খুলনা"), div_Barishal: D("Barishal", "বরিশাল"), div_Mymensingh: D("Mymensingh", "ময়মনসিংহ"),
};

export const tr = (lang: Lang, key: string, ...a: (string | number)[]): string => {
  const v = DICT[key]?.[lang];
  return v === undefined ? key : typeof v === "function" ? v(...a) : v;
};
export function useT() {
  const lang = useContext(LangCtx);
  const t = (key: string, ...a: (string | number)[]) => tr(lang, key, ...a);
  return { t, lang, dn: (name: string) => tr(lang, `div_${name}`) };
}
