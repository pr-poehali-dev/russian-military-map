import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

type Tab = 'map' | 'analytics' | 'layers' | 'filters' | 'export' | 'help';

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'map',       label: 'Карта',      icon: 'Map'              },
  { id: 'analytics', label: 'Аналитика',  icon: 'BarChart3'        },
  { id: 'layers',    label: 'Слои',       icon: 'Layers'           },
  { id: 'filters',   label: 'Фильтры',    icon: 'SlidersHorizontal'},
  { id: 'export',    label: 'Экспорт',    icon: 'Download'         },
  { id: 'help',      label: 'Справка',    icon: 'HelpCircle'       },
];

const MARKERS = [
  { lat: 51.5,  lng: 31.2, type: 'friendly', label: 'Позиция А-7'  },
  { lat: 50.8,  lng: 33.6, type: 'enemy',    label: 'Объект X-3'   },
  { lat: 52.1,  lng: 30.0, type: 'intel',    label: 'Разведка-11'  },
  { lat: 49.5,  lng: 36.1, type: 'enemy',    label: 'Группа В-2'   },
  { lat: 53.3,  lng: 28.5, type: 'neutral',  label: 'Транзит-4'    },
  { lat: 50.2,  lng: 38.0, type: 'friendly', label: 'База Центр'   },
  { lat: 48.9,  lng: 34.7, type: 'intel',    label: 'Наблюд.-5'    },
  { lat: 51.8,  lng: 35.5, type: 'enemy',    label: 'Цель D-9'     },
  { lat: 47.6,  lng: 37.8, type: 'enemy',    label: 'Сектор Е-1'   },
  { lat: 52.9,  lng: 36.2, type: 'friendly', label: 'КП Север'     },
];

const MARKER_COLORS: Record<string, string> = {
  friendly: '#22c55e',
  enemy:    '#ef4444',
  neutral:  '#f97316',
  intel:    '#3b82f6',
};

const CHART_DATA = [
  { month: 'Янв', a: 40, b: 28, c: 15 },
  { month: 'Фев', a: 55, b: 35, c: 22 },
  { month: 'Мар', a: 38, b: 42, c: 18 },
  { month: 'Апр', a: 62, b: 31, c: 28 },
  { month: 'Май', a: 71, b: 25, c: 35 },
  { month: 'Июн', a: 65, b: 39, c: 30 },
];

const LAYERS_LIST = [
  { id: 1, label: 'Тактические позиции',  icon: 'Shield',    color: '#22c55e', on: true  },
  { id: 2, label: 'Вражеские объекты',    icon: 'Target',    color: '#ef4444', on: true  },
  { id: 3, label: 'Разведданные',         icon: 'Eye',       color: '#3b82f6', on: true  },
  { id: 4, label: 'Транспортные узлы',    icon: 'Truck',     color: '#f97316', on: false },
  { id: 5, label: 'Зоны контроля',        icon: 'MapPin',    color: '#8b5cf6', on: false },
  { id: 6, label: 'Рельеф',              icon: 'Mountain',  color: '#60a5fa', on: true  },
  { id: 7, label: 'Инфраструктура',      icon: 'Building2', color: '#f472b6', on: false },
  { id: 8, label: 'Связь и сети',        icon: 'Radio',     color: '#14b8a6', on: true  },
];

const EXPORT_FORMATS = [
  { id: 'pdf',  label: 'PDF-отчёт',         icon: 'FileText', color: '#ef4444' },
  { id: 'xlsx', label: 'Excel таблица',      icon: 'Table2',   color: '#22c55e' },
  { id: 'kml',  label: 'KML / Google Earth', icon: 'Globe',    color: '#3b82f6' },
  { id: 'json', label: 'JSON / API',         icon: 'Code2',    color: '#8b5cf6' },
  { id: 'png',  label: 'Снимок карты',       icon: 'Image',    color: '#f97316' },
  { id: 'gpx',  label: 'GPX маршруты',       icon: 'Route',    color: '#14b8a6' },
];

