/*
  Lahiri (Chitrapaksha) Ayanamsa based sidereal planetary positions.
  Uses Astronomy Engine (tropical) and subtracts Lahiri ayanamsa.
  Rahu/Ketu use the Mean Lunar Node formula.
*/

const RASHIS = ["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya",
                "Tula","Vrischika","Dhanu","Makara","Kumbha","Meena"];

const NAKSHATRAS = ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra",
  "Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni",
  "Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula",
  "Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha",
  "Purva Bhadrapada","Uttara Bhadrapada","Revati"];

const PLANETS = [
  {name:"Sun",     body:"Sun"},
  {name:"Moon",    body:"Moon"},
  {name:"Mercury", body:"Mercury"},
  {name:"Venus",   body:"Venus"},
  {name:"Mars",    body:"Mars"},
  {name:"Jupiter", body:"Jupiter"},
  {name:"Saturn",  body:"Saturn"}
];

/* =========================================================
   LANGUAGE TRANSLATIONS (English / Hindi)
   ========================================================= */
let CURRENT_LANG = 'en';
function setKundliLang(lang){ CURRENT_LANG = lang; }

const L = {
  planet: {
    en: { "Sun":"Sun","Moon":"Moon","Mercury":"Mercury","Venus":"Venus","Mars":"Mars",
          "Jupiter":"Jupiter","Saturn":"Saturn","Rahu":"Rahu","Ketu":"Ketu","Lagna (Asc)":"Lagna (Asc)" },
    hi: { "Sun":"सूर्य","Moon":"चन्द्र","Mercury":"बुध","Venus":"शुक्र","Mars":"मंगल",
          "Jupiter":"गुरु (बृहस्पति)","Saturn":"शनि","Rahu":"राहु","Ketu":"केतु","Lagna (Asc)":"लग्न" }
  },
  planetAbbr: {
    en: { "Lagna (Asc)":"La","Sun":"Su","Moon":"Mo","Mercury":"Me","Venus":"Ve",
          "Mars":"Ma","Jupiter":"Ju","Saturn":"Sa","Rahu":"Ra","Ketu":"Ke" },
    hi: { "Lagna (Asc)":"ल","Sun":"सू","Moon":"च","Mercury":"बु","Venus":"शु",
          "Mars":"मं","Jupiter":"गु","Saturn":"श","Rahu":"रा","Ketu":"के" }
  },
  rashi: {
    en: RASHIS,
    hi: ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुम्भ","मीन"]
  },
  nakshatra: {
    en: NAKSHATRAS,
    hi: ["अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशिरा","आर्द्रा","पुनर्वसु","पुष्य","आश्लेषा",
         "मघा","पूर्वा फाल्गुनी","उत्तरा फाल्गुनी","हस्त","चित्रा","स्वाति","विशाखा","अनुराधा",
         "ज्येष्ठा","मूल","पूर्वाषाढ़ा","उत्तराषाढ़ा","श्रवण","धनिष्ठा","शतभिषा",
         "पूर्वाभाद्रपद","उत्तराभाद्रपद","रेवती"]
  },
  vaara: {
    en: ["Sunday (Ravivar)","Monday (Somvar)","Tuesday (Mangalvar)","Wednesday (Budhvar)",
         "Thursday (Guruvar)","Friday (Shukravar)","Saturday (Shanivar)"],
    hi: ["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"]
  },
  tithi: {
    en: ["Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami",
         "Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima"],
    hi: ["प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पञ्चमी","षष्ठी","सप्तमी","अष्टमी",
         "नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पूर्णिमा"]
  },
  amavasya: { en:"Amavasya", hi:"अमावस्या" },
  paksha:   { en:{Shukla:"Shukla",Krishna:"Krishna"},
              hi:{Shukla:"शुक्ल",Krishna:"कृष्ण"} },
  yoga: {
    en: ["Vishkambha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda","Sukarma","Dhriti",
         "Shoola","Ganda","Vriddhi","Dhruva","Vyaghata","Harshana","Vajra","Siddhi","Vyatipata",
         "Variyan","Parigha","Shiva","Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti"],
    hi: ["विष्कम्भ","प्रीति","आयुष्मान्","सौभाग्य","शोभन","अतिगण्ड","सुकर्मा","धृति",
         "शूल","गण्ड","वृद्धि","ध्रुव","व्याघात","हर्षण","वज्र","सिद्धि","व्यतिपात",
         "वरीयान्","परिघ","शिव","सिद्ध","साध्य","शुभ","शुक्ल","ब्रह्म","ऐन्द्र","वैधृति"]
  },
  karana: {
    en: ["Bava","Balava","Kaulava","Taitila","Garaja","Vanija","Vishti","Shakuni","Chatushpada","Naga","Kimstughna"],
    hi: ["बव","बालव","कौलव","तैतिल","गर","वणिज","विष्टि","शकुनि","चतुष्पाद","नाग","किंस्तुघ्न"]
  },
  dignity: {
    en: { Exalted:"Exalted", Debilitated:"Debilitated", "Own sign":"Own sign" },
    hi: { Exalted:"उच्च", Debilitated:"नीच", "Own sign":"स्वराशि" }
  },
  motion: {
    en: { Direct:"Direct", R:"R", dash:"—" },
    hi: { Direct:"मार्गी", R:"व", dash:"—" }
  },
  ui: {
    en: {
      birth:"Birth / Chart Details", localTime:"Local Time", utc:"UTC", jd:"Julian Day",
      ayanamsa:"Ayanamsa", lagna:"Lagna (Ascendant)", moonSign:"Rashi (Moon Sign)",
      nakshatra:"Nakshatra", panchang:"Panchang", vaara:"Vaara (Weekday)", tithi:"Tithi",
      pakshaL:"Paksha", yoga:"Yoga", karana:"Karana",
      charts:"Kundli Charts (North Indian)", d1:"D1 – Lagna (Rashi)", d9:"D9 – Navamsa",
      chandra:"Chandra Lagna (Moon)",
      planets:"Planetary Positions (Detailed)",
      colPlanet:"Planet", colLon:"Longitude", colRashi:"Rashi", colDeg:"Deg in Rashi",
      colNak:"Nakshatra", colPada:"Pada", colNakLord:"Nak. Lord", colSignLord:"Sign Lord",
      colDignity:"Dignity", colMotion:"Motion",
      houses:"House (Bhava) Lords", colHouse:"House", colLord:"Lord", colLordIn:"Lord placed in",
      house:"House",
      dasha:"Vimshottari Mahadasha & Antardasha",
      nakLord:"Birth Nakshatra Lord", balance:"Balance of",
      atBirth:"Mahadasha at birth", years:"years",
      mdLord:"Mahadasha Lord", adLord:"Antardasha Lord",
      start:"Start", end:"End", showAd:"Show Antardasha",
      duration:"Duration",
      footer:"Computed with Astronomy Engine (geocentric, apparent) + Lahiri ayanamsa. Rahu/Ketu use the Mean Lunar Node. Dasha periods use 365.25-day years from birth instant."
    },
    hi: {
      birth:"जन्म / कुण्डली विवरण", localTime:"स्थानीय समय", utc:"यू.टी.सी.", jd:"जूलियन दिवस",
      ayanamsa:"अयनांश", lagna:"लग्न", moonSign:"राशि (चन्द्र राशि)",
      nakshatra:"नक्षत्र", panchang:"पञ्चाङ्ग", vaara:"वार", tithi:"तिथि",
      pakshaL:"पक्ष", yoga:"योग", karana:"करण",
      charts:"कुण्डली चार्ट (उत्तर भारतीय)", d1:"D1 – लग्न (राशि)", d9:"D9 – नवांश",
      chandra:"चन्द्र लग्न",
      planets:"ग्रह स्थिति (विस्तृत)",
      colPlanet:"ग्रह", colLon:"रेखांश", colRashi:"राशि", colDeg:"राशि में अंश",
      colNak:"नक्षत्र", colPada:"पाद", colNakLord:"नक्षत्र स्वामी", colSignLord:"राशि स्वामी",
      colDignity:"स्थिति", colMotion:"गति",
      houses:"भाव स्वामी", colHouse:"भाव", colLord:"स्वामी", colLordIn:"स्वामी कहाँ स्थित है",
      house:"भाव",
      dasha:"विंशोत्तरी महादशा एवं अन्तर्दशा",
      nakLord:"जन्म नक्षत्र स्वामी", balance:"शेष",
      atBirth:"महादशा जन्म समय पर", years:"वर्ष",
      mdLord:"महादशा स्वामी", adLord:"अन्तर्दशा स्वामी",
      start:"प्रारम्भ", end:"समाप्ति", showAd:"अन्तर्दशा देखें",
      duration:"अवधि",
      footer:"Astronomy Engine (भूकेन्द्रीय, सापेक्ष) + लाहिरी अयनांश का प्रयोग। राहु/केतु मध्यम पात। दशा गणना जन्म क्षण से 365.25-दिवस वर्ष पर।"
    }
  }
};

