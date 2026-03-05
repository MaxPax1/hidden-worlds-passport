'use strict';

// ── CARD DATA ────────────────────────────────────────────────────────────────

const CITY_GROUPS = [
  {
    slug: 'london',
    city: 'LONDON',
    country: 'United Kingdom',
    flag: '🇬🇧',
    season: 'I',
    year: '2026',
    cards: [
      {
        id: 'LDN-SN-000175',
        subject: 'THE SEVEN NOSES',
        category: 'Art & Culture',
        card_number: 'I',
        quote: 'Thirty-five noses.\nFourteen years of silence.',
        blurb: 'In 1997, an unknown artist secretly fixed 35 plaster noses across Soho — a silent protest against surveillance cameras. He stayed hidden for 14 years; legend promises fortune to anyone who finds all seven.',
        front: 'cards/seven-noses/front.png',
        back:  'cards/seven-noses/back.png',
        art:   'cards/seven-noses/art.png',
      },
      {
        id: 'LDN-NC-000176',
        subject: 'NOTTING HILL CARNIVAL',
        category: 'Art & Culture',
        card_number: 'II',
        quote: 'They answered with music.',
        blurb: 'In 1958, racist mobs attacked Caribbean families across Notting Hill. The community\'s answer was not retreat — steel bands marched the same streets, turning grief into Europe\'s loudest celebration.',
        front: 'cards/notting-hill-carnival/front.png',
        back:  'cards/notting-hill-carnival/back.png',
        art:   'cards/notting-hill-carnival/art.png',
      },
      {
        id: 'LDN-UR-000177',
        subject: 'THE UNDERGROUND REPUBLICS',
        category: 'Hidden History',
        card_number: 'III',
        quote: 'When the city went dark,\nthey built one below.',
        blurb: 'When the government banned Underground sheltering during the Blitz, Londoners broke in and built a city inside — bunks, a theatre, a library, elected committees. When authority abandoned them, they governed themselves.',
        front: 'cards/underground-republics/front.png',
        back:  'cards/underground-republics/back.png',
        art:   'cards/underground-republics/art.png',
      },
    ],
  },
  {
    slug: 'malta',
    city: 'MALTA',
    country: 'Malta',
    flag: '🇲🇹',
    season: 'I',
    year: '2026',
    cards: [
      {
        id: 'MLT-OC-000001',
        subject: 'ORACLE CHAMBER',
        category: 'Hidden History',
        card_number: 'I',
        quote: 'Architecture amplifies authority.',
        blurb: 'Built 5,000 years ago, the Oracle Chamber of the Ħal Saflieni Hypogeum was carved to amplify the human voice into something divine. Whoever spoke here didn\'t need an army — the stone obeyed.',
        front: 'cards/malta-oracle-chamber/front.png',
        back:  'cards/malta-oracle-chamber/back.png',
      },
    ],
  },
  {
    slug: 'frankfurt',
    city: 'FRANKFURT',
    country: 'Germany',
    flag: '🇩🇪',
    season: 'I',
    year: '2026',
    cards: [
      {
        id: 'FRA-WK-000001',
        subject: 'WAHLKAPELLE',
        category: 'Hidden History',
        card_number: 'I',
        quote: 'Seven electors. One crown.\nBread and water.',
        blurb: 'Hidden inside Frankfurt Cathedral, seven men were locked in the Election Chapel and fed only bread and water until they agreed on the next Holy Roman Emperor. Europe\'s most powerful throne was decided by starvation.',
        front: 'cards/frankfurt-wahlkapelle/front.png',
        back:  'cards/frankfurt-wahlkapelle/back.png',
      },
    ],
  },
  {
    slug: 'dubrovnik',
    city: 'DUBROVNIK',
    country: 'Croatia',
    flag: '🇭🇷',
    season: 'I',
    year: '2026',
    cards: [
      {
        id: 'DBV-RB-000001',
        subject: 'RUĐER BOŠKOVIĆ',
        category: 'Hidden History',
        card_number: 'I',
        quote: 'A republic sends its sharpest mind,\nnot its loudest voice.',
        blurb: 'The Republic of Ragusa didn\'t build the largest army — it sent Ruđer Bošković, a polymath who protected Dubrovnik\'s independence through intellect alone. For a small republic surrounded by empires, brains were the deadliest weapon.',
        front: 'cards/dubrovnik-rudjer-boskovic/front.png',
        back:  'cards/dubrovnik-rudjer-boskovic/back.png',
      },
    ],
  },
];

