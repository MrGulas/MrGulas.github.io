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

  // Почасовая облачность: модель Open-Meteo, только по кнопке пользователя.
  const weatherButton = document.getElementById('loadSaturdayForecast');
  const weatherOutput = document.getElementById('morningWeatherOutput');
  const points = [
    {name:'🏔 Dachstein / Hunerkogel 2690 м',lat:47.468014,lon:13.626244,elevation:2690},
    {name:'🧗 Reiteralm / Gasselhöhe 2000 м',lat:47.352781,lon:13.592045,elevation:2000},
    {name:'🔥 Rotmandlspitze 2453 м',lat:47.280714,lon:13.672829,elevation:2453}
  ];
  const weatherNumber = (value,digits) => typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '—';
  weatherButton?.addEventListener('click', async () => {
    weatherButton.disabled = true;
    weatherOutput.textContent = 'Загружаю почасовой прогноз облаков и осадков для трёх локаций…';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 18000);
      let payload;
      try {
        const params = new URLSearchParams({
          latitude:points.map(p=>p.lat).join(','),
          longitude:points.map(p=>p.lon).join(','),
          elevation:points.map(p=>p.elevation).join(','),
          hourly:'cloud_cover,precipitation,precipitation_probability,temperature_2m,snowfall,wind_gusts_10m',
          timezone:'Europe/Vienna',
          start_date:'2026-10-10',
          end_date:'2026-10-10'
        });
        const response = await fetch('https://api.open-meteo.com/v1/forecast?' + params, {cache:'no-store',signal:controller.signal});
        if (!response.ok) throw new Error('Open-Meteo HTTP ' + response.status);
        payload = await response.json();
      } finally { clearTimeout(timer); }
      if (payload.error) throw new Error(payload.reason || 'Нет прогноза');
      const entries = Array.isArray(payload) ? payload : [payload];
      if (entries.length !== points.length) throw new Error('Неполные данные по точкам');
      const hours = ['10:00','12:00','14:00','16:00','18:00'];
      const rows = entries.map((x,i) => {
        const hourly = x.hourly || {};
        const cells = hours.map(t => {
          const idx = (hourly.time || []).indexOf('2026-10-10T' + t);
          if (idx < 0) return '<td>—</td>';
          const clouds = weatherNumber(hourly.cloud_cover?.[idx],0);
          const rain = weatherNumber(hourly.precipitation?.[idx],1);
          const snow = weatherNumber(hourly.snowfall?.[idx],1);
          const temp = weatherNumber(hourly.temperature_2m?.[idx],0);
          return '<td><b>☁ ' + clouds + '%</b><br>🌧 ' + rain + ' мм<br>🌨 ' + snow + ' см<br>🌡 ' + temp + '°</td>';
        }).join('');
        return '<tr><th scope="row">' + points[i].name + '</th>' + cells + '</tr>';
      }).join('');
      const updated = new Date().toLocaleString('ru-RU',{timeZone:'Europe/Prague',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
      weatherOutput.innerHTML = '<p><b>Open-Meteo: 10.10.2026, время местное (Австрия)</b>. Запрошено: ' + updated + '. Проценты — общая модельная облачность; облака могут скрывать вершину даже при низком проценте, особенно в узкой долине.</p>'
        + '<div class="compareTableWrap"><table class="finalTable"><thead><tr><th>Точка / прогноз</th>' + hours.map(t => '<th>'+t+'</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
        + '<p class="note">🌧 мм/час, 🌨 см/час, температура модельная на заданной высоте. Отдельно сверить GeoSphere, живые камеры, ветер и открытие маршрутов. Прогноз не подтверждает сухость скалы, снежных мостов или тросов.</p>';
    } catch (e) {
      weatherOutput.textContent = 'Не удалось загрузить прогноз: ' + (e?.message || 'ошибка') + '. Используй радар GeoSphere и официальные камеры по ссылкам выше.';
    } finally { weatherButton.disabled = false; }
  });

})();
