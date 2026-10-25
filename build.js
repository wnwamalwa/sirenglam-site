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

// ---------- site photos (editable in Pages CMS under "Site photos") ----------
const site = (() => {
  try { const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8')); return d && typeof d === 'object' && !Array.isArray(d) ? d : {}; }
  catch (e) { console.warn('Could not read content/site.json: ' + e.message); return {}; }
})();
const sitePhoto = (key, fallback) => img(site[key]) || fallback;

// ---------- products ----------
const products = readJSON('content/products.json', [])
  .filter(p => p && p.name && p.image && !p.hide);

const altFor = (p) => {
  const bits = [p.shade, p.shape ? lower(p.shape) + ' shape' : ''].filter(Boolean).join(', ');
  return p.name + ' press-on nails worn on a hand' + (bits ? ' — ' + bits : '');
};

// Featured sets first, sold-out sets last; otherwise keep the order set in Pages CMS.
const rank = (p) => (p.sold_out ? 2 : 0) - (p.featured && !p.sold_out ? 1 : 0);
products.sort((a, b) => rank(a) - rank(b));

const productCards = products.map((p, i) => {
  const price = Number(p.price) || 0;
  const was = Number(p.was_price) || 0;
  const soldOut = !!p.sold_out;
  const onSale = !soldOut && was > price && price > 0;
  const tag = soldOut ? 'Sold out' : (p.tag || (onSale ? 'Sale' : ''));
  const tagClass = soldOut ? ' tag-sold' : (onSale && !p.tag ? ' tag-sale' : '');
  const orderLink = soldOut
    ? wa(`Hi Siren Glam! Is ${p.name} back in stock? Please let me know when it's available.`)
    : wa(`Hi Siren Glam! I'd like to order ${p.name} – KSh ${price}. Please help me with sizing and delivery.`);
  const btnLabel = soldOut ? "Ask when it's back" : 'Order on WhatsApp';
  const priceHtml = (onSale ? `<s class="was">KSh ${was}</s> ` : '') + `KSh ${price} <span class="unit">per set</span>`;
  const alt = altFor(p);
  const spec = [p.shade, p.shape].filter(Boolean).map(esc).join('<i>·</i>');
  return `      <article class="card${soldOut ? ' is-sold-out' : ''}" data-reveal style="animation-delay:${(i * 0.05).toFixed(2)}s"
        data-name="${esc(p.name)}" data-price="${price}" data-shade="${esc(p.shade)}" data-shape="${esc(p.shape)}" data-tag="${esc(tag)}"
        data-img="${esc(img(p.image))}" data-alt="${esc(alt)}"
        data-desc="${esc(p.description)}"
        data-price-html="${esc(priceHtml)}" data-btn="${esc(btnLabel)}"
        data-wa="${esc(orderLink)}">
        <div class="card-media">
          <img src="${esc(img(p.image))}" loading="lazy" decoding="async"
               alt="${esc(alt)}">${tag ? `\n          <span class="tag${tagClass}">${esc(tag)}</span>` : ''}
        </div>
        <div class="card-body">
          <h3>${esc(p.name)}</h3>
          <p class="spec">${spec}</p>
          <p class="card-price">${priceHtml}</p>
          <a class="btn ${soldOut ? 'btn-ghost' : 'btn-wine'} btn-block" href="${esc(orderLink)}" target="_blank" rel="noopener">
            ${WA_ICON} ${btnLabel}
          </a>
          <button type="button" class="view-details">View full details &rarr;</button>
        </div>
      </article>`;
}).join('\n');

// Prices and top photos only use sets that are in stock (all sets if everything is sold out).
const inStock = products.filter(p => !p.sold_out);
const shown = inStock.length ? inStock : products;
const prices = shown.map(p => Number(p.price) || 0).filter(Boolean);
const minP = prices.length ? Math.min(...prices) : 0;
const maxP = prices.length ? Math.max(...prices) : 0;
const pricePhrase = !prices.length ? 'made to order'
  : minP === maxP ? `now KSh ${minP} each` : `from KSh ${minP} per set`;

const slide = (p) => ({ src: img(p.image), alt: altFor(p) });
const featured = shown.filter(p => p.featured);
const others = shown.filter(p => !p.featured);
let carouselA;
if (featured.length && others.length) {
  // featured photo every other slide: F, 1, F, 2, F, 3 ...
  carouselA = [];
  others.forEach((p, i) => { carouselA.push(slide(featured[i % featured.length])); carouselA.push(slide(p)); });
} else {
  carouselA = shown.map(slide);
}
const carouselB = (others.length ? others : shown).map(slide);
// start the small photo halfway through the list so the two photos rarely line up
for (let k = 0; k < Math.floor(carouselB.length / 2); k++) carouselB.push(carouselB.shift());
const heroA = carouselA[0] || { src: 'images/logo.jpg', alt: 'Siren Glam' };
const heroB = carouselB[0] || heroA;
const carousel = { a: carouselA, b: carouselB };

// ---------- reviews ----------
const reviews = readJSON('content/reviews.json', [])
  .filter(r => r && r.quote && !r.hide);

const stars = (n) => {
  const k = Math.max(1, Math.min(5, Math.round(Number(n) || 5)));
  return '&#9733;'.repeat(k) + '&#9734;'.repeat(5 - k);
};

// No real reviews yet? Leave the whole reviews section (and its menu links) off the page.
const reviewsHtml = `<div class="reviews-grid" data-reveal>\n` + reviews.map(r => {
    const who = [r.name, r.area].filter(Boolean).map(esc).join(', ');
    const photo = r.photo ? `
        <div class="review-photo"><img src="${esc(img(r.photo))}" loading="lazy" decoding="async" alt="${esc((r.name ? r.name + "'s" : 'Customer') + ' Siren Glam nails' + (r.set ? ' — ' + r.set : ''))}"></div>` : '';
    return `      <div class="review-card">${photo}
        <div class="stars" aria-label="${Math.max(1, Math.min(5, Math.round(Number(r.stars) || 5)))} out of 5 stars">${stars(r.stars)}</div>
        <blockquote>${esc(r.quote)}</blockquote>
        <cite>${who || 'Siren Glam customer'}${r.set ? ` &middot; ${esc(r.set)}` : ''}</cite>
      </div>`;
  }).join('\n') + `\n    </div>`;

// ---------- assemble ----------
let html = fs.readFileSync(path.join(ROOT, 'src/template.html'), 'utf8');
const put = (token, value) => {
  if (!html.includes(token)) throw new Error('Template is missing ' + token);
  html = html.split(token).join(value);
};
put('<!--@PRODUCTS-->', productCards);
put('<!--@REVIEWS-->', reviewsHtml);
if (reviews.length) {
  html = html.replace(/<!--@REVIEWS_(START|END)-->\n?/g, '').replace(/<!--\/?@RL-->/g, '')
             .replace(/[ \t]*<!--@NOREVIEWS_START-->[\s\S]*?<!--@NOREVIEWS_END-->\n?/, '');
} else {
  // No reviews yet: ask customers for one instead of showing an empty section.
  html = html.replace(/[ \t]*<!--@NOREVIEWS_(START|END)-->\n?/g, '');
  html = html.replace(/[ \t]*<!--@REVIEWS_START-->[\s\S]*?<!--@REVIEWS_END-->\n?/, '')
             .replace(/[ \t]*<!--@RL-->[\s\S]*?<!--\/@RL-->\n?/g, '');
}
put('{{COUNT}}', String(products.length));
// Announcement bar (Pages CMS: Site photos & announcement)
const annText = String(site.announcement || '').trim();
const annLink = String(site.announcement_link || '').trim();
const annSafeLink = /^(https?:\/\/|#)/i.test(annLink) ? annLink : '';
const annHtml = site.announcement_on && annText
  ? `<div class="announce">${annSafeLink ? `<a href="${esc(annSafeLink)}"${annSafeLink.startsWith('#') ? '' : ' target="_blank" rel="noopener"'}>${esc(annText)} <span aria-hidden="true">&rarr;</span></a>` : esc(annText)}</div>\n`
  : '';
put('<!--@ANNOUNCE-->\n', annHtml);
// Delivery info (Pages CMS: Delivery info)
const DEFAULT_DELIVERY = [
  { title: 'Where we deliver', text: "Nairobi and surrounding areas. Tell us your location on WhatsApp and we'll confirm you're within our delivery zone." },
  { title: 'Delivery fee', text: "A small delivery fee applies depending on your area — we'll confirm the exact amount with you on WhatsApp before you pay." },
  { title: 'Timeline', text: 'Most orders are delivered within 24–48 hours of confirming your size and payment.' },
  { title: 'Prefer to collect?', text: "Let us know on WhatsApp and we'll arrange a convenient pickup point and time." },
];
let delivery = readJSON('content/delivery.json', DEFAULT_DELIVERY).filter(d => d && (d.title || d.text) && !d.hide);
if (!delivery.length) delivery = DEFAULT_DELIVERY;
put('<!--@DELIVERY-->\n', delivery.map(d => `      <div class="delivery-item">
        <h3>${esc(d.title)}</h3>
        <p>${esc(d.text)}</p>
      </div>
`).join(''));

// Social links (Pages CMS: Site photos & announcement). Accepts a full link or an @handle.
const SOCIAL = {
  instagram: { label: 'Instagram', base: 'https://www.instagram.com/', at: false,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>' },
  tiktok: { label: 'TikTok', base: 'https://www.tiktok.com/@', at: true,
    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.2v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.6a5.8 5.8 0 1 0 5 5.8V9.1a7.4 7.4 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.2-1.5z"/></svg>' },
  facebook: { label: 'Facebook', base: 'https://www.facebook.com/', at: false,
    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8z"/></svg>' },
};
const socialUrl = (key, v) => {
  v = String(v || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '').replace(/[^A-Za-z0-9._-]/g, '');
  return handle ? SOCIAL[key].base + handle : '';
};
put('<!--@SOCIAL-->', Object.keys(SOCIAL).map(k => {
  const u = socialUrl(k, site[k]);
  return u ? `      <a class="foot-social" href="${esc(u)}" target="_blank" rel="noopener">${SOCIAL[k].icon} ${SOCIAL[k].label}</a>\n` : '';
}).join(''));

put('{{LOGO_SRC}}', esc(sitePhoto('logo', 'images/logo.jpg')));
put('{{SIZING_SRC}}', esc(sitePhoto('sizing_photo', 'images/barely-there.jpg')));
put('{{GALLERY_LARGE_SRC}}', esc(sitePhoto('gallery_large', 'images/customer_photo.jpeg')));
put('{{GALLERY_TOP_SRC}}', esc(sitePhoto('gallery_top', 'images/milk-bath.jpg')));
put('{{GALLERY_BOTTOM_SRC}}', esc(sitePhoto('gallery_bottom', 'images/midnight-noir.jpg')));
put('{{PRICE_PHRASE}}', esc(pricePhrase));
put('{{HERO_A_SRC}}', esc(heroA.src));
put('{{HERO_A_ALT}}', esc(heroA.alt));
put('{{HERO_B_SRC}}', esc(heroB.src));
put('{{HERO_B_ALT}}', esc(heroB.alt));
put('{{CAROUSEL_A}}', JSON.stringify(carousel.a).replace(/</g, '\\u003c'));
put('{{CAROUSEL_B}}', JSON.stringify(carousel.b).replace(/</g, '\\u003c'));

// ---------- write dist ----------
try { fs.rmSync(OUT, { recursive: true, force: true }); } catch (e) { /* ignore: files are overwritten below */ }
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
fs.cpSync(path.join(ROOT, 'images'), path.join(OUT, 'images'), { recursive: true, force: false, errorOnExist: false, filter: (s) => !s.endsWith('.DS_Store') });
if (fs.existsSync(path.join(ROOT, 'preview.jpg'))) fs.copyFileSync(path.join(ROOT, 'preview.jpg'), path.join(OUT, 'preview.jpg'));

console.log(`Built dist/ with ${products.length} nail sets and ${reviews.length} reviews.`);
