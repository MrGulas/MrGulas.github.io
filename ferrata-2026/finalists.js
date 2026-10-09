(() => {
  const tabs = [...document.querySelectorAll('.routeTab')];
  const panels = [...document.querySelectorAll('[data-route-panel]')];
  const activate = id => {
    tabs.forEach(b => b.classList.toggle('is-active', b.dataset.target === id));
    panels.forEach(p => {
      const active = p.id === id;
      p.classList.toggle('is-active', active);
      p.hidden = !active;
    });
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  };
  tabs.forEach(btn => btn.addEventListener('click', () => activate(btn.dataset.target)));
  const initial = location.hash.replace('#','');
  if (['rotmandl','dachstein','reiteralm','giglach','stoder'].includes(initial)) activate(initial);

  document.querySelectorAll('.photoGrid img').forEach(img => {
    const removeBrokenTile = () => img.closest('figure')?.remove();
    img.addEventListener('error', removeBrokenTile, {once:true});
    if (img.complete && !img.naturalWidth) removeBrokenTile();
  });

  const key = 'ferrata-2026-final-custom-routes';
  const form = document.getElementById('customRouteForm');
  const list = document.getElementById('customRoutes');
  const load = () => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  };
  const save = items => localStorage.setItem(key, JSON.stringify(items));
  const esc = s => String(s || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  const render = () => {
    const items = load();
    if (!items.length) {
      list.innerHTML = '<p class="note">Пока нет вручную добавленных вариантов.</p>';
      return;
    }
    list.innerHTML = items.map((x,i) => `<article class="customRouteCard">
      ${x.photo ? `<img src="${esc(x.photo)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
      <div class="customRouteBody">
        <div class="customRouteMeta">${esc(x.type)} · ${esc(x.difficulty || 'сложность не указана')} · ${esc(x.time || 'время не указано')}</div>
        <h3>${esc(x.name)}</h3>
        <p>${esc(x.notes)}</p>
        <div class="customRouteActions">
          ${x.link ? `<a href="${esc(x.link)}" target="_blank" rel="noopener">Открыть ↗</a>` : '<span></span>'}
          <button type="button" data-remove="${i}">Удалить</button>
        </div>
      </div>
    </article>`).join('');
  };
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    const items = load();
    items.unshift(d);
    save(items);
    form.reset();
    render();
  });
  list?.addEventListener('click', e => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    const items = load();
    items.splice(Number(btn.dataset.remove), 1);
    save(items);
    render();
  });
  render();
})();
