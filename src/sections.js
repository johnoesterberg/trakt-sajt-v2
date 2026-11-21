// Bygger sektionerna under hero. Alla texter kommer från content.js.
import { content } from "./content.js";

// Vite hittar de etikettbilder som finns i /assets när sidan byggs.
// Saknas en bild visas en enkel färgplatta i stället.
const images = import.meta.glob("../assets/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});
const img = (name) => images[`../assets/${name}`] ?? null;

// Mörka doftfärger behöver ljus text på platshållaren.
const darkColors = ["#46614b"];

function scentCard(s) {
  const src = img(`etikett-${s.id}.png`);
  const visual = src
    ? `<img src="${src}" alt="Etikett ${s.name}" loading="lazy" />`
    : `<div class="placeholder-visual ${darkColors.includes(s.color) ? "on-dark" : ""}"
           style="background:${s.color}">${s.name}</div>`;
  return `
    <article class="scent-card" style="--scent:${s.color}">
      <div class="scent-visual">${visual}</div>
      <h3>${s.name}</h3>
      <p>${s.text}</p>
    </article>`;
}

function productCard(p) {
  const src = img(`${p.id}.png`);
  const visual = src
    ? `<img src="${src}" alt="${p.name}" loading="lazy" />`
    : `<div class="placeholder-visual">${p.name}</div>`;
  return `
    <article class="product-card">
      <div class="product-visual">${visual}</div>
      <h3>${p.name}</h3>
      <p>${p.text}</p>
      <p class="detail">${p.detail}</p>
    </article>`;
}

export function renderSections() {
  const { story, scents, products, waitlist, footer } = content;

  return `
  <section class="section story" id="berattelse">
    <h2>${story.heading}</h2>
    <div class="story-text">
      <p>${story.text1}</p>
      <p>${story.text2}</p>
    </div>
    <p class="eyebrow">${story.tagline}</p>
  </section>

  <section class="section scents" id="dofter">
    <h2>${scents.heading}</h2>
    <div class="grid grid-4">${scents.items.map(scentCard).join("")}</div>
  </section>

  <section class="section products" id="produkter">
    <h2>${products.heading}</h2>
    <div class="grid grid-3">${products.items.map(productCard).join("")}</div>
    <p class="note">${products.note}</p>
  </section>

  <section class="section waitlist" id="vantelista">
    <h2>${waitlist.heading}</h2>
    <p class="lead">${waitlist.text}</p>
    <form class="waitlist-form" novalidate>
      <label>${waitlist.nameLabel}
        <input type="text" name="name" autocomplete="name" required />
      </label>
      <label>${waitlist.emailLabel}
        <input type="email" name="email" autocomplete="email" required />
      </label>
      <label>${waitlist.scentLabel}
        <select name="scent">
          ${waitlist.scentOptions.map((o) => `<option>${o}</option>`).join("")}
        </select>
      </label>
      <button type="submit">${waitlist.button}</button>
    </form>
    <p class="thanks" role="status" hidden>${waitlist.thanks}</p>
  </section>

  <footer class="footer">
    <p class="footer-brand">${footer.line1}</p>
    <p>${footer.line2}</p>
    <p class="muted">${footer.contact}</p>
  </footer>`;
}

// Väntelistan sparas inte någonstans än – vi visar bara ett tack.
export function setupWaitlist() {
  const form = document.querySelector(".waitlist-form");
  const thanks = document.querySelector(".thanks");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    form.hidden = true;
    thanks.hidden = false;
  });
}