// Flat lookup: archive_id → { card, group }
const CARD_BY_ID = {};
CITY_GROUPS.forEach(g => g.cards.forEach(c => {
  if (c.id) CARD_BY_ID[c.id] = { card: c, group: g };
}));

// Category → CSS class
function categoryClass(cat) {
  if (!cat) return 'default';
  const map = {
    'Hidden History': 'category-hidden-history',
    'Art & Culture':  'category-art-culture',
    'Local Legends':  'category-local-legends',
    'Culinary Secrets': 'category-culinary',
    'Nature & Wildlife': 'category-culinary',
  };
  return map[cat] || 'default';
}

// ── LOCAL STORAGE ────────────────────────────────────────────────────────────

const LS_KEY = 'hw_unlocked_ids_v2';

function getUnlocked() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); }
  catch { return new Set(); }
}

function saveUnlocked(set) {
  localStorage.setItem(LS_KEY, JSON.stringify([...set]));
}

// ── STATE ────────────────────────────────────────────────────────────────────

let unlocked = new Set();
let currentView = 'home';   // 'home' | 'city'
let currentGroup = null;
let scanStream = null;
let scanRAF = null;
let pendingUnlockCard = null;

// ── GLOBAL STATS ─────────────────────────────────────────────────────────────

function globalStats() {
  const total   = CITY_GROUPS.flatMap(g => g.cards.filter(c => c.id)).length;
  const collected = CITY_GROUPS.flatMap(g => g.cards.filter(c => c.id && unlocked.has(c.id))).length;
  return { total, collected };
}

// ── NAVIGATION ───────────────────────────────────────────────────────────────

function showView(view, group) {
  currentView = view;
  currentGroup = group || null;

  const homeEl  = document.getElementById('view-home');
  const cityEl  = document.getElementById('view-city');
  const backBtn = document.getElementById('header-back');
  const brand   = document.getElementById('header-brand');
  const cityHdr = document.getElementById('header-city');

  if (view === 'home') {
    homeEl.hidden = false;
    cityEl.hidden = true;
    backBtn.hidden = true;
    brand.hidden = false;
    cityHdr.hidden = true;
    renderHome();
  } else {
    homeEl.hidden = true;
    cityEl.hidden = false;
    backBtn.hidden = false;
    brand.hidden = true;
    cityHdr.hidden = false;
    cityHdr.innerHTML = `
      <span class="header-city-name">${group.flag}&nbsp; ${group.city}</span>
      <span class="header-city-sub">Season ${group.season} · ${group.year}</span>
    `;
    renderCityAlbum(group);
  }

  window.scrollTo(0, 0);
}

// ── RENDER HOME ──────────────────────────────────────────────────────────────

function renderHome() {
  const { total, collected } = globalStats();

  document.getElementById('profile-count').textContent =
    `${collected} / ${total} cards`;
  document.getElementById('global-progress-fill').style.width =
    `${total ? (collected / total) * 100 : 0}%`;

  const grid = document.getElementById('city-grid');
  grid.innerHTML = '';

  CITY_GROUPS.forEach(group => {
    const realCards = group.cards.filter(c => c.id);
    const totalCards = group.cards.length;
    const unlockedCount = realCards.filter(c => unlocked.has(c.id)).length;
    const pct = totalCards ? (unlockedCount / totalCards) * 100 : 0;

    const tile = document.createElement('div');
    tile.className = 'city-tile';
    tile.innerHTML = `
      <div class="city-tile-flag">${group.flag}</div>
      <div class="city-tile-name">${group.city}</div>
      <div class="city-tile-season">Season ${group.season} · ${group.year}</div>
      <div class="city-tile-progress-text"><strong>${unlockedCount}</strong> / ${totalCards} cards</div>
      <div class="city-tile-bar"><div class="city-tile-bar-fill" style="width:${pct}%"></div></div>
    `;
    tile.addEventListener('click', () => showView('city', group));
    grid.appendChild(tile);
  });
}