const HELP_ITEMS = [
  { q: 'Как добавить маркер?',        a: 'Правая кнопка мыши на карте → "Добавить объект". Укажите тип и координаты.' },
  { q: 'Как включить/выключить слой?', a: 'Раздел "Слои" — переключайте тоглы рядом с каждым слоем.' },
  { q: 'Как экспортировать данные?',   a: 'Раздел "Экспорт" — выберите формат и нажмите кнопку.' },
  { q: 'Цвета маркеров?',             a: 'Зелёный — свои. Красный — противник. Синий — разведка. Оранжевый — нейтральные.' },
  { q: 'Как сбросить фильтры?',       a: 'Кнопка "Сбросить" в верхнем правом углу раздела "Фильтры".' },
  { q: 'Частота обновления?',         a: 'Данные обновляются каждые 5 минут. Индикатор LIVE — активное соединение.' },
];

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { L: any; }
}

/* ─── MAP ──────────────────────────────────────────────────────── */
function MapPanel() {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInst = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: [50.5, 33.5],
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

    MARKERS.forEach((m) => {
      const c = MARKER_COLORS[m.type] || '#fff';
      const iconHtml = `
        <div style="position:relative;width:12px;height:12px;">
          <div style="
            width:10px;height:10px;border-radius:50%;
            border:2px solid ${c};
            background:${c}30;
            position:absolute;top:1px;left:1px;
          "></div>
          <div style="
            position:absolute;inset:-5px;border-radius:50%;
            border:1.5px solid ${c};opacity:0.3;
            animation:dsm-pulse 2.5s ease-in-out infinite;
          "></div>
        </div>`;
      const icon = L.divIcon({ className: '', html: iconHtml, iconSize: [12, 12], iconAnchor: [6, 6] });

      L.marker([m.lat, m.lng], { icon }).addTo(map).bindPopup(`
        <div style="font-family:'Golos Text',sans-serif;padding:10px 14px;min-width:160px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${c};box-shadow:0 0 6px ${c};flex-shrink:0;"></div>
            <strong style="color:var(--dsm-text);font-size:13px;">${m.label}</strong>
          </div>
          <div style="color:var(--dsm-muted);font-size:11px;line-height:1.6;">
            Тип: ${m.type === 'friendly' ? 'Свои' : m.type === 'enemy' ? 'Противник' : m.type === 'intel' ? 'Разведка' : 'Нейтральный'}<br>
            Координаты: ${m.lat.toFixed(3)}°N, ${m.lng.toFixed(3)}°E<br>
            Статус: <span style="color:#22c55e;">Активен</span>
          </div>
        </div>
      `, { className: '' });
    });

    mapInst.current = map;
    return () => { map.remove(); mapInst.current = null; };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <div className="dsm-map-vignette" />

      {/* Top-left chips */}
      <div className="absolute top-3 left-3 z-[600] flex gap-2">
        <div className="dsm-panel px-3 py-1.5 flex items-center gap-2" style={{ borderRadius: 8 }}>
          <div className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
          <span style={{ fontSize: 12, color: 'var(--dsm-muted)' }}>ОНЛАЙН</span>
          <span style={{ fontSize: 12, color: 'var(--dsm-text)', fontWeight: 600 }}>2 841</span>
          <span style={{ fontSize: 12, color: 'var(--dsm-muted)' }}>объектов</span>
        </div>
        <div className="dsm-panel px-3 py-1.5 flex items-center gap-1.5" style={{ borderRadius: 8 }}>
          <Icon name="MapPin" size={12} style={{ color: 'var(--dsm-muted)' }} />
          <span style={{ fontSize: 12, color: 'var(--dsm-muted)' }}>Восточная Европа</span>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-8 right-4 z-[600] flex flex-col gap-1">
        {[{ icon: 'Plus', fn: () => mapInst.current?.zoomIn() }, { icon: 'Minus', fn: () => mapInst.current?.zoomOut() }].map((b) => (
          <button key={b.icon}
            onClick={b.fn}
            className="dsm-btn"
            style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }}>
            <Icon name={b.icon} size={14} />
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 left-3 z-[600] dsm-panel px-3 py-2.5" style={{ borderRadius: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--dsm-muted)', letterSpacing: '0.08em', marginBottom: 8 }}>
          ОБОЗНАЧЕНИЯ
        </div>
        <div className="flex flex-col gap-1.5">
          {[
            { c: '#22c55e', l: 'Свои позиции'  },
            { c: '#ef4444', l: 'Противник'      },
            { c: '#f97316', l: 'Нейтральные'    },
            { c: '#3b82f6', l: 'Разведка'       },
          ].map((item) => (
            <div key={item.l} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.c, boxShadow: `0 0 4px ${item.c}`, flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: 'var(--dsm-muted)' }}>{item.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Coords */}
      <div className="absolute top-3 right-3 z-[600] dsm-panel px-3 py-2" style={{ borderRadius: 8 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--dsm-muted)' }}>
          50°30′N&nbsp;&nbsp;33°30′E
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--dsm-border)', marginTop: 1 }}>
          Zoom 6 · UTM 37U
        </div>
      </div>
    </div>
  );
}

/* ─── ANALYTICS ────────────────────────────────────────────────── */
function AnalyticsPanel() {
  const maxV = 80;
  const stats = [
    { label: 'Всего объектов', value: '2 841', delta: '+14', up: true,  color: 'var(--dsm-blue)'   },
    { label: 'Активных',       value: '384',   delta: '+3',  up: true,  color: 'var(--dsm-green)'  },
    { label: 'Угроз',          value: '127',   delta: '-5',  up: false, color: 'var(--dsm-red)'    },
    { label: 'Секторов',       value: '48',    delta: '0',   up: true,  color: 'var(--dsm-orange)' },
  ];
  return (
    <div className="h-full overflow-y-auto stagger" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--dsm-text)' }}>Аналитика</h2>
        <span style={{ fontSize: 11, color: 'var(--dsm-muted)', fontFamily: "'JetBrains Mono',monospace" }}>
          11.06.2026 · 06:42
        </span>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {stats.map((s) => (
          <div key={s.label} className="dsm-stat">
            <div style={{ fontSize: 11, color: 'var(--dsm-muted)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, marginTop: 5, color: s.up ? 'var(--dsm-green)' : 'var(--dsm-red)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Icon name={s.up ? 'TrendingUp' : 'TrendingDown'} size={11} />
              {s.delta} за 24ч
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="dsm-panel" style={{ padding: 16, borderRadius: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dsm-muted)', letterSpacing: '0.06em', marginBottom: 14 }}>
          АКТИВНОСТЬ ПО МЕСЯЦАМ
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 96 }}>
          {CHART_DATA.map((d) => (
            <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 80 }}>
                {[
                  { val: d.a, color: 'var(--dsm-green)' },
                  { val: d.b, color: 'var(--dsm-red)'   },
                  { val: d.c, color: 'var(--dsm-blue)'  },
                ].map((bar, j) => (
                  <div key={j} style={{
                    flex: 1, borderRadius: 3,
                    height: `${(bar.val / maxV) * 80}px`,
                    background: bar.color, opacity: 0.8,
                  }} />
                ))}
              </div>
              <span style={{ fontSize: 10, color: 'var(--dsm-muted)' }}>{d.month}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
          {[['Свои', 'var(--dsm-green)'], ['Против.', 'var(--dsm-red)'], ['Развед.', 'var(--dsm-blue)']].map(([l, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
              <span style={{ fontSize: 11, color: 'var(--dsm-muted)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Donut */}
      <div className="dsm-panel" style={{ padding: 16, borderRadius: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dsm-muted)', letterSpacing: '0.06em', marginBottom: 14 }}>
          РАСПРЕДЕЛЕНИЕ УГРОЗ
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg viewBox="0 0 36 36" style={{ width: 88, height: 88, flexShrink: 0, transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--dsm-border)" strokeWidth="3.5" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--dsm-red)" strokeWidth="3.5"
              strokeDasharray="38 62" strokeLinecap="round" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--dsm-orange)" strokeWidth="3.5"
              strokeDasharray="24 76" strokeDashoffset="-38" strokeLinecap="round" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--dsm-yellow)" strokeWidth="3.5"
              strokeDasharray="23 77" strokeDashoffset="-62" strokeLinecap="round" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--dsm-blue)" strokeWidth="3.5"
              strokeDasharray="15 85" strokeDashoffset="-85" strokeLinecap="round" />
          </svg>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { l: 'Критические', p: '38%', c: 'var(--dsm-red)'    },
              { l: 'Высокие',     p: '24%', c: 'var(--dsm-orange)' },
              { l: 'Средние',     p: '23%', c: 'var(--dsm-yellow)' },
              { l: 'Низкие',      p: '15%', c: 'var(--dsm-blue)'   },
            ].map((t) => (
              <div key={t.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: t.c, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--dsm-muted)' }}>{t.l}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.c }}>{t.p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── LAYERS ───────────────────────────────────────────────────── */
function LayersPanel() {
  const [layers, setLayers] = useState(LAYERS_LIST);
  const [basemap, setBasemap] = useState(0);
  const toggleLayer = (id: number) =>
    setLayers((p) => p.map((l) => (l.id === id ? { ...l, on: !l.on } : l)));

  return (
    <div className="h-full overflow-y-auto" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--dsm-text)' }}>Слои</h2>
        <button className="dsm-btn" style={{ fontSize: 12 }}
          onClick={() => setLayers((p) => p.map((l) => ({ ...l, on: true })))}>
          Включить все
        </button>
      </div>

      {/* Layers list */}
      <div className="dsm-panel" style={{ borderRadius: 10, overflow: 'hidden' }}>
        {layers.map((layer, i) => (
          <div key={layer.id}>
            {i > 0 && <div className="dsm-divider" />}
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', transition: 'background 0.15s' }}
              onClick={() => toggleLayer(layer.id)}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dsm-white-10)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name={layer.icon} size={15} style={{ color: layer.on ? layer.color : 'var(--dsm-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, color: layer.on ? 'var(--dsm-text)' : 'var(--dsm-muted)', fontWeight: 500 }}>
                  {layer.label}
                </span>
              </div>
              <div className={`dsm-toggle ${layer.on ? 'on' : ''}`}
                style={layer.on ? { background: layer.color } : {}} />
            </div>
          </div>
        ))}
      </div>

      {/* Basemap */}
      <div className="dsm-panel" style={{ borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px 4px', fontSize: 11, fontWeight: 600, color: 'var(--dsm-muted)', letterSpacing: '0.07em' }}>
          ПОДЛОЖКА
        </div>
        {['OpenStreetMap', 'Спутник', 'Рельеф', 'Тёмная'].map((name, i) => (
          <div key={name}>
            {i > 0 && <div className="dsm-divider" />}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', transition: 'background 0.15s' }}
              onClick={() => setBasemap(i)}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dsm-white-10)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${basemap === i ? 'var(--dsm-blue)' : 'var(--dsm-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {basemap === i && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--dsm-blue)' }} />}
              </div>
              <span style={{ fontSize: 13, color: basemap === i ? 'var(--dsm-text)' : 'var(--dsm-muted)' }}>{name}</span>
              {basemap === i && <div className="dsm-badge" style={{ marginLeft: 'auto', background: 'var(--dsm-blue-glow)', color: 'var(--dsm-blue)', fontSize: 10 }}>Активна</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── FILTERS ──────────────────────────────────────────────────── */
function FiltersPanel() {
  const groups = [
    { label: 'Период',         items: ['24 часа', '7 дней', '30 дней', 'Всё время'] },
    { label: 'Тип объекта',    items: ['Все', 'Военные', 'Гражданские', 'Транспорт'] },
    { label: 'Приоритет',      items: ['Любой', 'Критический', 'Высокий', 'Средний', 'Низкий'] },
    { label: 'Статус',         items: ['Все', 'Активные', 'Неактивные'] },
  ];
  const [sel, setSel] = useState(groups.map(() => 0));
  const [radius, setRadius] = useState(65);

  return (
    <div className="h-full overflow-y-auto" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--dsm-text)' }}>Фильтры</h2>
        <button className="dsm-btn" style={{ fontSize: 12, color: 'var(--dsm-red)', borderColor: 'rgba(239,68,68,0.25)' }}
          onClick={() => setSel(groups.map(() => 0))}>
          Сбросить
        </button>
      </div>

      {groups.map((g, gi) => (
        <div key={g.label} className="dsm-panel" style={{ borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--dsm-muted)', letterSpacing: '0.07em', marginBottom: 10 }}>
            {g.label.toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {g.items.map((item, ii) => (
              <button key={item}
                className={`dsm-chip ${sel[gi] === ii ? 'active' : ''}`}
                onClick={() => setSel((p) => p.map((v, i) => (i === gi ? ii : v)))}>
                {item}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Radius slider */}
      <div className="dsm-panel" style={{ borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--dsm-muted)', letterSpacing: '0.07em' }}>РАДИУС</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dsm-blue)' }}>{radius} км</span>
        </div>
        <input type="range" min={5} max={500} value={radius} onChange={(e) => setRadius(+e.target.value)}
          style={{ width: '100%', accentColor: 'var(--dsm-blue)', cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--dsm-border)' }}>5 км</span>
          <span style={{ fontSize: 10, color: 'var(--dsm-border)' }}>500 км</span>
        </div>
      </div>

      <button className="dsm-btn dsm-btn-blue" style={{ width: '100%', padding: '10px 0', fontSize: 14, fontWeight: 600, borderRadius: 9 }}>
        Применить фильтры
      </button>
    </div>
  );
}

/* ─── EXPORT ───────────────────────────────────────────────────── */
function ExportPanel() {
  const [picked, setPicked] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  const start = () => {
    if (!picked || busy) return;
    setBusy(true);
    setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(iv); setBusy(false); return 100; }
        return p + Math.random() * 11;
      });
    }, 150);
  };

  return (
    <div className="h-full overflow-y-auto" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--dsm-text)' }}>Экспорт</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {EXPORT_FORMATS.map((f) => (
          <div key={f.id}
            onClick={() => { setPicked(f.id); setProgress(0); setBusy(false); }}
            style={{
              padding: '12px 12px',
              borderRadius: 9,
              border: `1px solid ${picked === f.id ? f.color + '55' : 'var(--dsm-border)'}`,
              background: picked === f.id ? f.color + '12' : 'var(--dsm-panel-alt)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
            <Icon name={f.icon} size={16} style={{ color: f.color, marginBottom: 6 }} />
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--dsm-text)' }}>{f.label}</div>
          </div>
        ))}
      </div>

      {/* Options */}
      <div className="dsm-panel" style={{ borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px 4px', fontSize: 11, fontWeight: 600, color: 'var(--dsm-muted)', letterSpacing: '0.07em' }}>ПАРАМЕТРЫ</div>
        {['Включить статистику', 'Легенда карты', 'Сжать данные', 'Метаданные'].map((opt, i) => (
          <div key={opt}>
            {i > 0 && <div className="dsm-divider" />}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer' }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid var(--dsm-blue)', background: 'var(--dsm-blue-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="Check" size={10} style={{ color: 'var(--dsm-blue)' }} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--dsm-muted)' }}>{opt}</span>
            </label>
          </div>
        ))}
      </div>

      {/* Progress */}
      {(busy || progress === 100) && (
        <div className="dsm-panel anim-fadein" style={{ borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--dsm-muted)' }}>{busy ? 'Экспортирую...' : 'Готово'}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--dsm-blue)' }}>{Math.min(Math.round(progress), 100)}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--dsm-border)', borderRadius: 4 }}>
            <div className="dsm-progress-fill" style={{ width: `${Math.min(progress, 100)}%`, background: 'var(--dsm-blue)' }} />
          </div>
          {progress >= 100 && !busy && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <Icon name="CheckCircle" size={14} style={{ color: 'var(--dsm-green)' }} />
              <span style={{ fontSize: 12, color: 'var(--dsm-green)' }}>Файл готов</span>
            </div>
          )}
        </div>
      )}

      <button className={`dsm-btn ${picked ? 'dsm-btn-blue' : ''}`}
        disabled={!picked || busy}
        onClick={start}
        style={{ width: '100%', padding: '10px 0', fontSize: 14, fontWeight: 600, borderRadius: 9, opacity: (!picked || busy) ? 0.5 : 1 }}>
        {busy ? 'Идёт экспорт...' : 'Экспортировать'}
      </button>
    </div>
  );
}

/* ─── HELP ─────────────────────────────────────────────────────── */
function HelpPanel() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="h-full overflow-y-auto" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--dsm-text)' }}>Справка</h2>

      {/* Version */}
      <div className="dsm-panel" style={{ borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--dsm-blue-glow)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="Globe" size={18} style={{ color: 'var(--dsm-blue)' }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dsm-text)' }}>ТАКТИКА v1.0.0</div>
          <div style={{ fontSize: 12, color: 'var(--dsm-muted)' }}>Военно-аналитическая карта · РФ</div>
        </div>
        <div className="dsm-badge" style={{ marginLeft: 'auto', background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} className="blink" />
          Онлайн
        </div>
      </div>

      {/* FAQ */}
      <div className="dsm-panel" style={{ borderRadius: 10, overflow: 'hidden' }}>
        {HELP_ITEMS.map((item, i) => (
          <div key={i}>
            {i > 0 && <div className="dsm-divider" />}
            <div>
              <button
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', gap: 10 }}
                onClick={() => setOpen(open === i ? null : i)}>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: open === i ? 'var(--dsm-blue)' : 'var(--dsm-text)', textAlign: 'left' }}>
                  {item.q}
                </span>
                <Icon name={open === i ? 'ChevronUp' : 'ChevronDown'} size={14} style={{ color: 'var(--dsm-muted)', flexShrink: 0 }} />
              </button>
              {open === i && (
                <div className="anim-fadein" style={{ padding: '0 14px 12px', fontSize: 13, color: 'var(--dsm-muted)', lineHeight: 1.65, borderTop: '1px solid var(--dsm-border)' }}>
                  <br />{item.a}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hotkeys */}
      <div className="dsm-panel" style={{ borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px 4px', fontSize: 11, fontWeight: 600, color: 'var(--dsm-muted)', letterSpacing: '0.07em' }}>
          ГОРЯЧИЕ КЛАВИШИ
        </div>
        {[['M', 'Карта'], ['A', 'Аналитика'], ['L', 'Слои'], ['F', 'Фильтры'], ['Esc', 'Закрыть']].map(([k, d], i) => (
          <div key={k}>
            {i > 0 && <div className="dsm-divider" />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px' }}>
              <span style={{ fontSize: 13, color: 'var(--dsm-muted)' }}>{d}</span>
              <kbd style={{ padding: '2px 8px', borderRadius: 5, background: 'var(--dsm-panel-alt)', border: '1px solid var(--dsm-border)', fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: 'var(--dsm-text)' }}>{k}</kbd>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── ROOT ─────────────────────────────────────────────────────── */
export default function Index() {
  const [tab, setTab] = useState<Tab>('map');
  const [time, setTime] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const map: Record<string, Tab> = { m: 'map', a: 'analytics', l: 'layers', f: 'filters' };
      if (map[e.key]) setTab(map[e.key]);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--dsm-bg)', fontFamily: "'Golos Text', system-ui, sans-serif" }}>

      {/* ── TOP BAR ── */}
      <header style={{
        flexShrink: 0, height: 52, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 16px',
        background: 'var(--dsm-panel)', borderBottom: '1px solid var(--dsm-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--dsm-blue-glow)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="Crosshair" size={15} style={{ color: 'var(--dsm-blue)' }} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--dsm-text)', letterSpacing: '-0.01em' }}>
            ТАКТИКА
          </span>
          <span style={{ fontSize: 11, color: 'var(--dsm-muted)', background: 'var(--dsm-panel-alt)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--dsm-border)' }}>
            v1.0
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {[{ l: 'Соединение', ok: true }, { l: 'Синхронизация', ok: false }].map((s) => (
              <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div className={s.ok ? 'blink' : ''} style={{ width: 6, height: 6, borderRadius: '50%', background: s.ok ? '#22c55e' : '#f97316', boxShadow: `0 0 5px ${s.ok ? '#22c55e' : '#f97316'}` }} />
                <span style={{ fontSize: 11, color: 'var(--dsm-muted)' }}>{s.l}</span>
              </div>
            ))}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: 'var(--dsm-text)' }}>
            {time}
          </span>
          <span style={{ fontSize: 10, color: 'var(--dsm-muted)' }}>МСК</span>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* SIDEBAR */}
        <aside style={{
          flexShrink: 0, display: 'flex', flexDirection: 'column',
          width: collapsed ? 52 : 210,
          background: 'var(--dsm-panel)', borderRight: '1px solid var(--dsm-border)',
          transition: 'width 0.25s ease',
        }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--dsm-border)', background: 'none', border: 'none', borderBottom: '1px solid var(--dsm-border)', cursor: 'pointer', color: 'var(--dsm-muted)', flexShrink: 0 }}>
            <Icon name={collapsed ? 'ChevronRight' : 'ChevronLeft'} size={16} />
          </button>

          <nav style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map((item) => (
              <button key={item.id}
                className={`dsm-nav-item ${tab === item.id ? 'active' : ''}`}
                style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '8px 0' : '8px 12px' }}
                onClick={() => setTab(item.id)}>
                <Icon name={item.icon} size={16} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          {!collapsed && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--dsm-border)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px #22c55e' }} />
              <span style={{ fontSize: 11, color: 'var(--dsm-muted)' }}>Система активна</span>
            </div>
          )}
        </aside>

        {/* CONTENT */}
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {tab === 'map'       && <div style={{ width: '100%', height: '100%' }}><MapPanel /></div>}
          {tab === 'analytics' && <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}><AnalyticsPanel /></div>}
          {tab === 'layers'    && <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}><LayersPanel /></div>}
          {tab === 'filters'   && <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}><FiltersPanel /></div>}
          {tab === 'export'    && <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}><ExportPanel /></div>}
          {tab === 'help'      && <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}><HelpPanel /></div>}
        </main>
      </div>

      {/* ── BOTTOM BAR ── */}
      <footer style={{
        flexShrink: 0, height: 28, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 16px',
        background: 'var(--dsm-panel)', borderTop: '1px solid var(--dsm-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 11, color: 'var(--dsm-muted)' }}>ТАКТИКА · Военно-аналитическая карта</span>
          <span style={{ fontSize: 11, color: 'var(--dsm-border)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 11, color: 'var(--dsm-muted)' }}>Защищённое соединение</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 11, color: 'var(--dsm-muted)' }}>Объектов: 2 841</span>
          <span style={{ fontSize: 11, color: 'var(--dsm-muted)' }}>© 2026 ТАКТИКА</span>
        </div>
      </footer>

    </div>
  );
}
