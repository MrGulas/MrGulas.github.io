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


  // Актуальный модельный прогноз. Одна загрузка обновляет верхние карточки и таблицу часов.
  const pointList = [
    {name:'🏔 Dachstein / Hunerkogel ~2690 м',lat:47.468014,lon:13.626244,elevation:2690},
    {name:'🧗 Reiteralm / Gasselhöhe ~2000 м',lat:47.352781,lon:13.592045,elevation:2000},
    {name:'🔥 Rotmandlspitze ~2453 м',lat:47.280714,lon:13.672829,elevation:2453},
    {name:'⛰ Stoderzinken ~2050 м',lat:47.46,lon:13.813,elevation:2050}
  ];
  const weatherButtons = [document.getElementById('refreshFinalistsWeather'), document.getElementById('loadSaturdayForecast')].filter(Boolean);
  const weatherOutput = document.getElementById('morningWeatherOutput');
  const snapshotUpdated = document.getElementById('snapshotForecastUpdated');
  const forecastSource = document.getElementById('snapshotForecastSource');
  const TARGET_DATE = '2026-10-10';
  const hourLabels = ['10:00','12:00','14:00','16:00','18:00'];
  const finite = n => typeof n === 'number' && Number.isFinite(n);
  const fmt = (n, digits=0) => finite(n) ? n.toFixed(digits) : '—';
  const valuesAt = (hourly,key,indices) => indices.map(i => hourly[key]?.[i]).filter(finite);
  const summary = (hourly) => {
    const time = hourly.time || [];
    const daylight = time.map((t,i)=> ({t,i})).filter(x=>x.t.startsWith(TARGET_DATE+'T') && Number(x.t.slice(11,13))>=10 && Number(x.t.slice(11,13))<=17).map(x=>x.i);
    const including18 = time.map((t,i)=> ({t,i})).filter(x=>x.t.startsWith(TARGET_DATE+'T') && Number(x.t.slice(11,13))>=10 && Number(x.t.slice(11,13))<=18).map(x=>x.i);
    if (daylight.length < 8) throw Error('Недостаточно почасовых данных для 10.10');
    const mean = arr => arr.reduce((a,b)=>a+b,0) / arr.length;
    const total = arr => arr.reduce((a,b)=>a+b,0);
    const clouds = valuesAt(hourly,'cloud_cover',daylight);
    const rain = valuesAt(hourly,'precipitation',including18);
    const snowfall = valuesAt(hourly,'snowfall',including18);
    const pop = valuesAt(hourly,'precipitation_probability',daylight);
    const temp = valuesAt(hourly,'temperature_2m',daylight);
    const gusts = valuesAt(hourly,'wind_gusts_10m',daylight);
    return {
      clouds:clouds.length===daylight.length?mean(clouds):null,
      rain:rain.length===including18.length?total(rain):null,
      snowfall:snowfall.length===including18.length?total(snowfall):null,
      pop:pop.length?Math.max(...pop):null,
      minTemp:temp.length?Math.min(...temp):null,
      maxTemp:temp.length?Math.max(...temp):null,
      gusts:gusts.length?Math.max(...gusts):null
    };
  };
  let isLoadingForecast = false;
  async function updateFinalistsForecast() {
    if (isLoadingForecast) return;
    isLoadingForecast = true;
    weatherButtons.forEach(b => b.disabled = true);
    snapshotUpdated.textContent = 'Загружаю модельные данные Open-Meteo на 10.10…';
    if (weatherOutput) weatherOutput.textContent = 'Загружаю почасовую облачность и осадки…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 22000);
    try {
      const q = new URLSearchParams({
        latitude:pointList.map(p=>p.lat).join(','),
        longitude:pointList.map(p=>p.lon).join(','),
        elevation:pointList.map(p=>p.elevation).join(','),
        hourly:'cloud_cover,precipitation,precipitation_probability,temperature_2m,snowfall,wind_gusts_10m',
        timezone:'Europe/Vienna', start_date:TARGET_DATE, end_date:TARGET_DATE
      });
      const response = await fetch('https://api.open-meteo.com/v1/forecast?' + q, {signal:controller.signal,cache:'no-store'});
      if (!response.ok) throw Error('Open-Meteo HTTP ' + response.status);
      const payload = await response.json();
      if (payload?.error) throw Error(payload.reason||'Ошибка погодной модели');
      const entries = Array.isArray(payload) ? payload : [payload];
      if (entries.length !== pointList.length) throw Error('API вернул не все четыре локации');
      const metrics = entries.map(e => summary(e.hourly || {}));
      if (metrics.some(x=>x.clouds===null||x.rain===null||x.snowfall===null)) throw Error('Неполные данные о погоде на 10.10');
      const refreshed = new Date().toLocaleString('ru-RU',{timeZone:'Europe/Vienna',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
      pointList.forEach((p,i) => {
        const card = document.querySelector('[data-weather-location="'+i+'"] span');
        if (!card) return;
        const m=metrics[i];
        card.innerHTML = '☁ ' + fmt(m.clouds) + '% ср. 10–17<br>🌧 ' + fmt(m.rain,1) + ' мм · 🌨 ' + fmt(m.snowfall,1) + ' см (10–18)<br>'
          + '🌡 ' + fmt(m.minTemp) + '…' + fmt(m.maxTemp) + '°C · 🌧 max ' + fmt(m.pop) + '%<br>'
          + '💨 порывы до ' + fmt(m.gusts) + ' км/ч';
      });
      snapshotUpdated.textContent = '✅ Open-Meteo: новый запрос в ' + refreshed + ' (местное время Австрии). Модель, не официальное наблюдение.';
      forecastSource.textContent = 'Модельный прогноз Open-Meteo · 10.10.2026 · запрос ' + refreshed;
      const body = entries.map((entry,i) => {
        const hourly = entry.hourly || {};
        const cells = hourLabels.map(hour => {
          const at = (hourly.time || []).indexOf(TARGET_DATE + 'T' + hour);
          if (at < 0) return '<td>Нет данных</td>';
          return '<td><b>☁ ' + fmt(hourly.cloud_cover?.[at]) + '%</b><br>🌧 '
            + fmt(hourly.precipitation?.[at],1) + ' мм<br>🌨 '
            + fmt(hourly.snowfall?.[at],1) + ' см<br>🌡 '
            + fmt(hourly.temperature_2m?.[at]) + '°C</td>';
        }).join('');
        return '<tr><th scope="row">'+pointList[i].name+'</th>'+cells+'</tr>';
      }).join('');
      if (weatherOutput) weatherOutput.innerHTML =
        '<p><b>Open-Meteo · 10.10.2026</b>. Запрос ' + refreshed + ' · время местное (Австрия). Облачность — модельный процент облачного покрова, <b>не вероятность увидеть вершину</b>.</p>'
        + '<div class="compareTableWrap"><table class="finalTable"><thead><tr><th>Место</th>'
        + hourLabels.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+body+'</tbody></table></div>'
        + '<p class="note">Значения за час. Прогноз не подтверждает отсутствие льда, сухой скалы или безопасность подхода. Отдельно сверить официальные камеры, радар и mountain report.</p>';
    } catch(e) {
      const error = e?.name === 'AbortError' ? 'превышено время ожидания ответа' : String(e?.message||e);
      snapshotUpdated.textContent = '⚠ Прогноз сейчас не обновился: '+error+'. Архивные цифры не подставляем — проверь GeoSphere и камеры.';
      forecastSource.textContent = '10.10.2026 · свежий модельный прогноз недоступен';
      pointList.forEach((p,i)=>{ const x=document.querySelector('[data-weather-location="'+i+'"] span'); if (x) x.textContent='Не удалось обновить · см. камеры и официальный прогноз';});
      if(weatherOutput) weatherOutput.textContent='Почасовой прогноз не загружен: '+error+'. Попробуй кнопку ещё раз или используй ссылки на GeoSphere и камеры выше.';
    } finally {
      clearTimeout(timeout);
      weatherButtons.forEach(b=>b.disabled=false);
      isLoadingForecast=false;
    }
  }
  weatherButtons.forEach(b=>b.addEventListener('click', updateFinalistsForecast));
  if (snapshotUpdated && forecastSource) updateFinalistsForecast();

})();