// ── RENDER CITY ALBUM ────────────────────────────────────────────────────────

function renderCityAlbum(group) {
  const realCards = group.cards.filter(c => c.id);
  const totalCards = group.cards.length;
  const unlockedCount = realCards.filter(c => unlocked.has(c.id)).length;

  document.getElementById('album-meta').innerHTML = `
    <div class="album-progress-text"><strong>${unlockedCount}</strong> / ${totalCards} cards collected</div>
    <div class="progress-bar-track">
      <div class="progress-bar-fill" style="width:${totalCards ? (unlockedCount / totalCards) * 100 : 0}%"></div>
    </div>
  `;

  const grid = document.getElementById('card-grid');
  grid.innerHTML = '';

  group.cards.forEach(card => {
    const isUnlocked = card.id && unlocked.has(card.id);
    const artSrc = card.art || card.front || '';

    const tile = document.createElement('div');
    tile.className = `card-tile ${isUnlocked ? 'unlocked' : 'locked'}`;
    if (card.id) tile.dataset.cardId = card.id;

    if (isUnlocked) {
      tile.innerHTML = `
        <img class="card-thumb" src="${card.front}" alt="${card.subject}" loading="lazy" />
        <div class="card-number-badge">${card.card_number}</div>
      `;
      tile.addEventListener('click', () => openModal(card, group));
    } else {
      tile.innerHTML = `
        <img class="card-thumb" src="${artSrc}" alt="Locked card" loading="lazy" />
        <div class="lock-overlay">
          <div class="lock-badge">
            <span class="lock-icon">🔒</span>
            <span class="lock-label">${card.card_number}</span>
          </div>
        </div>
        <div class="card-number-badge">${card.card_number}</div>
      `;
      tile.addEventListener('click', () => showToast('Scan the QR on your card to unlock'));
    }

    grid.appendChild(tile);
  });
}

// ── MODAL ────────────────────────────────────────────────────────────────────

let flipState = false;

function openModal(card, group) {
  flipState = false;
  const overlay  = document.getElementById('modal-overlay');
  const flipCard = document.getElementById('flip-card');

  document.getElementById('modal-city-label').textContent =
    `${group.flag}  ${group.city} · CARD ${card.card_number}`;

  document.getElementById('modal-front-img').src = card.front;
  document.getElementById('modal-back-img').src  = card.back;
  flipCard.classList.remove('flipped');

  document.getElementById('modal-quote').innerHTML =
    card.quote.split('\n').map(l => `<span>${l}</span>`).join('<br/>');

  const catClass = categoryClass(card.category);
  document.getElementById('modal-meta').innerHTML = [
    `<span class="meta-chip ${catClass}">${card.category}</span>`,
    `<span class="meta-chip default">Season ${group.season}</span>`,
    `<span class="meta-chip default">${group.year}</span>`,
    `<span class="meta-chip archive">${card.id}</span>`,
  ].join('');

  document.getElementById('modal-blurb').textContent = card.blurb;

  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function toggleFlip() {
  flipState = !flipState;
  document.getElementById('flip-card').classList.toggle('flipped', flipState);
}

// ── QR SCANNER ───────────────────────────────────────────────────────────────

async function openScanner() {
  const overlay = document.getElementById('scanner-overlay');
  document.getElementById('scanner-result').textContent = '';
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  const readerEl = document.getElementById('qr-reader');
  readerEl.innerHTML = '';

  let video;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    scanStream = stream;
    video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    readerEl.appendChild(video);
    video.srcObject = stream;
    await video.play();
  } catch (e) {
    document.getElementById('scanner-result').textContent =
      'Camera not available. Check permissions.';
    return;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  function tick() {
    if (!scanStream) return;
    if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      if (window.jsQR) {
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (code) { handleScan(code.data); return; }
      }
    }
    scanRAF = requestAnimationFrame(tick);
  }
  scanRAF = requestAnimationFrame(tick);
}