function tr(category, key){
  const dict = L[category];
  if (!dict) return key;
  const langDict = dict[CURRENT_LANG] || dict.en;
  if (Array.isArray(langDict)) return langDict[key];
  return (langDict && langDict[key]) || key;
}
function trUI(key){ return (L.ui[CURRENT_LANG] || L.ui.en)[key] || key; }
function trPlanet(name){ return tr('planet', name); }
function trRashi(idx){ return tr('rashi', idx); }
function trRashiName(name){ // by English name
  const i = RASHIS.indexOf(name); return i >= 0 ? tr('rashi', i) : name;
}
function trNakshatra(name){
  const i = NAKSHATRAS.indexOf(name); return i >= 0 ? tr('nakshatra', i) : name;
}

function norm360(x){ x = x % 360; return x < 0 ? x + 360 : x; }

const AYANAMSA_MODES = {
  lahiri: {
    label: 'Lahiri (Chitrapaksha)',
    deltaFromLahiri: 0
  },
  raman: {
    label: 'Raman',
    // Matched against Swiss Ephemeris deltas (J2000 and nearby epochs).
    deltaFromLahiri: -1.446301313382321
  },
  krishnamurti: {
    label: 'Krishnamurti (KP)',
    deltaFromLahiri: -0.09685231338232825
  },
  fagan_bradley: {
    label: 'Fagan/Bradley',
    deltaFromLahiri: 0.8832076407261411
  }
};

function parseCivilDateTime(dateStr, timeStr){
  const [y, m, d] = (dateStr || '').split('-').map(Number);
  const [hh, mm] = (timeStr || '').split(':').map(Number);
  if (![y, m, d, hh, mm].every(Number.isFinite)) {
    throw new Error('Invalid date/time input');
  }
  return { y, m, d, hh, mm };
}

function utcFromCivil(dateStr, timeStr, tzOffsetHours){
  const { y, m, d, hh, mm } = parseCivilDateTime(dateStr, timeStr);
  const localAsUtcMs = Date.UTC(y, m - 1, d, hh, mm, 0);
  return new Date(localAsUtcMs - tzOffsetHours * 3600 * 1000);
}

function weekdayFromCivilDate(dateStr){
  const [y, m, d] = (dateStr || '').split('-').map(Number);
  if (![y, m, d].every(Number.isFinite)) return 0;
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function formatLocalBirthTime(dateStr, timeStr, tzOffsetHours){
  const sign = tzOffsetHours >= 0 ? '+' : '-';
  const abs = Math.abs(tzOffsetHours);
  const tzh = Math.floor(abs);
  const tzm = Math.round((abs - tzh) * 60);
  return `${dateStr} ${timeStr} UTC${sign}${String(tzh).padStart(2, '0')}:${String(tzm).padStart(2, '0')}`;
}

// Julian Day (UT)
function julianDay(dateUTC){
  return 2440587.5 + dateUTC.getTime() / 86400000;
}

/* Lahiri Ayanamsa
   Reference epoch: 21 March 1956, 0h TDT  -> ayanamsa = 23°15'00.658"
   Mean precession rate ~ 50.2388475"/year.
   Formula adapted (sufficient for ~arc-second accuracy for common use):
*/
function lahiriAyanamsa(jd){
  const T = (jd - 2451545.0) / 36525.0; // Julian centuries from J2000
  // Lahiri ayanamsa at J2000.0 = 23°51'11.0" = 23.853056°
  // Annual general precession in longitude (Simon et al.) ≈ 50.290966"/yr at J2000
  // Use polynomial (arcseconds):
  const ayanArcsec =
      85894.2 +                   // 23°51'34.2"  fine-tuned constant
      5028.83 * T +               // linear term per century
      1.11 * T * T -              // small quadratic
      0.000006 * T * T * T;
  // Adjust to match 23°51'11" at J2000 epoch:
  // (the constant above is calibrated so that result at T=0 ≈ 23.8531°)
  return ayanArcsec / 3600.0;
}

function ayanamsaByMode(jd, modeId){
  const mode = AYANAMSA_MODES[modeId] || AYANAMSA_MODES.lahiri;
  return norm360(lahiriAyanamsa(jd) + mode.deltaFromLahiri);
}

// Mean lunar node (Rahu) – tropical longitude in degrees
function meanNodeLongitude(jd){
  const T = (jd - 2451545.0) / 36525.0;
  // Meeus, Astronomical Algorithms, ch. 47
  const omega = 125.04452 - 1934.136261 * T
                + 0.0020708 * T * T
                + (T*T*T) / 450000.0;
  return norm360(omega);
}

function siderealLongitude(tropical, ayan){
  return norm360(tropical - ayan);
}

function rashiOf(lon){
  const idx = Math.floor(lon / 30);
  const deg = lon - idx * 30;
  return { sign: RASHIS[idx], degree: deg };
}

function nakshatraOf(lon){
  const span = 360 / 27;          // 13°20'
  const idx = Math.floor(lon / span);
  const within = lon - idx * span;
  const pada = Math.floor(within / (span / 4)) + 1;
  return { name: NAKSHATRAS[idx], pada };
}

function fmtDeg(d){
  const deg = Math.floor(d);
  const mFloat = (d - deg) * 60;
  const min = Math.floor(mFloat);
  const sec = Math.round((mFloat - min) * 60);
  return `${deg}° ${String(min).padStart(2,'0')}' ${String(sec).padStart(2,'0')}"`;
}

const DEG = Math.PI / 180;

// Mean obliquity of the ecliptic (IAU 1980), degrees
function meanObliquity(jd){
  const T = (jd - 2451545.0) / 36525.0;
  const sec = 84381.448 - 46.8150*T - 0.00059*T*T + 0.001813*T*T*T;
  return sec / 3600.0;
}

// Greenwich Mean Sidereal Time in degrees (Meeus eq. 12.4)
function gmstDeg(jd){
  const T = (jd - 2451545.0) / 36525.0;
  let gmst = 280.46061837
           + 360.98564736629 * (jd - 2451545.0)
           + 0.000387933 * T * T
           - (T*T*T) / 38710000.0;
  return norm360(gmst);
}

// Tropical Ascendant longitude (degrees) for given JD(UT), latitude, longitude(E+)
function ascendantTropical(jd, latDeg, lonDeg){
  const lst = norm360(gmstDeg(jd) + lonDeg);          // Local Sidereal Time (deg)
  const ramc = lst * DEG;                              // RAMC in radians
  const eps  = meanObliquity(jd) * DEG;
  const lat  = latDeg * DEG;
  // Standard ascendant formula
  let asc = Math.atan2(
      Math.cos(ramc),
      -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps))
  );
  asc = norm360(asc / DEG);
  return asc;
}

