// --- Date utilities ---
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function isoToDMY(iso) {
  if (!iso) return '';
  const p = iso.split('-');
  return p.length === 3 ? p[2]+'-'+p[1]+'-'+p[0] : iso;
}
function dmyToISO(dmy) {
  if (!dmy) return '';
  const p = dmy.split(/[-\/\.]/);
  return p.length === 3 ? p[2]+'-'+p[1]+'-'+p[0] : dmy;
}
window.todayISO = todayISO;
window.isoToDMY = isoToDMY;
window.dmyToISO = dmyToISO;
window.todayDMY = function(){ return isoToDMY(todayISO()); };

// Fill all date inputs with today if empty
function initDateFields() {
  const today = todayISO();
  document.querySelectorAll('input[type="date"]').forEach(el => {
    if (!el.value) el.value = today;
  });
}

// --- Reverse geocode: lat/lon -> city name ---
async function reverseGeocode(lat, lon) {
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat='+lat+'&lon='+lon);
    if (r.ok) {
      const d = await r.json();
      const city = d.address?.city || d.address?.town || d.address?.village || d.address?.state || '';
      const country = d.address?.country || '';
      return city ? (city + (country ? ', ' + country : '')) : '';
    }
  } catch(_){}
  return '';
}
window.reverseGeocode = reverseGeocode;

// --- Forward geocode: city -> lat/lon (+ IANA timezone) ---
async function forwardGeocode(city) {
  if (!city || !city.trim()) return null;
  try {
    const r = await fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(city)+'&count=1&language=en&format=json');
    if (r.ok) {
      const d = await r.json();
      if (d.results && d.results[0]) {
        const g = d.results[0];
        return { lat: g.latitude, lon: g.longitude, label: (g.name||'') + ', ' + (g.country||''), timeZone: g.timezone || null };
      }
    }
  } catch(_){}
  return null;
}
window.forwardGeocode = forwardGeocode;

// --- IANA timezone name -> UTC offset in hours for a given local date/time (DST-aware) ---
function ianaOffsetHours(timeZone, dateStr, timeStr) {
  if (!timeZone) return null;
  const now = new Date();
  let y = now.getFullYear(), mo = now.getMonth() + 1, d = now.getDate(), hh = 12, mm = 0;
  if (dateStr) { const p = dateStr.split('-').map(Number); if (p.length === 3) { y = p[0]; mo = p[1]; d = p[2]; } }
  if (timeStr) { const p = timeStr.split(':').map(Number); if (p.length >= 2) { hh = p[0]; mm = p[1]; } }
  if (![y, mo, d, hh, mm].every(Number.isFinite)) return null;
  try {
    const probeUtc = new Date(Date.UTC(y, mo - 1, d, hh, mm, 0));
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    const parts = fmt.formatToParts(probeUtc);
    const val = (t) => Number(parts.find(p => p.type === t)?.value);
    const tzAsUtc = Date.UTC(val('year'), val('month') - 1, val('day'), val('hour'), val('minute'), val('second'));
    const off = (tzAsUtc - probeUtc.getTime()) / 3600000;
    return Number.isFinite(off) ? Math.round(off * 100) / 100 : null;
  } catch (_) { return null; }
}
window.ianaOffsetHours = ianaOffsetHours;