function closeScanner() {
  const overlay = document.getElementById('scanner-overlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (scanStream) { scanStream.getTracks().forEach(t => t.stop()); scanStream = null; }
  if (scanRAF) { cancelAnimationFrame(scanRAF); scanRAF = null; }
  document.getElementById('qr-reader').innerHTML = '';
}

function handleScan(text) {
  text = text.trim();
  // New QR codes encode a full URL — extract the archive_id from the ?unlock= param
  try {
    const url = new URL(text);
    const id = url.searchParams.get('unlock');
    if (id) text = id;
  } catch (_) {
    // Not a URL — treat as plain archive_id (backwards compat)
  }
  const entry = CARD_BY_ID[text];
  if (!entry) {
    document.getElementById('scanner-result').textContent = '⚠ Card not recognised';
    return;
  }
  const { card, group } = entry;
  if (unlocked.has(card.id)) {
    closeScanner();
    showToast('Already in your collection');
    showView('city', group);
    openModal(card, group);
    return;
  }
  unlocked.add(card.id);
  saveUnlocked(unlocked);
  closeScanner();
  // Re-render whatever is visible
  if (currentView === 'city' && currentGroup === group) renderCityAlbum(group);
  else renderHome();
  showUnlockReveal(card, group);
}

// ── UNLOCK REVEAL ────────────────────────────────────────────────────────────

function showUnlockReveal(card, group) {
  pendingUnlockCard = { card, group };
  document.getElementById('unlock-card-img').src = card.front;
  document.getElementById('unlock-label').textContent = card.subject;
  const overlay = document.getElementById('unlock-overlay');
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    const tile = document.querySelector(`[data-card-id="${card.id}"]`);
    if (tile) {
      tile.classList.add('just-unlocked');
      tile.addEventListener('animationend', () => tile.classList.remove('just-unlocked'), { once: true });
    }
  });
}

function dismissUnlockReveal() {
  const overlay = document.getElementById('unlock-overlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  if (pendingUnlockCard) {
    const { card, group } = pendingUnlockCard;
    pendingUnlockCard = null;
    showView('city', group);
    openModal(card, group);
  }
}

// ── TOAST ─────────────────────────────────────────────────────────────────────

let toastTimer = null;

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── URL UNLOCK ────────────────────────────────────────────────────────────────

function handleUrlUnlock() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('unlock');
  if (!id) return;
  // Clean up URL so refresh doesn't re-trigger
  history.replaceState(null, '', window.location.pathname);
  const entry = CARD_BY_ID[id];
  if (!entry) return;
  const { card, group } = entry;
  if (unlocked.has(card.id)) {
    showView('city', group);
    openModal(card, group);
    return;
  }
  unlocked.add(card.id);
  saveUnlocked(unlocked);
  renderHome();
  showUnlockReveal(card, group);
}

// ── INIT ──────────────────────────────────────────────────────────────────────

function init() {
  unlocked = getUnlocked();

  document.getElementById('fab-scan').addEventListener('click', openScanner);
  document.getElementById('scanner-close').addEventListener('click', closeScanner);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('flip-scene').addEventListener('click', toggleFlip);
  document.getElementById('unlock-dismiss').addEventListener('click', dismissUnlockReveal);
  document.getElementById('header-back').addEventListener('click', () => showView('home'));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (document.getElementById('unlock-overlay').classList.contains('open')) dismissUnlockReveal();
      else if (document.getElementById('scanner-overlay').classList.contains('open')) closeScanner();
      else if (document.getElementById('modal-overlay').classList.contains('open')) closeModal();
    }
  });

  showView('home');
  handleUrlUnlock();
}

document.addEventListener('DOMContentLoaded', init);