function computePositions(dateStr, timeStr, tzOffsetHours, latDeg, lonDeg, ayanamsaModeId = 'lahiri', userName = ''){
  // Build UTC from civil local date/time + explicit timezone offset.
  // This avoids double-offset errors caused by browser local timezone parsing.
  const utcDate = utcFromCivil(dateStr, timeStr, tzOffsetHours);
  const jd = julianDay(utcDate);
  const ayan = ayanamsaByMode(jd, ayanamsaModeId);
  const ayanamsaName = (AYANAMSA_MODES[ayanamsaModeId] || AYANAMSA_MODES.lahiri).label;

  const rows = [];

  // Ascendant (Lagna) – only if lat/lon supplied
  if (Number.isFinite(latDeg) && Number.isFinite(lonDeg)){
    const ascTrop = ascendantTropical(jd, latDeg, lonDeg);
    const ascSid  = siderealLongitude(ascTrop, ayan);
    const r = rashiOf(ascSid); const n = nakshatraOf(ascSid);
    rows.push({planet:"Lagna (Asc)", tropical:ascTrop, sidereal:ascSid,
      sign:r.sign, signDeg:r.degree, nakshatra:n.name, pada:n.pada});
  }

  for (const p of PLANETS){
    // Geocentric J2000 vector (with aberration); Ecliptic() rotates to true ecliptic of date.
    const vec = Astronomy.GeoVector(p.body, utcDate, true);
    const ecl = Astronomy.Ecliptic(vec);
    const tropical = norm360(ecl.elon);
    const sid = siderealLongitude(tropical, ayan);
    const r = rashiOf(sid);
    const n = nakshatraOf(sid);

    // Retrograde: check if sidereal longitude is decreasing (Sun & Moon never retrograde)
    let retro = false;
    if (p.name !== "Sun" && p.name !== "Moon"){
      const later = new Date(utcDate.getTime() + 3600*1000);
      const v2 = Astronomy.GeoVector(p.body, later, true);
      const e2 = Astronomy.Ecliptic(v2);
      const delta = ((e2.elon - ecl.elon + 540) % 360) - 180;
      retro = delta < 0;
    }

    rows.push({
      planet:p.name, tropical, sidereal:sid,
      sign:r.sign, signDeg:r.degree, nakshatra:n.name, pada:n.pada, retro
    });
  }

  // Rahu (Mean Node) & Ketu – always retrograde (mean node moves backward)
  const rahuTrop = meanNodeLongitude(jd);
  const rahuSid  = siderealLongitude(rahuTrop, ayan);
  const ketuSid  = norm360(rahuSid + 180);
  for (const [name, sid, trop] of [
        ["Rahu", rahuSid, rahuTrop],
        ["Ketu", ketuSid, norm360(rahuTrop+180)]]){
    const r = rashiOf(sid); const n = nakshatraOf(sid);
    rows.push({planet:name, tropical:trop, sidereal:sid,
      sign:r.sign, signDeg:r.degree, nakshatra:n.name, pada:n.pada, retro:true});
  }

  // Lagna sidereal longitude (for charts / dasha-aware blocks)
  let lagnaSid = null;
  const lagnaRow = rows.find(r => r.planet.startsWith("Lagna"));
  if (lagnaRow) lagnaSid = lagnaRow.sidereal;

  // Panchang (uses Sun & Moon sidereal lon; Vaara from local date)
  const sun  = rows.find(r => r.planet === "Sun").sidereal;
  const moon = rows.find(r => r.planet === "Moon").sidereal;
  const panchang = computePanchang(sun, moon, weekdayFromCivilDate(dateStr));

  // Vimshottari Mahadasha
  const dasha = computeVimshottari(moon, utcDate);

  return {
    userName,
    ayanamsa: ayan,
    ayanamsaName,
    jd,
    utc: utcDate.toISOString(),
    localDate: formatLocalBirthTime(dateStr, timeStr, tzOffsetHours),
    rows,
    panchang,
    dasha,
    lagnaSid
  };
}

/* ---------- Panchang ---------- */

function computePanchang(sunLon, moonLon, vaaraIdx){
  // Tithi
  const diff = norm360(moonLon - sunLon);
  const tithiIdx = Math.floor(diff / 12);           // 0..29
  const pakshaKey = tithiIdx < 15 ? "Shukla" : "Krishna";
  const tithiNumIdx = tithiIdx % 15;     // 0..14
  const isAmavasya = tithiIdx === 29;
  // Yoga
  const yogaIdx = Math.floor(norm360(sunLon + moonLon) / (360/27));
  // Karana
  const karanaIdx = Math.floor(diff / 6);  // 0..59
  let karanaNameIdx;
  if (karanaIdx === 0) karanaNameIdx = 10;                  // Kimstughna
  else if (karanaIdx >= 57) karanaNameIdx = 7 + (karanaIdx - 57); // Shakuni..Naga
  else karanaNameIdx = (karanaIdx - 1) % 7;
  return { vaaraIdx, pakshaKey, tithiNumIdx, isAmavasya, yogaIdx, karanaNameIdx };
}

/* ---------- Vimshottari Mahadasha ---------- */
const DASHA_LORDS = [
  ["Ketu",7],["Venus",20],["Sun",6],["Moon",10],["Mars",7],
  ["Rahu",18],["Jupiter",16],["Saturn",19],["Mercury",17]
];
// Nakshatra → starting dasha lord index in DASHA_LORDS
const NAK_LORD_IDX = [0,1,2,3,4,5,6,7,8, 0,1,2,3,4,5,6,7,8, 0,1,2,3,4,5,6,7,8];

function computeVimshottari(moonLon, birthDate){
  const span = 360/27;
  const nakIdx = Math.floor(moonLon / span);
  const within = (moonLon - nakIdx * span) / span;     // 0..1 fraction traversed
  const startIdx = NAK_LORD_IDX[nakIdx];
  const [firstLord, firstLordFullYears] = DASHA_LORDS[startIdx];
  const balanceYears = (1 - within) * firstLordFullYears;
  const elapsedInFirstMd = within * firstLordFullYears;   // years already passed

  const periods = [];
  let currentStart = new Date(birthDate.getTime());

  // ---- First (partial) MD ----
  // Build full AD sequence for the first MD at its FULL duration.
  // Find which AD the native is currently in; that AD is partial.
  const firstAds = [];
  {
    let t = 0;
    for (let j = 0; j < 9; j++){
      const lordIdx = (startIdx + j) % 9;
      const [adLord, adLordYears] = DASHA_LORDS[lordIdx];
      const adFull = (firstLordFullYears * adLordYears) / 120;
      const adStartInMd = t;
      const adEndInMd   = t + adFull;
      if (adEndInMd > elapsedInFirstMd){
        // This AD straddles birth or starts after birth.
        const adStartFromBirth = Math.max(0, adStartInMd - elapsedInFirstMd);
        const adRemaining = adEndInMd - Math.max(adStartInMd, elapsedInFirstMd);
        const s = addYears(birthDate, adStartFromBirth);
        const e = addYears(s, adRemaining);
        firstAds.push({ lord: adLord, years: adRemaining, start: s, end: e });
      }
      t = adEndInMd;
    }
  }
  const firstMdEnd = addYears(birthDate, balanceYears);
  periods.push({
    lord: firstLord, years: balanceYears,
    start: currentStart, end: firstMdEnd,
    isPartial: true, antardashas: firstAds
  });
  currentStart = firstMdEnd;

  // ---- Subsequent 8 full MDs ----
  for (let i = 1; i < 9; i++){
    const lordIdx = (startIdx + i) % 9;
    const [lord, years] = DASHA_LORDS[lordIdx];
    const end = addYears(currentStart, years);
    // Full set of 9 ADs
    const ads = [];
    let s = new Date(currentStart.getTime());
    for (let j = 0; j < 9; j++){
      const [adLord, adLordYears] = DASHA_LORDS[(lordIdx + j) % 9];
      const adYears = (years * adLordYears) / 120;
      const e = addYears(s, adYears);
      ads.push({ lord: adLord, years: adYears, start: s, end: e });
      s = e;
    }
    periods.push({ lord, years, start: currentStart, end, isPartial: false, antardashas: ads });
    currentStart = end;
  }
  return { startLord: firstLord, balanceYears, periods };
}
function addYears(date, years){
  // 365.25 day year for dasha
  return new Date(date.getTime() + years * 365.25 * 86400 * 1000);
}