// --- Bidirectional city <-> coordinates sync (optionally auto-fills timezone) ---
function setupBidirectionalGeo(cityId, latId, lonId, statusId, tzId, dateId, timeId) {
  const cityEl = document.getElementById(cityId);
  const latEl = document.getElementById(latId);
  const lonEl = document.getElementById(lonId);
  const statusEl = statusId ? document.getElementById(statusId) : null;
  const tzEl = tzId ? document.getElementById(tzId) : null;
  if (!cityEl || !latEl || !lonEl) return;

  let lastSource = null; // 'city' or 'coords'

  function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }

  function applyTimezone(timeZone) {
    if (!tzEl || !timeZone) return null;
    const dateStr = dateId ? (document.getElementById(dateId)?.value || '') : '';
    const timeStr = timeId ? (document.getElementById(timeId)?.value || '') : '';
    const off = ianaOffsetHours(timeZone, dateStr, timeStr);
    if (Number.isFinite(off)) {
      tzEl.value = off;
      return off;
    }
    return null;
  }

  // City changed -> update coords (+ timezone)
  async function onCityChange() {
    const city = cityEl.value.trim();
    if (!city) return;
    lastSource = 'city';
    setStatus('Finding coordinates...');
    const g = await forwardGeocode(city);
    if (g && lastSource === 'city') {
      latEl.value = g.lat.toFixed(4);
      lonEl.value = g.lon.toFixed(4);
      const off = applyTimezone(g.timeZone);
      const tzNote = (off !== null && off !== undefined) ? ` (UTC${off >= 0 ? '+' : ''}${off})` : '';
      setStatus('Using ' + g.label + tzNote);
    } else if (lastSource === 'city') {
      setStatus('City not found');
    }
  }

  // Coords changed -> update city
  async function onCoordsChange() {
    const lat = parseFloat(latEl.value);
    const lon = parseFloat(lonEl.value);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    lastSource = 'coords';
    setStatus('Looking up location...');
    const name = await reverseGeocode(lat, lon);
    if (name && lastSource === 'coords') {
      cityEl.value = name;
      setStatus('Location: ' + name);
    } else if (lastSource === 'coords') {
      setStatus('');
    }
  }

  cityEl.addEventListener('blur', onCityChange);
  cityEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); onCityChange(); } });
  latEl.addEventListener('change', onCoordsChange);
  lonEl.addEventListener('change', onCoordsChange);

  return { onCityChange };
}
window.setupBidirectionalGeo = setupBidirectionalGeo;

// --- Read URL params and fill form fields ---
function fillFromUrlParams(fieldMap) {
  const qp = new URLSearchParams(window.location.search);
  let filled = false;
  for (const [param, elId] of Object.entries(fieldMap)) {
    const val = qp.get(param);
    if (val) {
      const el = document.getElementById(elId);
      if (el) { el.value = val; filled = true; }
    }
  }
  return filled;
}
window.fillFromUrlParams = fillFromUrlParams;

document.addEventListener('DOMContentLoaded', () => {
  initDateFields();

  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) toggle.addEventListener('click', () => nav.classList.toggle('open'));

  const booking = document.getElementById('bookingForm');
  if (booking) {
    booking.addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(booking).entries());
      alert('Booking received for ' + (data.plan||'plan') + '.\nWe will contact ' + data.name + ' at ' + data.phone + '.');
      booking.reset();
    });
  }

  const contact = document.getElementById('contactForm');
  if (contact) {
    contact.addEventListener('submit', e => {
      e.preventDefault();
      alert('Thanks! We will reply soon.');
      contact.reset();
    });
  }

  // Quick Start form on homepage
  const qk = document.getElementById('quickKundli');
  if (qk) {
    qk.addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(qk).entries());
      const next = data.next || 'panchang.html';
      const params = new URLSearchParams();
      if (data.name) params.set('name', data.name);
      if (data.date) params.set('d', data.date); // native date gives yyyy-mm-dd
      if (data.time) params.set('t', data.time);
      if (data.place) params.set('city', data.place);
      window.location.href = params.toString() ? (next + '?' + params.toString()) : next;
    });
  }

  const toolSearch = document.getElementById('toolSearch');
  if (toolSearch) {
    const cards = Array.from(document.querySelectorAll('#toolGrid [data-keywords]'));
    toolSearch.addEventListener('input', () => {
      const q = toolSearch.value.trim().toLowerCase();
      cards.forEach((card) => {
        const keywords = (card.getAttribute('data-keywords') || '').toLowerCase();
        card.style.display = q && !keywords.includes(q) ? 'none' : '';
      });
    });
  }
});
