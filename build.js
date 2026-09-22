// Builds the Siren Glam site into dist/ from src/template.html + content/*.json
// Run: node build.js
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const WA_NUMBER = '254797351366';

const readJSON = (f, fallback) => {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
    return Array.isArray(d) ? d : (d && Array.isArray(d.items) ? d.items : fallback);
  } catch (e) { console.warn('Could not read ' + f + ': ' + e.message); return fallback; }
};
const esc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const img = (p) => String(p || '').trim().replace(/^\/+/, '');
const lower = (s) => String(s || '').trim().toLowerCase();
const wa = (text) => 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());

const WA_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-2-1.2-.7-.6-1.2-1.4-1.4-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.1.2-.2.2-.4.1-.2 0-.3 0-.4 0-.1-.5-1.3-.7-1.7-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 4 3.4.6.2 1 .4 1.3.5.6.2 1.1.1 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z"/></svg>';

// ---------- products ----------
const products = readJSON('content/products.json', [])
  .filter(p => p && p.name && p.image && !p.hide);

const altFor = (p) => {
  const bits = [p.shade, p.shape ? lower(p.shape) + ' shape' : ''].filter(Boolean).join(', ');
  return p.name + ' press-on nails worn on a hand' + (bits ? ' — ' + bits : '');
};

const productCards = products.map((p, i) => {
  const price = Number(p.price) || 0;
  const orderLink = wa(`Hi Siren Glam! I'd like to order ${p.name} – KSh ${price}. Please help me with sizing and delivery.`);
  const alt = altFor(p);
  const spec = [p.shade, p.shape].filter(Boolean).map(esc).join('<i>·</i>');
  return `      <article class="card" data-reveal style="animation-delay:${(i * 0.05).toFixed(2)}s"
        data-name="${esc(p.name)}" data-price="${price}" data-shade="${esc(p.shade)}" data-shape="${esc(p.shape)}" data-tag="${esc(p.tag)}"
        data-img="${esc(img(p.image))}" data-alt="${esc(alt)}"
        data-desc="${esc(p.description)}"
        data-wa="${esc(orderLink)}">
        <div class="card-media">
          <img src="${esc(img(p.image))}" loading="lazy" decoding="async"
               alt="${esc(alt)}">${p.tag ? `\n          <span class="tag">${esc(p.tag)}</span>` : ''}
        </div>
        <div class="card-body">
          <h3>${esc(p.name)}</h3>
          <p class="spec">${spec}</p>
          <p class="card-price">KSh <span class="count" data-count-to="${price}">${price}</span> <span class="unit">per set</span></p>
          <a class="btn btn-wine btn-block" href="${esc(orderLink)}" target="_blank" rel="noopener">
            ${WA_ICON} Order on WhatsApp
          </a>
          <button type="button" class="view-details">View full details &rarr;</button>
        </div>
      </article>`;
}).join('\n');

const prices = products.map(p => Number(p.price) || 0).filter(Boolean);
const minP = prices.length ? Math.min(...prices) : 0;
const maxP = prices.length ? Math.max(...prices) : 0;
const pricePhrase = !prices.length ? 'made to order'
  : minP === maxP ? `now KSh ${minP} each` : `from KSh ${minP} per set`;

const carousel = products.map(p => ({ src: img(p.image), alt: altFor(p) }));
const heroA = carousel[0] || { src: 'images/logo.jpg', alt: 'Siren Glam' };
const heroBIndex = carousel.length > 1 ? Math.min(5, carousel.length - 1) : 0;
const heroB = carousel[heroBIndex] || heroA;

// ---------- reviews ----------
const reviews = readJSON('content/reviews.json', [])
  .filter(r => r && r.quote && !r.hide);

const stars = (n) => {
  const k = Math.max(1, Math.min(5, Math.round(Number(n) || 5)));
  return '&#9733;'.repeat(k) + '&#9734;'.repeat(5 - k);
};

let reviewsHtml;
if (reviews.length) {
  reviewsHtml = `<div class="reviews-grid" data-reveal>\n` + reviews.map(r => {
    const who = [r.name, r.area].filter(Boolean).map(esc).join(', ');
    const photo = r.photo ? `
        <div class="review-photo"><img src="${esc(img(r.photo))}" loading="lazy" decoding="async" alt="${esc((r.name ? r.name + "'s" : 'Customer') + ' Siren Glam nails' + (r.set ? ' — ' + r.set : ''))}"></div>` : '';
    return `      <div class="review-card">${photo}
        <div class="stars" aria-label="${Math.max(1, Math.min(5, Math.round(Number(r.stars) || 5)))} out of 5 stars">${stars(r.stars)}</div>
        <blockquote>${esc(r.quote)}</blockquote>
        <cite>${who || 'Siren Glam customer'}${r.set ? ` &middot; ${esc(r.set)}` : ''}</cite>
      </div>`;
  }).join('\n') + `\n    </div>`;
} else {
  const sample = `      <div class="review-card">
        <span class="sample-tag">Sample</span>
        <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <blockquote>Add a short quote from your customer here &mdash; what they loved, how it fit, how it felt.</blockquote>
        <cite>Customer name, area</cite>
      </div>`;
  reviewsHtml = `<div class="reviews-grid" data-reveal>\n${sample}\n${sample}\n${sample}\n    </div>
    <p class="reviews-cta">These are placeholder cards &mdash; swap them for real customer reviews as they come in.</p>`;
}

// ---------- assemble ----------
let html = fs.readFileSync(path.join(ROOT, 'src/template.html'), 'utf8');
const put = (token, value) => {
  if (!html.includes(token)) throw new Error('Template is missing ' + token);
  html = html.split(token).join(value);
};
put('<!--@PRODUCTS-->', productCards);
put('<!--@REVIEWS-->', reviewsHtml);
put('{{COUNT}}', String(products.length));
put('{{PRICE_PHRASE}}', esc(pricePhrase));
put('{{HERO_A_SRC}}', esc(heroA.src));
put('{{HERO_A_ALT}}', esc(heroA.alt));
put('{{HERO_B_SRC}}', esc(heroB.src));
put('{{HERO_B_ALT}}', esc(heroB.alt));
put('{{HERO_B_INDEX}}', String(heroBIndex));
put('{{CAROUSEL}}', JSON.stringify(carousel).replace(/</g, '\\u003c'));

// ---------- write dist ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
fs.cpSync(path.join(ROOT, 'images'), path.join(OUT, 'images'), { recursive: true, filter: (s) => !s.endsWith('.DS_Store') });
if (fs.existsSync(path.join(ROOT, 'preview.jpg'))) fs.copyFileSync(path.join(ROOT, 'preview.jpg'), path.join(OUT, 'preview.jpg'));

console.log(`Built dist/ with ${products.length} nail sets and ${reviews.length} reviews.`);