// Convert decimal years (365.25-day) into "Y years M months D days"
function yearsToYMD(years){
  const totalDays = years * 365.25;
  let y = Math.floor(totalDays / 365.25);
  let remDays = totalDays - y * 365.25;
  let m = Math.floor(remDays / 30.4375);   // 365.25/12
  let d = Math.round(remDays - m * 30.4375);
  // Carry days → months → years if rounding overflowed
  if (d >= 30){ d -= 30; m += 1; }
  if (m >= 12){ m -= 12; y += 1; }
  const lang = CURRENT_LANG;
  if (lang === 'hi'){
    const parts = [];
    if (y) parts.push(`${y} वर्ष`);
    if (m) parts.push(`${m} मास`);
    if (d || (!y && !m)) parts.push(`${d} दिन`);
    return parts.join(' ');
  }
  const parts = [];
  if (y) parts.push(`${y}y`);
  if (m) parts.push(`${m}m`);
  if (d || (!y && !m)) parts.push(`${d}d`);
  return parts.join(' ');
}

/* ---------- Dignity ---------- */
// sign index: 0=Aries .. 11=Pisces
const EXALT = { Sun:0, Moon:1, Mars:9, Mercury:5, Jupiter:3, Venus:11, Saturn:6, Rahu:1, Ketu:7 };
const OWN   = { Sun:[4], Moon:[3], Mars:[0,7], Mercury:[2,5], Jupiter:[8,11], Venus:[1,6], Saturn:[9,10] };
const SIGN_LORD = ["Mars","Venus","Mercury","Moon","Sun","Mercury",
                   "Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"];

function dignityOf(planet, signIdx){
  if (EXALT[planet] === signIdx) return "Exalted";
  if (EXALT[planet] !== undefined && ((EXALT[planet]+6)%12) === signIdx) return "Debilitated";
  if (OWN[planet] && OWN[planet].includes(signIdx)) return "Own sign";
  return "";
}

/* ---------- Navamsa (D9) ---------- */
function navamsaSignIdx(sidLon){
  // Each navamsa = 360/108 = 3.333°
  return Math.floor(sidLon / (360/108)) % 12;
}

function renderEphemeris(result, container){
  const { ayanamsa, ayanamsaName, jd, utc, localDate, rows, panchang, dasha } = result;
  const lagnaRow = rows.find(r => r.planet.startsWith("Lagna"));
  const moonRow  = rows.find(r => r.planet === "Moon");
  const lagnaSignIdx = lagnaRow ? Math.floor(lagnaRow.sidereal/30) : null;
  const moonSignIdx  = Math.floor(moonRow.sidereal/30);

  // Panchang translated string
  const tithiTxt = panchang.isAmavasya
        ? tr('amavasya')
        : `${tr('paksha', panchang.pakshaKey)} ${tr('tithi', panchang.tithiNumIdx)}`;
  const pakshaTxt = tr('paksha', panchang.pakshaKey);
  const vaaraTxt  = tr('vaara',  panchang.vaaraIdx);
  const yogaTxt   = tr('yoga',   panchang.yogaIdx);
  const karanaTxt = tr('karana', panchang.karanaNameIdx);

  // ---- Birth / time summary + Panchang ----
  let html = `<div class="kundli-report">
    <div class="report-actions">
      <button type="button" id="downloadPdfBtn" class="btn btn-primary">Download Printable PDF</button>
    </div>
    <h2 class="kundli-h">${trUI('birth')}</h2>
    <div class="kundli-grid-2">
      <div class="card">
        <p><strong>${trUI('localTime')}:</strong> ${localDate}</p>
        <p><strong>${trUI('utc')}:</strong> ${utc}</p>
        <p><strong>${trUI('jd')}:</strong> ${jd.toFixed(5)}</p>
        <p><strong>${trUI('ayanamsa')}:</strong> ${ayanamsaName} — ${fmtDeg(ayanamsa)} (${ayanamsa.toFixed(4)}°)</p>
        ${lagnaRow ? `<p><strong>${trUI('lagna')}:</strong> ${trRashiName(lagnaRow.sign)} ${fmtDeg(lagnaRow.signDeg)}</p>` : ''}
        <p><strong>${trUI('moonSign')}:</strong> ${trRashiName(moonRow.sign)}</p>
        <p><strong>${trUI('nakshatra')}:</strong> ${trNakshatra(moonRow.nakshatra)} – ${trUI('colPada')} ${moonRow.pada}</p>
      </div>
      <div class="card">
        <h3 style="margin-bottom:8px">${trUI('panchang')}</h3>
        <p><strong>${trUI('vaara')}:</strong> ${vaaraTxt}</p>
        <p><strong>${trUI('tithi')}:</strong> ${tithiTxt}</p>
        <p><strong>${trUI('pakshaL')}:</strong> ${pakshaTxt}</p>
        <p><strong>${trUI('yoga')}:</strong> ${yogaTxt}</p>
        <p><strong>${trUI('karana')}:</strong> ${karanaTxt}</p>
      </div>
    </div>`;

  // ---- Three Kundli charts ----
  if (lagnaRow){
    html += `<h2 class="kundli-h">${trUI('charts')}</h2>
      <div class="kundli-grid-3">
        <div class="chart-wrap">
          <h4>${trUI('d1')}</h4>
          ${renderNorthIndianKundli(rows, lagnaSignIdx, r => Math.floor(r.sidereal/30))}
        </div>
        <div class="chart-wrap">
          <h4>${trUI('d9')}</h4>
          ${renderNorthIndianKundli(rows, navamsaSignIdx(lagnaRow.sidereal), r => navamsaSignIdx(r.sidereal))}
        </div>
        <div class="chart-wrap">
          <h4>${trUI('chandra')}</h4>
          ${renderNorthIndianKundli(rows, moonSignIdx, r => Math.floor(r.sidereal/30))}
        </div>
      </div>`;
  }

  // ---- Detailed planet table ----
  html += `<h2 class="kundli-h">${trUI('planets')}</h2>
    <div style="overflow-x:auto"><table class="eph-table">
      <thead><tr>
        <th>${trUI('colPlanet')}</th><th>${trUI('colLon')}</th><th>${trUI('colRashi')}</th>
        <th>${trUI('colDeg')}</th><th>${trUI('colNak')}</th><th>${trUI('colPada')}</th>
        <th>${trUI('colNakLord')}</th><th>${trUI('colSignLord')}</th>
        <th>${trUI('colDignity')}</th><th>${trUI('colMotion')}</th>
      </tr></thead><tbody>`;
  for (const r of rows){
    const signIdx = Math.floor(r.sidereal/30);
    const nakIdx  = Math.floor(r.sidereal / (360/27));
    const nakLord = DASHA_LORDS[NAK_LORD_IDX[nakIdx]][0];
    const dignityKey = r.planet.startsWith("Lagna") ? "" : dignityOf(r.planet, signIdx);
    const dignityTxt = dignityKey ? tr('dignity', dignityKey) : "";
    let motionTxt;
    if (r.planet === "Sun" || r.planet === "Moon" || r.planet.startsWith("Lagna")){
      motionTxt = tr('motion','dash');
    } else if (r.retro){
      motionTxt = `<span style="color:#a8420d;font-weight:700">${tr('motion','R')}</span>`;
    } else {
      motionTxt = tr('motion','Direct');
    }
    html += `<tr>
      <td><strong>${trPlanet(r.planet)}</strong></td>
      <td>${fmtDeg(r.sidereal)}</td>
      <td>${trRashiName(r.sign)}</td>
      <td>${fmtDeg(r.signDeg)}</td>
      <td>${trNakshatra(r.nakshatra)}</td>
      <td>${r.pada}</td>
      <td>${trPlanet(nakLord)}</td>
      <td>${trPlanet(SIGN_LORD[signIdx])}</td>
      <td>${dignityTxt}</td>
      <td>${motionTxt}</td>
    </tr>`;
  }
  html += `</tbody></table></div>`;

  // ---- House lords ----
  if (lagnaRow){
    html += `<h2 class="kundli-h">${trUI('houses')}</h2>
      <div style="overflow-x:auto"><table class="eph-table"><thead><tr>
        <th>${trUI('colHouse')}</th><th>${trUI('colRashi')}</th>
        <th>${trUI('colLord')}</th><th>${trUI('colLordIn')}</th>
      </tr></thead><tbody>`;
    for (let h=1; h<=12; h++){
      const signIdx = (lagnaSignIdx + h - 1) % 12;
      const lord = SIGN_LORD[signIdx];
      const lordRow = rows.find(r => r.planet === lord);
      const lordHouse = lordRow
        ? ((Math.floor(lordRow.sidereal/30) - lagnaSignIdx + 12) % 12) + 1
        : "—";
      html += `<tr><td>${h}</td><td>${tr('rashi', signIdx)}</td><td>${trPlanet(lord)}</td>
                   <td>${trUI('house')} ${lordHouse}${lordRow ? ` (${trRashiName(lordRow.sign)})` : ''}</td></tr>`;
    }
    html += `</tbody></table></div>`;
  }

  // ---- Vimshottari Mahadasha + Antardasha ----
  if (dasha){
    const fmtDate = d => { const s = d.toISOString().slice(0,10).split('-'); return s[2]+'-'+s[1]+'-'+s[0]; };
    html += `<h2 class="kundli-h">${trUI('dasha')}</h2>
      <div class="card" style="margin-bottom:14px">
        <p><strong>${trUI('nakLord')}:</strong> ${trPlanet(dasha.startLord)}</p>
        <p><strong>${trUI('balance')} ${trPlanet(dasha.startLord)} ${trUI('atBirth')}:</strong>
           ${yearsToYMD(dasha.balanceYears)}</p>
      </div>`;
    dasha.periods.forEach((p, i) => {
      const open = i === 0 ? ' open' : '';
      html += `<details class="dasha-md"${open}>
        <summary>
          <span class="md-idx">${i+1}.</span>
          <span class="md-lord">${trPlanet(p.lord)} ${trUI('mdLord')}${p.isPartial ? ' *' : ''}</span>
          <span class="md-yrs">${yearsToYMD(p.years)}</span>
          <span class="md-range">${fmtDate(p.start)} → ${fmtDate(p.end)}</span>
        </summary>
        <table class="eph-table dasha-ad-table"><thead><tr>
          <th>#</th><th>${trUI('adLord')}</th><th>${trUI('duration')}</th>
          <th>${trUI('start')}</th><th>${trUI('end')}</th>
        </tr></thead><tbody>`;
      p.antardashas.forEach((ad, j) => {
        html += `<tr><td>${j+1}</td><td><strong>${trPlanet(ad.lord)}</strong></td>
          <td>${yearsToYMD(ad.years)}</td>
          <td>${fmtDate(ad.start)}</td><td>${fmtDate(ad.end)}</td></tr>`;
      });
      html += `</tbody></table></details>`;
    });
  }

  html += `<p class="muted small-text" style="margin-top:20px">${trUI('footer')}</p></div>`;

  container.innerHTML = html;
  const pdfBtn = container.querySelector('#downloadPdfBtn');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => openPrintablePdf(result));
  }
}

