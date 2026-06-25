(function () {
  const SIGN_NAMES = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'];
  const NAK_NAMES = [
    'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha',
    'Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
    'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'
  ];
  const SIGN_LORDS = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];

  // Friendship matrix for Graha Maitri scoring.
  const FRIENDS = {
    Sun: ['Moon', 'Mars', 'Jupiter'],
    Moon: ['Sun', 'Mercury'],
    Mars: ['Sun', 'Moon', 'Jupiter'],
    Mercury: ['Sun', 'Venus'],
    Jupiter: ['Sun', 'Moon', 'Mars'],
    Venus: ['Mercury', 'Saturn'],
    Saturn: ['Mercury', 'Venus']
  };

  const ENEMIES = {
    Sun: ['Venus', 'Saturn'],
    Moon: [],
    Mars: ['Mercury'],
    Mercury: ['Moon'],
    Jupiter: ['Venus', 'Mercury'],
    Venus: ['Sun', 'Moon'],
    Saturn: ['Sun', 'Moon', 'Mars']
  };

  const NAK_GANA = [
    'Deva','Manushya','Rakshasa','Manushya','Deva','Manushya','Deva','Deva','Rakshasa',
    'Rakshasa','Manushya','Manushya','Deva','Rakshasa','Deva','Rakshasa','Deva','Rakshasa',
    'Rakshasa','Manushya','Manushya','Deva','Rakshasa','Rakshasa','Manushya','Manushya','Deva'
  ];

  const YONI_GROUP = [
    'Horse','Elephant','Sheep','Serpent','Serpent','Dog','Cat','Sheep','Cat',
    'Rat','Rat','Cow','Buffalo','Tiger','Buffalo','Tiger','Deer','Deer',
    'Dog','Monkey','Mongoose','Monkey','Lion','Horse','Lion','Cow','Elephant'
  ];

  const YONI_ENEMY = {
    Horse: ['Buffalo'], Elephant: ['Lion'], Sheep: ['Monkey'], Serpent: ['Mongoose'], Dog: ['Deer'],
    Cat: ['Rat'], Rat: ['Cat'], Cow: ['Tiger'], Buffalo: ['Horse'], Tiger: ['Cow'],
    Deer: ['Dog'], Monkey: ['Sheep'], Mongoose: ['Serpent'], Lion: ['Elephant']
  };

  const DEBILITATION = {
    Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 1
  };

  const geocodeCache = new Map();

  function byId(id) {
    return document.getElementById(id);
  }

  function parseNum(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : NaN;
  }

  function safeHtml(v) {
    return String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function signIdxFromDeg(deg) {
    return ((Math.floor(deg / 30) % 12) + 12) % 12;
  }

  function nakIdxFromDeg(deg) {
    const span = 360 / 27;
    return Math.max(0, Math.min(26, Math.floor(deg / span)));
  }

  function houseFromSign(planetSign, lagnaSign) {
    return ((planetSign - lagnaSign + 12) % 12) + 1;
  }

  function angleDiff(a, b) {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }

  async function geocodeCity(city) {
    const key = city.trim().toLowerCase();
    if (!key) return null;
    if (geocodeCache.has(key)) return geocodeCache.get(key);

    try {
      const openMeteo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
      if (openMeteo.ok) {
        const data = await openMeteo.json();
        if (data && Array.isArray(data.results) && data.results[0]) {
          const g = data.results[0];
          const found = { lat: g.latitude, lon: g.longitude, label: `${g.name}, ${g.country || ''}`.trim() };
          geocodeCache.set(key, found);
          return found;
        }
      }
    } catch (_) {}

    try {
      const nom = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(city)}`);
      if (nom.ok) {
        const rows = await nom.json();
        if (Array.isArray(rows) && rows[0]) {
          const g = rows[0];
          const found = { lat: parseFloat(g.lat), lon: parseFloat(g.lon), label: g.display_name || city };
          geocodeCache.set(key, found);
          return found;
        }
      }
    } catch (_) {}

    return null;
  }

  async function wireGeo(buttonId, cityId, latId, lonId, statusId) {
    const btn = byId(buttonId);
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const city = (byId(cityId)?.value || '').trim();
      const status = byId(statusId);
      if (!city) {
        if (status) status.textContent = 'Enter city first.';
        return;
      }
      if (status) status.textContent = 'Finding coordinates...';
      const g = await geocodeCity(city);
      if (!g || !Number.isFinite(g.lat) || !Number.isFinite(g.lon)) {
        if (status) status.textContent = 'City not found. Enter coordinates manually.';
        return;
      }
      byId(latId).value = g.lat.toFixed(4);
      byId(lonId).value = g.lon.toFixed(4);
      if (status) status.textContent = `Using ${g.label}`;
    });
  }

  function computeFromInputs(prefix, nameFallback) {
    if (typeof computePositions !== 'function') {
      throw new Error('Ephemeris engine not loaded.');
    }
    const d = byId(prefix + 'Date').value; // native date input gives yyyy-mm-dd
    const t = byId(prefix + 'Time').value;
    const tz = parseNum(byId(prefix + 'Tz').value);
    const lat = parseNum(byId(prefix + 'Lat').value);
    const lon = parseNum(byId(prefix + 'Lon').value);
    if (!d || !t || !Number.isFinite(tz) || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new Error('Please enter valid date/time/timezone/coordinates.');
    }
    return computePositions(d, t, tz, lat, lon, 'lahiri', nameFallback || '');
  }

  function moonCore(result) {
    const moon = result.rows.find((r) => r.planet === 'Moon');
    if (!moon) throw new Error('Moon position not available.');
    const moonSign = signIdxFromDeg(moon.sidereal);
    const moonNak = nakIdxFromDeg(moon.sidereal);
    return { moon, moonSign, moonNak };
  }

  function scoreVarna(a, b) {
    const rankBySign = [4,3,2,1,4,3,2,1,4,3,2,1];
    return rankBySign[a] >= rankBySign[b] ? 1 : 0;
  }

  function scoreVashya(a, b) {
    const group = [
      'Chatushpada','Chatushpada','Manava','Jalachara','Vanachara','Manava',
      'Manava','Keeta','Chatushpada','Chatushpada','Manava','Jalachara'
    ];
    return group[a] === group[b] ? 2 : 1;
  }

  function scoreTara(aNak, bNak) {
    const d = ((aNak - bNak + 27) % 27) + 1;
    const good = [1,3,5,7,10,12,14,16,19,21,23,25];
    return good.includes(d) ? 3 : 1.5;
  }

  function scoreYoni(aNak, bNak) {
    const a = YONI_GROUP[aNak];
    const b = YONI_GROUP[bNak];
    if (a === b) return 4;
    if ((YONI_ENEMY[a] || []).includes(b) || (YONI_ENEMY[b] || []).includes(a)) return 1;
    return 3;
  }

  function scoreGrahaMaitri(aSign, bSign) {
    const a = SIGN_LORDS[aSign];
    const b = SIGN_LORDS[bSign];
    if (a === b) return 5;
    if ((FRIENDS[a] || []).includes(b) && (FRIENDS[b] || []).includes(a)) return 5;
    if ((ENEMIES[a] || []).includes(b) || (ENEMIES[b] || []).includes(a)) return 1;
    if ((FRIENDS[a] || []).includes(b) || (FRIENDS[b] || []).includes(a)) return 4;
    return 3;
  }

  function scoreGana(aNak, bNak) {
    const a = NAK_GANA[aNak];
    const b = NAK_GANA[bNak];
    if (a === b) return 6;
    if ((a === 'Deva' && b === 'Manushya') || (a === 'Manushya' && b === 'Deva')) return 5;
    if ((a === 'Rakshasa' && b === 'Deva') || (a === 'Deva' && b === 'Rakshasa')) return 1;
    return 3;
  }

  function scoreBhakoot(aSign, bSign) {
    const d = (Math.abs(aSign - bSign) % 12) + 1;
    const bad = [2, 6, 8, 12, 5, 9];
    return bad.includes(d) ? 0 : 7;
  }

  function scoreNadi(aNak, bNak) {
    const nadiA = aNak % 3;
    const nadiB = bNak % 3;
    return nadiA === nadiB ? 0 : 8;
  }

  function ashtakootaScore(a, b) {
    const koota = [
      { name: 'Varna', max: 1, score: scoreVarna(a.moonSign, b.moonSign) },
      { name: 'Vashya', max: 2, score: scoreVashya(a.moonSign, b.moonSign) },
      { name: 'Tara', max: 3, score: scoreTara(a.moonNak, b.moonNak) },
      { name: 'Yoni', max: 4, score: scoreYoni(a.moonNak, b.moonNak) },
      { name: 'Graha Maitri', max: 5, score: scoreGrahaMaitri(a.moonSign, b.moonSign) },
      { name: 'Gana', max: 6, score: scoreGana(a.moonNak, b.moonNak) },
      { name: 'Bhakoot', max: 7, score: scoreBhakoot(a.moonSign, b.moonSign) },
      { name: 'Nadi', max: 8, score: scoreNadi(a.moonNak, b.moonNak) }
    ];
    const total = koota.reduce((s, k) => s + k.score, 0);
    return { koota, total };
  }

  function relationLabel(total) {
    if (total >= 28) return 'Excellent Match';
    if (total >= 22) return 'Good Match';
    if (total >= 18) return 'Average Match';
    return 'Needs Careful Guidance';
  }

  function renderMatchResult(aCore, bCore, score) {
    const rows = score.koota.map((k) => `<tr><td>${k.name}</td><td>${k.score.toFixed(1)}</td><td>${k.max}</td></tr>`).join('');
    return `
      <div class="card tool-result-card">
        <h3>Compatibility Result: ${relationLabel(score.total)}</h3>
        <p><strong>Total Guna:</strong> ${score.total.toFixed(1)} / 36</p>
        <p><strong>Partner A Moon:</strong> ${SIGN_NAMES[aCore.moonSign]} · ${NAK_NAMES[aCore.moonNak]}</p>
        <p><strong>Partner B Moon:</strong> ${SIGN_NAMES[bCore.moonSign]} · ${NAK_NAMES[bCore.moonNak]}</p>
        <table class="eph-table" style="margin-top:10px">
          <thead><tr><th>Koota</th><th>Score</th><th>Max</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  function findPlanet(rows, p) {
    return rows.find((r) => r.planet === p);
  }

  function allBetweenArc(values, start, end) {
    const inArc = (v) => {
      if (start <= end) return v >= start && v <= end;
      return v >= start || v <= end;
    };
    return values.every(inArc);
  }

  function detectYogaDosha(result) {
    const rows = result.rows;
    const lagna = rows.find((r) => r.planet.startsWith('Lagna'));
    const lagnaSign = signIdxFromDeg(lagna.sidereal);

    const byPlanet = {};
    rows.forEach((r) => {
      byPlanet[r.planet] = r;
    });

    const planets = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
    const findings = [];

    const marsSign = signIdxFromDeg(byPlanet.Mars.sidereal);
    const marsHouse = houseFromSign(marsSign, lagnaSign);
    if ([1,2,4,7,8,12].includes(marsHouse)) {
      findings.push({ type: 'Dosha', name: 'Mangal Dosha', summary: `Mars is in house ${marsHouse} from Lagna.` });
    }

    const rahu = byPlanet.Rahu.sidereal;
    const ketu = byPlanet.Ketu.sidereal;
    const vals = planets.map((p) => byPlanet[p].sidereal);
    if (allBetweenArc(vals, rahu, ketu) || allBetweenArc(vals, ketu, rahu)) {
      findings.push({ type: 'Dosha', name: 'Kaal Sarp Pattern', summary: 'All seven classical planets are between Rahu and Ketu arc.' });
    }

    const jup = byPlanet.Jupiter.sidereal;
    if (angleDiff(jup, rahu) <= 8 || angleDiff(jup, ketu) <= 8) {
      findings.push({ type: 'Dosha', name: 'Guru Chandal Influence', summary: 'Jupiter is conjunct a node within 8 degrees.' });
    }

    const moon = byPlanet.Moon.sidereal;
    const moonSign = signIdxFromDeg(moon);
    const jSign = signIdxFromDeg(jup);
    const rel = ((jSign - moonSign + 12) % 12) + 1;
    if ([1,4,7,10].includes(rel)) {
      findings.push({ type: 'Yoga', name: 'Gaja Kesari Yoga', summary: `Jupiter is in a Kendra (${rel}) from Moon.` });
    }

    const sunSign = signIdxFromDeg(byPlanet.Sun.sidereal);
    const mercSign = signIdxFromDeg(byPlanet.Mercury.sidereal);
    if (sunSign === mercSign) {
      findings.push({ type: 'Yoga', name: 'Budhaditya Yoga', summary: 'Sun and Mercury are in the same sign.' });
    }

    const ninthLord = SIGN_LORDS[(lagnaSign + 8) % 12];
    const tenthLord = SIGN_LORDS[(lagnaSign + 9) % 12];
    if (byPlanet[ninthLord] && byPlanet[tenthLord]) {
      const nSign = signIdxFromDeg(byPlanet[ninthLord].sidereal);
      const tSign = signIdxFromDeg(byPlanet[tenthLord].sidereal);
      if (nSign === tSign) {
        findings.push({ type: 'Yoga', name: 'Dharma-Karma Raj Yoga', summary: '9th and 10th lords are conjunct by sign.' });
      }
    }

    const secondLord = SIGN_LORDS[(lagnaSign + 1) % 12];
    const eleventhLord = SIGN_LORDS[(lagnaSign + 10) % 12];
    if (byPlanet[secondLord] && byPlanet[eleventhLord]) {
      const sSign = signIdxFromDeg(byPlanet[secondLord].sidereal);
      const eSign = signIdxFromDeg(byPlanet[eleventhLord].sidereal);
      if (sSign === eSign) {
        findings.push({ type: 'Yoga', name: 'Dhana Yoga', summary: '2nd and 11th lords are conjunct by sign.' });
      }
    }

    const dusthanaLords = [5,7,11].map((offset) => SIGN_LORDS[(lagnaSign + offset) % 12]);
    const vipreet = dusthanaLords.some((p) => {
      if (!byPlanet[p]) return false;
      const h = houseFromSign(signIdxFromDeg(byPlanet[p].sidereal), lagnaSign);
      return [6,8,12].includes(h);
    });
    if (vipreet) {
      findings.push({ type: 'Yoga', name: 'Vipreet Raj Yoga (Partial)', summary: 'At least one dusthana lord is placed in 6/8/12.' });
    }

    for (const p of planets) {
      const sign = signIdxFromDeg(byPlanet[p].sidereal);
      if (DEBILITATION[p] === sign + 1) {
        findings.push({ type: 'Dosha', name: `${p} Debilitation`, summary: `${p} appears in its debilitation sign (${SIGN_NAMES[sign]}).` });
      }
    }

    return findings;
  }

  function renderYogaDosha(findings) {
    if (!findings.length) {
      return '<div class="card tool-result-card"><h3>No major yoga/dosha trigger found</h3><p>Try a different ayanamsa or verify birth details for finer analysis.</p></div>';
    }
    const blocks = findings.map((f) => `
      <div class="tool-flag ${f.type === 'Yoga' ? 'ok' : 'warn'}">
        <h4>${safeHtml(f.name)} <span>${safeHtml(f.type)}</span></h4>
        <p>${safeHtml(f.summary)}</p>
      </div>
    `).join('');
    return `<div class="tool-result-stack">${blocks}</div>`;
  }

  function transitInsight(natal, transit) {
    const nRows = natal.rows;
    const tRows = transit.rows;

    const natalLagna = signIdxFromDeg(findPlanet(nRows, 'Lagna (Asc)').sidereal);
    const natalMoon = signIdxFromDeg(findPlanet(nRows, 'Moon').sidereal);

    const tSat = signIdxFromDeg(findPlanet(tRows, 'Saturn').sidereal);
    const tJup = signIdxFromDeg(findPlanet(tRows, 'Jupiter').sidereal);
    const tRahu = signIdxFromDeg(findPlanet(tRows, 'Rahu').sidereal);

    const satFromMoon = houseFromSign(tSat, natalMoon);
    const jupFromMoon = houseFromSign(tJup, natalMoon);
    const satFromLagna = houseFromSign(tSat, natalLagna);
    const rahuFromLagna = houseFromSign(tRahu, natalLagna);

    const notes = [];
    if ([12,1,2].includes(satFromMoon)) notes.push('Sade Sati zone active from Moon chart. Practice patience and routine discipline.');
    if ([3,6,11].includes(jupFromMoon)) notes.push('Jupiter transit from Moon is supportive for growth, learning and network support.');
    if ([8,12].includes(satFromLagna)) notes.push('Saturn from Lagna suggests slower outcomes and extra responsibility.');
    if ([1,5,9].includes(rahuFromLagna)) notes.push('Rahu in trinal houses can amplify ambition and unconventional opportunities.');
    if (!notes.length) notes.push('Transit pattern is mixed-neutral currently; focus on steady execution and avoid overreaction.');

    return {
      satFromMoon,
      jupFromMoon,
      satFromLagna,
      rahuFromLagna,
      notes
    };
  }

  function renderTransit(info) {
    const li = info.notes.map((n) => `<li>${safeHtml(n)}</li>`).join('');
    return `
      <div class="card tool-result-card">
        <h3>Transit Snapshot</h3>
        <p><strong>Saturn from Moon:</strong> House ${info.satFromMoon}</p>
        <p><strong>Jupiter from Moon:</strong> House ${info.jupFromMoon}</p>
        <p><strong>Saturn from Lagna:</strong> House ${info.satFromLagna}</p>
        <p><strong>Rahu from Lagna:</strong> House ${info.rahuFromLagna}</p>
        <ul class="tool-list">${li}</ul>
      </div>
    `;
  }

  function bindMatching() {
    const form = byId('matchingForm');
    if (!form) return;

    // Bidirectional geo for both partners
    const geoA = setupBidirectionalGeo('aCity', 'aLat', 'aLon', 'aGeoStatus');
    setupBidirectionalGeo('bCity', 'bLat', 'bLon', 'bGeoStatus');

    // Fill Partner A from URL params (from Quick Start)
    const filled = fillFromUrlParams({ d: 'aDate', t: 'aTime', city: 'aCity' });
    if (filled && geoA) {
      setTimeout(() => geoA.onCityChange(), 300);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const out = byId('matchingOut');
      try {
        const aResult = computeFromInputs('a', 'Partner A');
        const bResult = computeFromInputs('b', 'Partner B');
        const aCore = moonCore(aResult);
        const bCore = moonCore(bResult);
        const score = ashtakootaScore(aCore, bCore);
        out.innerHTML = renderMatchResult(aCore, bCore, score);
      } catch (err) {
        out.innerHTML = `<div class="card tool-result-card" style="color:#a8420d">${safeHtml(err.message || 'Unable to compute matching.')}</div>`;
      }
    });
  }

  function bindYogaDosha() {
    const form = byId('yogaDoshaForm');
    if (!form) return;

    const geo = setupBidirectionalGeo('ydCity', 'ydLat', 'ydLon', 'ydGeoStatus');

    // Fill from URL params (from Quick Start)
    const filled = fillFromUrlParams({ d: 'ydDate', t: 'ydTime', city: 'ydCity' });
    if (filled && geo) {
      setTimeout(() => geo.onCityChange(), 300);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const out = byId('yogaDoshaOut');
      try {
        const result = computeFromInputs('yd', 'Native');
        const findings = detectYogaDosha(result);
        out.innerHTML = renderYogaDosha(findings);
      } catch (err) {
        out.innerHTML = `<div class="card tool-result-card" style="color:#a8420d">${safeHtml(err.message || 'Unable to compute yoga-dosha.')}</div>`;
      }
    });
  }

  function bindTransit() {
    const form = byId('transitForm');
    if (!form) return;

    const geo = setupBidirectionalGeo('trCity', 'trLat', 'trLon', 'trGeoStatus');

    // Fill from URL params (from Quick Start)
    const filled = fillFromUrlParams({ d: 'trDate', t: 'trTime', city: 'trCity' });
    if (filled && geo) {
      setTimeout(() => geo.onCityChange(), 300);
    }

    const trDate = byId('trTransitDate');
    if (trDate && !trDate.value) {
      trDate.value = todayISO();
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const out = byId('transitOut');
      try {
        const natal = computeFromInputs('tr', 'Native');
        const d = byId('trTransitDate').value; // native date gives yyyy-mm-dd
        const t = '12:00';
        const tz = parseNum(byId('trTz').value);
        const lat = parseNum(byId('trLat').value);
        const lon = parseNum(byId('trLon').value);
        const transit = computePositions(d, t, tz, lat, lon, 'lahiri', 'Transit');
        const info = transitInsight(natal, transit);
        out.innerHTML = renderTransit(info);
      } catch (err) {
        out.innerHTML = `<div class="card tool-result-card" style="color:#a8420d">${safeHtml(err.message || 'Unable to compute transit analysis.')}</div>`;
      }
    });
  }

  function bindToolFinder() {
    const input = byId('toolFinder');
    const cards = Array.from(document.querySelectorAll('[data-tool-card]'));
    if (!input || !cards.length) return;

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      cards.forEach((card) => {
        const t = (card.getAttribute('data-keywords') || '').toLowerCase();
        card.style.display = q && !t.includes(q) ? 'none' : '';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindMatching();
    bindYogaDosha();
    bindTransit();
    bindToolFinder();
  });
})();