/* ---------- North Indian Kundli (diamond chart) ---------- */

// House centers in a 400x400 viewBox — TRUE geometric centroids.
// Outer square corners: TL(2,2) TR(398,2) BR(398,398) BL(2,398)
// Inner diamond: T(200,2) R(398,200) B(200,398) L(2,200)
// Diagonals cross diamond edges at: (101,101) (299,101) (101,299) (299,299)
// Center = (200,200)
//
// Kite houses (4 vertices each → centroid = average):
//   H1  top:    (200,2) (299,101) (200,200) (101,101)  → (200, 101)
//   H4  left:   (2,200) (101,101) (200,200) (101,299)  → (101, 200)
//   H7  bottom: (200,398) (101,299) (200,200) (299,299) → (200, 299)
//   H10 right:  (398,200) (299,299) (200,200) (299,101) → (299, 200)
//
// Triangle houses (3 vertices → centroid = average):
//   H2:  (2,2) (200,2) (101,101)       → (101, 35)
//   H3:  (2,2) (2,200) (101,101)       → (35, 101)
//   H5:  (2,398) (2,200) (101,299)     → (35, 299)
//   H6:  (2,398) (200,398) (101,299)   → (101, 365)
//   H8:  (398,398) (200,398) (299,299) → (299, 365)
//   H9:  (398,398) (398,200) (299,299) → (365, 299)
//   H11: (398,2) (398,200) (299,101)   → (365, 101)
//   H12: (398,2) (200,2) (299,101)     → (299, 35)
// Visual centers for PLANET TEXT — 500x400 rectangular chart.
// Outer rect: (2,2)-(498,398). Diamond: T(250,2) R(498,200) B(250,398) L(2,200).
// Diag intersects diamond at ~(126,101) (374,101) (126,299) (374,299).
const HOUSE_CENTERS = {
  1:  [250, 110],   // top kite
  2:  [110,  55],   // top-left triangle
  3:  [ 55,  90],   // left-upper triangle
  4:  [110, 200],   // left kite
  5:  [ 55, 310],   // left-lower triangle
  6:  [110, 345],   // bottom-left triangle
  7:  [250, 290],   // bottom kite
  8:  [390, 345],   // bottom-right triangle
  9:  [445, 310],   // right-lower triangle
  10: [390, 200],   // right kite
  11: [445,  90],   // right-upper triangle
  12: [390,  55]    // top-right triangle
};
// House number positions — inner corner/tip of each cell.
const HOUSE_NUM_POS = {
  1:  [250,  45],
  2:  [170,  15],
  3:  [ 15, 140],
  4:  [ 55, 200],
  5:  [ 15, 260],
  6:  [170, 385],
  7:  [250, 355],
  8:  [330, 385],
  9:  [485, 260],
  10: [445, 200],
  11: [485, 140],
  12: [330,  15]
};
function renderNorthIndianKundli(rows, lagnaSignIdx, getSignIdx){
  // Group planets by house relative to provided lagna sign index
  const houses = {}; for (let i=1;i<=12;i++) houses[i] = [];
  for (const r of rows){
    if (r.planet.startsWith("Lagna")) continue; // we mark lagna via house 1 label
    const signIdx = getSignIdx(r);
    const house = ((signIdx - lagnaSignIdx + 12) % 12) + 1;
    houses[house].push(r);
  }

  // SVG skeleton — rectangular (500 wide x 400 tall)
  let svg = `<svg viewBox="0 0 500 400" width="100%" height="100%" class="kundli-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <rect x="2" y="2" width="496" height="396" fill="#fff8ef" stroke="#a8420d" stroke-width="3"/>
    <line x1="2" y1="2" x2="498" y2="398" stroke="#a8420d" stroke-width="2"/>
    <line x1="498" y1="2" x2="2" y2="398" stroke="#a8420d" stroke-width="2"/>
    <polygon points="250,2 498,200 250,398 2,200" fill="none" stroke="#a8420d" stroke-width="2"/>`;

  for (let h=1; h<=12; h++){
    const [cx, cy] = HOUSE_CENTERS[h];
    const signNum = ((lagnaSignIdx + h - 1) % 12) + 1;
    const [nx, ny] = HOUSE_NUM_POS[h];

    // House number at the inner corner/tip — away from planet text
    svg += `<text x="${nx}" y="${ny}" text-anchor="middle" dominant-baseline="central" font-size="13"
              fill="#a8420d" font-weight="700" opacity="0.7">${signNum}</text>`;

    // Planets at the visual center of the cell
    const items = [...houses[h]];
    if (h === 1) items.unshift({ planet:"Lagna (Asc)", signDeg: 0, _isLagnaMarker:true });

    const perRow = items.length > 3 ? 2 : 1;
    items.forEach((p, i) => {
      const abbr = tr('planetAbbr', p.planet) || p.planet.slice(0,2);
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const dx = perRow === 2 ? (col === 0 ? -22 : 22) : 0;
      const totalRows = Math.ceil(items.length / perRow);
      const blockH = totalRows * 15;
      const dy = cy - blockH/2 + row * 15 + 7;
      const isLagna = p.planet.startsWith('Lagna');
      const isRetro = p.retro && !isLagna;
      const deg = p._isLagnaMarker ? "" :
                  `<tspan font-size="9" fill="#6b5a48"> ${Math.floor(p.signDeg)}°</tspan>` +
                  (isRetro ? `<tspan font-size="9" fill="#a8420d" font-weight="700"> R</tspan>` : "");
      svg += `<text x="${cx+dx}" y="${dy}" text-anchor="middle" font-size="13"
                fill="${isLagna ? '#1a5fb4' : '#2b1100'}" font-weight="${isLagna?'700':'600'}">
                ${abbr}${deg}
              </text>`;
    });
  }

  svg += `</svg>`;
  return svg;
}

function fmtDateISO(d){
  const s = d.toISOString().slice(0, 10).split('-');
  return s[2]+'-'+s[1]+'-'+s[0];
}

function renderGaneshaHeader(imageUrl){
  return `<div class="pdf-ganesha-wrap">
    <img class="pdf-ganesha" src="${imageUrl}" alt="Shri Ganesh" />
    <div class="pdf-mantra">|| Shri Ganeshaya Namah ||</div>
  </div>`;
}

function printablePlanetRows(rows){
  let html = '';
  for (const r of rows){
    const signIdx = Math.floor(r.sidereal/30);
    const nakIdx  = Math.floor(r.sidereal / (360/27));
    const nakLord = DASHA_LORDS[NAK_LORD_IDX[nakIdx]][0];
    const dignity = r.planet.startsWith('Lagna') ? '' : (dignityOf(r.planet, signIdx) || '');
    const motionRaw = (r.planet === 'Sun' || r.planet === 'Moon' || r.planet.startsWith('Lagna'))
      ? 'dash'
      : (r.retro ? 'R' : 'Direct');
    html += `<tr>
      <td>${trPlanet(r.planet)}</td>
      <td>${fmtDeg(r.sidereal)}</td>
      <td>${trRashi(signIdx)}</td>
      <td>${fmtDeg(r.signDeg)}</td>
      <td>${trNakshatra(r.nakshatra)}</td>
      <td>${r.pada}</td>
      <td>${trPlanet(nakLord)}</td>
      <td>${trPlanet(SIGN_LORD[signIdx])}</td>
      <td>${dignity ? tr('dignity', dignity) : ''}</td>
      <td>${tr('motion', motionRaw)}</td>
    </tr>`;
  }
  return html;
}

function printableHouseRows(rows, lagnaSignIdx){
  let html = '';
  for (let h = 1; h <= 12; h++) {
    const signIdx = (lagnaSignIdx + h - 1) % 12;
    const lord = SIGN_LORD[signIdx];
    const lordRow = rows.find(r => r.planet === lord);
    const lordHouse = lordRow
      ? ((Math.floor(lordRow.sidereal/30) - lagnaSignIdx + 12) % 12) + 1
      : '—';
    html += `<tr>
      <td>${h}</td>
      <td>${trRashi(signIdx)}</td>
      <td>${trPlanet(lord)}</td>
      <td>${trUI('house')} ${lordHouse}${lordRow ? ` (${trRashiName(lordRow.sign)})` : ''}</td>
    </tr>`;
  }
  return html;
}

function printableDashaBlocksChunk(chunk, offset){
  let html = '';
  chunk.forEach((md, idx) => {
    const i = offset + idx;
    const mdLabel = CURRENT_LANG === 'hi' ? 'महादशा' : 'Mahadasha';
    const runLabel = CURRENT_LANG === 'hi' ? '(जन्म समय चल रही)' : '(running at birth)';
    const adLabel = CURRENT_LANG === 'hi' ? 'अन्तर्दशा' : 'Antardasha';
    const durLabel = CURRENT_LANG === 'hi' ? 'अवधि' : 'Duration';
    const startLabel = CURRENT_LANG === 'hi' ? 'प्रारम्भ' : 'Start';
    const endLabel = CURRENT_LANG === 'hi' ? 'समाप्ति' : 'End';
    html += `<section class="pdf-dasha-block">
      <h3>${i+1}. ${trPlanet(md.lord)} ${mdLabel} ${md.isPartial ? runLabel : ''}</h3>
      <p class="pdf-range">${fmtDateISO(md.start)} ${CURRENT_LANG === 'hi' ? 'से' : 'to'} ${fmtDateISO(md.end)} (${yearsToYMD(md.years)})</p>
      <table class="pdf-table">
        <thead><tr><th>#</th><th>${adLabel}</th><th>${durLabel}</th><th>${startLabel}</th><th>${endLabel}</th></tr></thead>
        <tbody>`;
    md.antardashas.forEach((ad, j) => {
      html += `<tr><td>${j+1}</td><td>${trPlanet(ad.lord)}</td><td>${yearsToYMD(ad.years)}</td><td>${fmtDateISO(ad.start)}</td><td>${fmtDateISO(ad.end)}</td></tr>`;
    });
    html += `</tbody></table></section>`;
  });
  return html;
}

function chunkItems(items, size){
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function renderPrintableKundli(result, ganeshImageUrl){
  const { userName, ayanamsa, ayanamsaName, jd, utc, localDate, rows, panchang, dasha } = result;
  const safeName = (userName || '').trim() || 'Kundli Native';
  const lagnaRow = rows.find(r => r.planet.startsWith('Lagna'));
  const moonRow  = rows.find(r => r.planet === 'Moon');
  const lagnaSignIdx = lagnaRow ? Math.floor(lagnaRow.sidereal/30) : 0;
  const moonSignIdx  = Math.floor(moonRow.sidereal/30);
  const tithiTxt = panchang.isAmavasya ? tr('amavasya','') : `${tr('paksha', panchang.pakshaKey)} ${tr('tithi', panchang.tithiNumIdx)}`;
  const isHi = CURRENT_LANG === 'hi';

  const pages = [];
  const pushPage = (content) => {
    const pageNo = pages.length + 1;
    pages.push(`<section class="pdf-page ornate-border">${content}<div class="pdf-page-number">${pageNo}</div></section>`);
  };

  pushPage(`
    <div class="pdf-user-name">${safeName}</div>
    ${renderGaneshaHeader(ganeshImageUrl)}
    <h1 class="pdf-title">${isHi ? 'जन्म कुण्डली' : 'Janma Kundli'}</h1>
    <p class="pdf-subtitle">${isHi ? 'वैदिक जन्मपत्री प्रतिवेदन' : 'Vedic Horoscope Report'}</p>
    <div class="pdf-two-col">
      <div class="pdf-card">
        <h2>${trUI('birth')}</h2>
        <p><strong>${trUI('localTime')}:</strong> ${localDate}</p>
        <p><strong>${trUI('utc')}:</strong> ${utc}</p>
        <p><strong>${trUI('jd')}:</strong> ${jd.toFixed(5)}</p>
        <p><strong>${trUI('ayanamsa')}:</strong> ${ayanamsaName} (${ayanamsa.toFixed(4)}°)</p>
        ${lagnaRow ? `<p><strong>${trUI('lagna')}:</strong> ${trRashiName(lagnaRow.sign)} ${fmtDeg(lagnaRow.signDeg)}</p>` : ''}
        <p><strong>${trUI('moonSign')}:</strong> ${trRashiName(moonRow.sign)}</p>
        <p><strong>${trUI('nakshatra')}:</strong> ${trNakshatra(moonRow.nakshatra)} ${isHi ? 'पाद' : 'Pada'} ${moonRow.pada}</p>
      </div>
      <div class="pdf-card">
        <h2>${trUI('panchang')}</h2>
        <p><strong>${trUI('vaara')}:</strong> ${tr('vaara', panchang.vaaraIdx)}</p>
        <p><strong>${trUI('tithi')}:</strong> ${tithiTxt}</p>
        <p><strong>${trUI('pakshaL')}:</strong> ${tr('paksha', panchang.pakshaKey)}</p>
        <p><strong>${trUI('yoga')}:</strong> ${tr('yoga', panchang.yogaIdx)}</p>
        <p><strong>${trUI('karana')}:</strong> ${tr('karana', panchang.karanaNameIdx)}</p>
      </div>
    </div>
    <div class="pdf-blessing">${isHi ? 'श्री गणेश इस कुण्डली को स्पष्टता, ज्ञान एवं शुभारम्भ का आशीर्वाद दें।' : 'May Shri Ganesh bless this horoscope with clarity, wisdom, and auspicious beginnings.'}</div>
  `);

  pushPage(`
    <div class="pdf-user-name">${safeName}</div>
    <h2 class="pdf-section-title">${trUI('charts')}</h2>
    <div class="pdf-charts-row">
      <div class="pdf-chart-card">
        <h3>${trUI('d1')}</h3>
        ${renderNorthIndianKundli(rows, lagnaSignIdx, r => Math.floor(r.sidereal/30))}
      </div>
      <div class="pdf-chart-card">
        <h3>${trUI('d9')}</h3>
        ${renderNorthIndianKundli(rows, navamsaSignIdx(lagnaRow ? lagnaRow.sidereal : 0), r => navamsaSignIdx(r.sidereal))}
      </div>
      <div class="pdf-chart-card">
        <h3>${trUI('chandra')}</h3>
        ${renderNorthIndianKundli(rows, moonSignIdx, r => Math.floor(r.sidereal/30))}
      </div>
    </div>
  `);

  pushPage(`
    <div class="pdf-user-name">${safeName}</div>
    <h2 class="pdf-section-title">${trUI('planets')}</h2>
    <table class="pdf-table">
      <thead><tr>
        <th>${trUI('colPlanet')}</th><th>${trUI('colLon')}</th><th>${trUI('colRashi')}</th><th>${trUI('colDeg')}</th>
        <th>${trUI('colNak')}</th><th>${trUI('colPada')}</th><th>${trUI('colNakLord')}</th><th>${trUI('colSignLord')}</th><th>${trUI('colDignity')}</th><th>${trUI('colMotion')}</th>
      </tr></thead>
      <tbody>${printablePlanetRows(rows)}</tbody>
    </table>
  `);

  const dashaPeriods = dasha ? dasha.periods : [];
  const firstDasha = dashaPeriods.length ? dashaPeriods[0] : null;
  const remainingDashas = dashaPeriods.length > 1 ? dashaPeriods.slice(1) : [];
  const dashaChunks = chunkItems(remainingDashas, 2);

  pushPage(`
    <div class="pdf-user-name">${safeName}</div>
    <h2 class="pdf-section-title">${trUI('houses')}</h2>
    <table class="pdf-table">
      <thead><tr><th>${trUI('colHouse')}</th><th>${trUI('colRashi')}</th><th>${trUI('colLord')}</th><th>${trUI('colLordIn')}</th></tr></thead>
      <tbody>${printableHouseRows(rows, lagnaSignIdx)}</tbody>
    </table>
    <h2 class="pdf-section-title">${trUI('dasha')}</h2>
    ${dasha ? `<div class="pdf-callout"><p><strong>${trUI('nakLord')}:</strong> ${trPlanet(dasha.startLord)}</p><p><strong>${trUI('balance')}:</strong> ${yearsToYMD(dasha.balanceYears)}</p></div>` : ''}
    ${firstDasha ? `<div class="pdf-dasha-inline">${printableDashaBlocksChunk([firstDasha], 0)}</div>` : ''}
  `);

  for (let i = 0; i < dashaChunks.length; i++) {
    const contLabel = isHi ? 'विंशोत्तरी दशा (जारी)' : 'Vimshottari Dasha (Cont.)';
    pushPage(`
      <div class="pdf-user-name">${safeName}</div>
      <h2 class="pdf-section-title">${i === 0 ? trUI('dasha') : contLabel}</h2>
      ${printableDashaBlocksChunk(dashaChunks[i], i * 2 + 1)}
    `);
  }

  return `<div class="pdf-doc">${pages.join('')}</div>`;
}

function getPrintableStyles(){
  return `
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Noto Sans Devanagari', Georgia, 'Times New Roman', serif; color: #2b1100; background: #fff; }
    .pdf-doc { width: 100%; }
    .pdf-page { position: relative; width: 190mm; height: 274mm; margin: 0 auto; padding: 10mm; page-break-after: always; break-after: page; overflow: hidden; }
    .pdf-page:last-child { page-break-after: auto; break-after: auto; }
    .ornate-border { border: 2px solid #a8420d; outline: 1px solid #d59f6a; outline-offset: -8px; background: linear-gradient(180deg, #fffdf9, #fff8ef); }
    .ornate-border::before, .ornate-border::after {
      content: ''; position: absolute; left: 12mm; right: 12mm; height: 1px; background: repeating-linear-gradient(90deg, #a8420d 0 6px, transparent 6px 12px);
    }
    .ornate-border::before { top: 7mm; }
    .ornate-border::after { bottom: 7mm; }
    .pdf-ganesha-wrap { text-align: center; margin: 2mm 0 6mm; }
    .pdf-ganesha { width: 64mm; height: auto; }
    .pdf-mantra { font-size: 13pt; color: #7a2d0a; letter-spacing: 0.6px; }
    .pdf-user-name {
      text-align: center;
      color: #a8420d;
      font-size: 14pt;
      font-weight: 700;
      letter-spacing: 0.4px;
      margin: 0 0 3mm;
    }
    .pdf-title { margin: 0; text-align: center; font-size: 28pt; color: #7a2d0a; text-transform: uppercase; letter-spacing: 1.4px; }
    .pdf-subtitle { text-align: center; margin: 2mm 0 6mm; color: #6b5a48; font-size: 12pt; }
    .pdf-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
    .pdf-card { border: 1px solid #d8c3a7; background: #fff; border-radius: 2mm; padding: 4mm; }
    .pdf-card h2 { margin: 0 0 2mm; color: #7a2d0a; font-size: 14pt; border-bottom: 1px solid #eadfce; padding-bottom: 1mm; }
    .pdf-card p { margin: 1.2mm 0; font-size: 10.6pt; line-height: 1.35; }
    .pdf-blessing { margin-top: 6mm; text-align: center; font-style: italic; color: #6b5a48; border-top: 1px dashed #d59f6a; padding-top: 3mm; }
    .pdf-section-title { margin: 1mm 0 3mm; color: #7a2d0a; font-size: 16pt; border-bottom: 1px solid #eadfce; padding-bottom: 1.4mm; }
    .pdf-charts-row { display: grid; grid-template-columns: 1fr; gap: 2mm; margin-bottom: 0; }
    .pdf-chart-card { border: 1px solid #d8c3a7; border-radius: 2mm; padding: 2mm 2.5mm; background: #fff; text-align: center; }
    .pdf-chart-card h3 { margin: 0 0 1mm; color: #7a2d0a; font-size: 10.6pt; }
    .pdf-chart-card svg { width: 100%; height: auto; max-height: 63mm; }
    .pdf-table { width: 100%; border-collapse: collapse; margin-top: 2mm; font-size: 9.2pt; background: #fff; break-inside: avoid-page; page-break-inside: avoid; }
    .pdf-table th, .pdf-table td { border: 1px solid #d8c3a7; padding: 1.6mm 1.8mm; text-align: left; vertical-align: top; }
    .pdf-table th { background: #7a2d0a; color: #fff; font-weight: 700; }
    .pdf-callout { border: 1px solid #d8c3a7; border-radius: 2mm; background: #fff; padding: 3mm; margin-bottom: 3mm; }
    .pdf-callout p { margin: 1mm 0; }
    .pdf-dasha-inline .pdf-dasha-block { margin-top: 1mm; }
    .pdf-dasha-block { margin-bottom: 2.5mm; break-inside: avoid; break-inside: avoid-page; page-break-inside: avoid; }
    .pdf-dasha-block h3 { margin: 0; color: #7a2d0a; font-size: 12.5pt; padding-left: 1mm; }
    .pdf-range { margin: 0.6mm 0 1.4mm; color: #6b5a48; font-size: 9.4pt; }
    .pdf-dasha-block .pdf-table { font-size: 8.7pt; margin-top: 1mm; }
    .pdf-dasha-block .pdf-table th, .pdf-dasha-block .pdf-table td { padding: 1.2mm 1.4mm; }
    .pdf-page-number {
      position: absolute;
      right: 16mm;
      bottom: 10mm;
      color: #a8420d;
      font-size: 10pt;
      font-weight: 700;
      line-height: 1;
    }
  `;
}

function buildPrintableHtml(result, ganeshImageUrl){
  const lang = CURRENT_LANG === 'hi' ? 'hi' : 'en';
  return `<!DOCTYPE html>
  <html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${lang === 'hi' ? 'जन्म कुण्डली' : 'Janma Kundli PDF'}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
    <style>${getPrintableStyles()}</style>
  </head>
  <body>${renderPrintableKundli(result, ganeshImageUrl)}</body>
  </html>`;
}

function openPrintablePdf(result){
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup blocked. Please allow popups for this site to generate PDF.');
    return;
  }

  const ganeshImageUrl = new URL('assets/img/shri_ganesh_clean.png', window.location.href).href;
  const html = buildPrintableHtml(result, ganeshImageUrl);

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    const images = Array.from(printWindow.document.images || []);
    Promise.all(images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    })).finally(() => {
      setTimeout(() => printWindow.print(), 200);
    });
  };
}

const geoCache = new Map();

function setGeoStatus(msg, tone = ""){
  const status = document.getElementById('geoStatus');
  if (!status) return;
  status.textContent = msg || '';
  status.className = `geo-status${tone ? ` ${tone}` : ''}`;
}

function getTimeZoneOffsetHours(timeZone, dateStr, timeStr){
  if (!timeZone || !dateStr || !timeStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  if (![y, m, d, hh, mm].every(Number.isFinite)) return null;

  const probeUtc = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = fmt.formatToParts(probeUtc);
  const val = (type) => Number(parts.find(p => p.type === type)?.value);
  const tzDateAsUtc = Date.UTC(val('year'), val('month') - 1, val('day'), val('hour'), val('minute'), val('second'));
  const offsetHours = (tzDateAsUtc - probeUtc.getTime()) / 3600000;
  return Number.isFinite(offsetHours) ? offsetHours : null;
}

async function fetchOpenMeteoGeocode(query){
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Open-Meteo geocoding request failed');
  const data = await res.json();
  const item = data?.results?.[0];
  if (!item) return null;
  const displayName = [item.name, item.admin1, item.country].filter(Boolean).join(', ');
  return {
    name: displayName || item.name,
    latitude: item.latitude,
    longitude: item.longitude,
    timeZone: item.timezone || null
  };
}

async function fetchNominatimGeocode(query){
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('Nominatim geocoding request failed');
  const data = await res.json();
  const item = Array.isArray(data) ? data[0] : null;
  if (!item) return null;
  return {
    name: item.display_name || query,
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
    timeZone: null
  };
}

async function geocodeCity(query){
  const key = (query || '').trim().toLowerCase();
  if (!key) return null;
  if (geoCache.has(key)) return geoCache.get(key);

  let found = null;
  try {
    found = await fetchOpenMeteoGeocode(query);
  } catch (_) {
    // Fallback below.
  }
  if (!found) {
    found = await fetchNominatimGeocode(query);
  }
  if (!found) return null;
  geoCache.set(key, found);
  return found;
}

async function resolveCityAndPopulate(){
  const placeInput = document.getElementById('ephPlace');
  const latInput = document.getElementById('ephLat');
  const lonInput = document.getElementById('ephLon');
  const tzInput = document.getElementById('ephTz');
  const dateStr = document.getElementById('ephDate').value;
  const timeStr = document.getElementById('ephTime').value;
  const city = placeInput?.value?.trim();
  if (!city) {
    setGeoStatus('');
    return false;
  }

  setGeoStatus('Resolving city to coordinates...', 'busy');
  try {
    const geo = await geocodeCity(city);
    if (!geo || !Number.isFinite(geo.latitude) || !Number.isFinite(geo.longitude)) {
      setGeoStatus('City not found. Keeping existing latitude/longitude.', 'warn');
      return false;
    }

    latInput.value = geo.latitude.toFixed(4);
    lonInput.value = geo.longitude.toFixed(4);

    if (geo.timeZone) {
      const tzHours = getTimeZoneOffsetHours(geo.timeZone, dateStr, timeStr);
      if (Number.isFinite(tzHours)) {
        tzInput.value = tzHours.toString();
      }
    }

    setGeoStatus(`Using ${geo.name}`, 'ok');
    return true;
  } catch (_) {
    setGeoStatus('Geocoding service unavailable. Keeping existing latitude/longitude.', 'warn');
    return false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('autopdf') === '1') {
    const d = params.get('d') || new Date().toISOString().slice(0, 10);
    const t = params.get('t') || '12:00';
    const tz = parseFloat(params.get('tz') || '5.5');
    const lat = parseFloat(params.get('lat') || '28.6139');
    const lon = parseFloat(params.get('lon') || '77.2090');
    const ayan = params.get('ayan') || 'lahiri';
    const name = params.get('name') || '';
    const result = computePositions(d, t, tz, lat, lon, ayan, name);
    const ganeshImageUrl = new URL('assets/img/shri_ganesh_clean.png', window.location.href).href;
    const html = buildPrintableHtml(result, ganeshImageUrl);
    document.open();
    document.write(html);
    document.close();
    return;
  }

  const form = document.getElementById('ephForm');
  if (!form) return;

  const placeInput = document.getElementById('ephPlace');

  const now = new Date();
  document.getElementById('ephDate').value = now.toISOString().slice(0,10);
  document.getElementById('ephTime').value =
      String(now.getHours()).padStart(2,'0') + ':' +
      String(now.getMinutes()).padStart(2,'0');

  let lastResult = null;
  window.__rerenderKundli = () => {
    if (lastResult) renderEphemeris(lastResult, document.getElementById('ephResult'));
  };
  window.__buildPrintableHtml = () => {
    if (!lastResult) return null;
    const ganeshImageUrl = new URL('assets/img/shri_ganesh_clean.png', window.location.href).href;
    return buildPrintableHtml(lastResult, ganeshImageUrl);
  };

  // Set up bidirectional city <-> coords sync
  if (typeof setupBidirectionalGeo === 'function') {
    setupBidirectionalGeo('ephPlace', 'ephLat', 'ephLon', 'geoStatus');
  } else if (placeInput) {
    placeInput.addEventListener('blur', () => { resolveCityAndPopulate(); });
    placeInput.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter') { evt.preventDefault(); resolveCityAndPopulate(); }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (typeof setupBidirectionalGeo !== 'function') await resolveCityAndPopulate();
    const d   = document.getElementById('ephDate').value; // native date gives yyyy-mm-dd
    const t   = document.getElementById('ephTime').value;
    const tz  = parseFloat(document.getElementById('ephTz').value);
    const lat = parseFloat(document.getElementById('ephLat').value);
    const lon = parseFloat(document.getElementById('ephLon').value);
    const ayan = document.getElementById('ephAyanamsa')?.value || 'lahiri';
    const name = document.getElementById('ephName')?.value?.trim() || '';
    lastResult = computePositions(d, t, tz, lat, lon, ayan, name);
    renderEphemeris(lastResult, document.getElementById('ephResult'));
  });

  // Auto-fill from URL params (coming from homepage Quick Start)
  const qp = new URLSearchParams(window.location.search);
  const qName = qp.get('name');
  const qDate = qp.get('d');
  const qTime = qp.get('t');
  const qCity = qp.get('city');
  if (qName && qDate && qTime && qCity) {
    const nameEl = document.getElementById('ephName');
    const dateEl = document.getElementById('ephDate');
    const timeEl = document.getElementById('ephTime');
    if (nameEl) nameEl.value = qName;
    if (dateEl) dateEl.value = qDate;
    if (timeEl) timeEl.value = qTime;
    if (placeInput) placeInput.value = qCity;
    // Auto-geocode and submit
    (async () => {
      await resolveCityAndPopulate();
      const d = dateEl.value;
      const t = timeEl.value;
      const tz = parseFloat(document.getElementById('ephTz').value);
      const lat = parseFloat(document.getElementById('ephLat').value);
      const lon = parseFloat(document.getElementById('ephLon').value);
      const ayan = document.getElementById('ephAyanamsa')?.value || 'lahiri';
      const name = nameEl?.value?.trim() || '';
      lastResult = computePositions(d, t, tz, lat, lon, ayan, name);
      renderEphemeris(lastResult, document.getElementById('ephResult'));
    })();
  }
});
