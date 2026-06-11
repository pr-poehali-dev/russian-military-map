import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

type Tab = 'map' | 'analytics' | 'layers' | 'filters' | 'export' | 'help';
type MapMode = 'osm' | 'satellite' | 'hybrid' | 'yandex';

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'map',       label: 'Карта',      icon: 'Map'              },
  { id: 'analytics', label: 'Аналитика',  icon: 'BarChart3'        },
  { id: 'layers',    label: 'Слои',       icon: 'Layers'           },
  { id: 'filters',   label: 'Фильтры',    icon: 'SlidersHorizontal'},
  { id: 'export',    label: 'Экспорт',    icon: 'Download'         },
  { id: 'help',      label: 'Справка',    icon: 'HelpCircle'       },
];

const MARKER_COLORS: Record<string, string> = {
  friendly: '#16a34a',
  enemy:    '#ef4444',
  neutral:  '#d97706',
  intel:    '#2563eb',
};

const MARKERS = [
  { lat: 51.5, lng: 31.2, type: 'friendly', label: 'Позиция А-7',  status: 'Активен'  },
  { lat: 50.8, lng: 33.6, type: 'enemy',    label: 'Объект X-3',   status: 'Активен'  },
  { lat: 52.1, lng: 30.0, type: 'intel',    label: 'Разведка-11',  status: 'Активен'  },
  { lat: 49.5, lng: 36.1, type: 'enemy',    label: 'Группа В-2',   status: 'Активен'  },
  { lat: 53.3, lng: 28.5, type: 'neutral',  label: 'Транзит-4',    status: 'Наблюд.'  },
  { lat: 50.2, lng: 38.0, type: 'friendly', label: 'База Центр',   status: 'Активен'  },
  { lat: 48.9, lng: 34.7, type: 'intel',    label: 'Наблюд.-5',    status: 'Активен'  },
  { lat: 51.8, lng: 35.5, type: 'enemy',    label: 'Цель D-9',     status: 'Критич.'  },
  { lat: 47.6, lng: 37.8, type: 'enemy',    label: 'Сектор Е-1',   status: 'Высокий'  },
  { lat: 52.9, lng: 36.2, type: 'friendly', label: 'КП Север',     status: 'Активен'  },
];

const CHART_DATA = [
  { m: 'Янв', a: 40, b: 28, c: 15 },
  { m: 'Фев', a: 55, b: 35, c: 22 },
  { m: 'Мар', a: 38, b: 42, c: 18 },
  { m: 'Апр', a: 62, b: 31, c: 28 },
  { m: 'Май', a: 71, b: 25, c: 35 },
  { m: 'Июн', a: 65, b: 39, c: 30 },
];

const LAYERS_LIST = [
  { id: 1, label: 'Тактические позиции',  icon: 'Shield',    color: '#16a34a', on: true  },
  { id: 2, label: 'Вражеские объекты',    icon: 'Target',    color: '#ef4444', on: true  },
  { id: 3, label: 'Разведданные',         icon: 'Eye',       color: '#2563eb', on: true  },
  { id: 4, label: 'Транспортные узлы',    icon: 'Truck',     color: '#d97706', on: false },
  { id: 5, label: 'Зоны контроля',        icon: 'MapPin',    color: '#7c3aed', on: false },
  { id: 6, label: 'Рельеф',              icon: 'Mountain',  color: '#0891b2', on: true  },
  { id: 7, label: 'Инфраструктура',      icon: 'Building2', color: '#db2777', on: false },
  { id: 8, label: 'Связь и сети',        icon: 'Radio',     color: '#059669', on: true  },
];

const BASEMAPS: { id: MapMode; label: string; desc: string; tile: string; icon: string }[] = [
  {
    id: 'osm', label: 'Карта', desc: 'OpenStreetMap',
    tile: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    icon: 'Map',
  },
  {
    id: 'satellite', label: 'Спутник', desc: 'Esri World Imagery',
    tile: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    icon: 'Satellite',
  },
  {
    id: 'hybrid', label: 'Гибрид', desc: 'Спутник + дороги',
    tile: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    icon: 'Layers',
  },
  {
    id: 'yandex', label: 'Яндекс', desc: 'Яндекс Карты (OSM)',
    tile: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    icon: 'Navigation',
  },
];

const EXPORT_FORMATS = [
  { id: 'pdf',  label: 'PDF-отчёт',         icon: 'FileText', color: '#ef4444' },
  { id: 'xlsx', label: 'Excel таблица',      icon: 'Table2',   color: '#16a34a' },
  { id: 'kml',  label: 'KML / Google Earth', icon: 'Globe',    color: '#2563eb' },
  { id: 'json', label: 'JSON / API',         icon: 'Code2',    color: '#7c3aed' },
  { id: 'png',  label: 'Снимок карты',       icon: 'Image',    color: '#d97706' },
  { id: 'gpx',  label: 'GPX маршруты',       icon: 'Route',    color: '#059669' },
];

const HELP_FAQ = [
  { q: 'Как добавить маркер на карту?',     a: 'Правая кнопка мыши на карте → «Добавить объект». Укажите тип, координаты и описание.' },
  { q: 'Как переключить подложку карты?',   a: 'Раздел «Слои» → блок «Подложка карты» → выберите один из 4 режимов: карта, спутник, гибрид или Яндекс.' },
  { q: 'Как включить/выключить слой?',      a: 'Раздел «Слои» — нажмите тогл рядом с нужным слоем. Кнопка «Включить все» активирует все слои.' },
  { q: 'Что означают цвета маркеров?',      a: 'Зелёный — свои позиции. Красный — противник. Синий — разведка. Оранжевый — нейтральные объекты.' },
  { q: 'Как экспортировать данные?',        a: 'Раздел «Экспорт» — выберите формат и нажмите кнопку. Поддерживаются PDF, Excel, KML, JSON, PNG, GPX.' },
  { q: 'Как часто обновляются данные?',     a: 'Каждые 5 минут. Зелёный индикатор ОНЛАЙН в верхней панели показывает активное соединение.' },
];

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { L: any; }
}

/* ── КАРТА ──────────────────────────────────────────────────── */
function MapPanel({ mapMode, onModeChange }: { mapMode: MapMode; onModeChange: (m: MapMode) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInst = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tileRef = useRef<any>(null);

  const getTileFilter = (mode: MapMode) => {
    if (mode === 'satellite') return 'saturate(1.1) contrast(1.05)';
    if (mode === 'hybrid')    return 'saturate(1.1) contrast(1.05)';
    if (mode === 'yandex')    return 'sepia(0.12) saturate(1.3) brightness(1.03)';
    return 'none';
  };

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: [50.5, 33.5], zoom: 6,
      zoomControl: false, attributionControl: true,
    });

    const bm = BASEMAPS.find((b) => b.id === mapMode) || BASEMAPS[0];
    const tile = L.tileLayer(bm.tile, { maxZoom: 18, attribution: '© OpenStreetMap / Esri' });
    tile.addTo(map);
    tileRef.current = tile;

    // Roads overlay for hybrid
    if (mapMode === 'hybrid') {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18, opacity: 0.45,
      }).addTo(map);
    }

    MARKERS.forEach((m) => {
      const c = MARKER_COLORS[m.type] || '#666';
      const typeLabel = m.type === 'friendly' ? 'Свои' : m.type === 'enemy' ? 'Противник' : m.type === 'intel' ? 'Разведка' : 'Нейтральный';
      const html = `
        <div style="position:relative;width:14px;height:14px;">
          <div style="width:10px;height:10px;border-radius:50%;background:${c};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.25);position:absolute;top:2px;left:2px;"></div>
          <div class="mpulse" style="position:absolute;inset:-4px;border-radius:50%;border:2px solid ${c};opacity:0.3;"></div>
        </div>`;
      const icon = L.divIcon({ className: '', html, iconSize: [14, 14], iconAnchor: [7, 7] });
      L.marker([m.lat, m.lng], { icon }).addTo(map).bindPopup(`
        <div style="font-family:'Golos Text',sans-serif;padding:12px 14px;min-width:170px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="width:9px;height:9px;border-radius:50%;background:${c};flex-shrink:0;"></div>
            <strong style="font-size:14px;color:#21242c;">${m.label}</strong>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <div style="display:flex;justify-content:space-between;">
              <span style="font-size:12px;color:#9ca3af;">Тип</span>
              <span style="font-size:12px;font-weight:600;color:#21242c;">${typeLabel}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="font-size:12px;color:#9ca3af;">Статус</span>
              <span style="font-size:12px;font-weight:600;color:${m.status === 'Критич.' ? '#ef4444' : '#16a34a'};">${m.status}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="font-size:12px;color:#9ca3af;">Координаты</span>
              <span style="font-size:11px;font-family:monospace;color:#374151;">${m.lat.toFixed(2)}°N, ${m.lng.toFixed(2)}°E</span>
            </div>
          </div>
        </div>
      `, { className: '' });
    });

    // Set tile filter
    const pane = mapRef.current.querySelector('.leaflet-tile-pane') as HTMLElement | null;
    if (pane) pane.style.filter = getTileFilter(mapMode);

    mapInst.current = map;
    return () => { map.remove(); mapInst.current = null; tileRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update tile filter on mode change
  useEffect(() => {
    if (!mapRef.current) return;
    const pane = mapRef.current.querySelector('.leaflet-tile-pane') as HTMLElement | null;
    if (pane) pane.style.filter = getTileFilter(mapMode);
  }, [mapMode]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Top-left info */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 600, display: 'flex', gap: 8 }}>
        <div className="ya-panel" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10 }}>
          <div className="blink" style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 5px #16a34a', flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: 'var(--ya-text-sec)' }}>Онлайн</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ya-orange)' }}>2 841</span>
          <span style={{ fontSize: 12.5, color: 'var(--ya-text-muted)' }}>объектов</span>
        </div>
        <div className="ya-panel" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10 }}>
          <Icon name="MapPin" size={12} style={{ color: 'var(--ya-text-muted)' }} />
          <span style={{ fontSize: 12, color: 'var(--ya-text-sec)' }}>Восточная Европа</span>
        </div>
      </div>

      {/* Basemap switcher */}
      <div className="ya-panel" style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 600, display: 'flex', gap: 2, padding: 4, borderRadius: 10 }}>
        {BASEMAPS.map((b) => (
          <button key={b.id}
            onClick={() => onModeChange(b.id)}
            style={{
              padding: '5px 14px', borderRadius: 7, fontSize: 12.5, fontWeight: 500,
              cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all 0.15s',
              background: mapMode === b.id ? 'var(--ya-orange)' : 'transparent',
              color: mapMode === b.id ? '#fff' : 'var(--ya-text-sec)',
              boxShadow: mapMode === b.id ? '0 2px 8px rgba(255,115,0,0.25)' : 'none',
            }}>
            {b.label}
          </button>
        ))}
      </div>

      {/* Zoom controls */}
      <div style={{ position: 'absolute', bottom: 80, right: 14, zIndex: 600, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[{ label: '+', fn: () => mapInst.current?.zoomIn() }, { label: '−', fn: () => mapInst.current?.zoomOut() }].map((b) => (
          <button key={b.label} onClick={b.fn} className="ya-btn"
            style={{ width: 34, height: 34, padding: 0, borderRadius: 9, fontSize: 18, fontWeight: 300 }}>
            {b.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="ya-panel" style={{ position: 'absolute', bottom: 16, left: 12, zIndex: 600, padding: '10px 14px', borderRadius: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ya-text-muted)', letterSpacing: '0.07em', marginBottom: 8 }}>
          ОБОЗНАЧЕНИЯ
        </div>
        {[
          { c: '#16a34a', l: 'Свои позиции' },
          { c: '#ef4444', l: 'Противник'    },
          { c: '#d97706', l: 'Нейтральные'  },
          { c: '#2563eb', l: 'Разведка'     },
        ].map((item) => (
          <div key={item.l} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: item.c, flexShrink: 0, boxShadow: `0 0 3px ${item.c}55` }} />
            <span style={{ fontSize: 12, color: 'var(--ya-text-sec)' }}>{item.l}</span>
          </div>
        ))}
      </div>

      {/* Coords */}
      <div className="ya-panel" style={{ position: 'absolute', bottom: 16, right: 14, zIndex: 600, padding: '7px 12px', borderRadius: 10 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ya-text-sec)' }}>
          50°30′N · 33°30′E
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--ya-text-muted)', marginTop: 1 }}>
          {BASEMAPS.find((b) => b.id === mapMode)?.desc} · Zoom 6
        </div>
      </div>
    </div>
  );
}

/* ── АНАЛИТИКА ──────────────────────────────────────────────── */
function AnalyticsPanel() {
  const maxV = 80;
  const stats = [
    { label: 'Всего объектов', value: '2 841', delta: '+14', up: true,  color: 'var(--ya-orange)' },
    { label: 'Активных',       value: '384',   delta: '+3',  up: true,  color: 'var(--ya-green)'  },
    { label: 'Угроз',          value: '127',   delta: '-5',  up: false, color: 'var(--ya-red)'    },
    { label: 'Секторов',       value: '48',    delta: '=',   up: true,  color: 'var(--ya-blue)'   },
  ];
  return (
    <div className="stagger h-full overflow-y-auto" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ya-text)' }}>Аналитика</h2>
        <span style={{ fontSize: 11, color: 'var(--ya-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>11.06.2026 · 06:42</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: 'var(--ya-bg)', border: '1px solid var(--ya-border-soft)', borderRadius: 10, padding: '13px 14px' }}>
            <div style={{ fontSize: 11.5, color: 'var(--ya-text-muted)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11.5, color: s.up ? 'var(--ya-green)' : 'var(--ya-red)' }}>
              <Icon name={s.up ? 'TrendingUp' : 'TrendingDown'} size={12} />
              {s.delta} за 24 ч
            </div>
          </div>
        ))}
      </div>

      <div className="ya-panel" style={{ padding: 16, borderRadius: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ya-text-muted)', letterSpacing: '0.07em', marginBottom: 14 }}>
          АКТИВНОСТЬ ПО МЕСЯЦАМ
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 96 }}>
          {CHART_DATA.map((d) => (
            <div key={d.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 80 }}>
                {[
                  { val: d.a, color: 'var(--ya-green)'  },
                  { val: d.b, color: 'var(--ya-red)'    },
                  { val: d.c, color: 'var(--ya-orange)' },
                ].map((bar, j) => (
                  <div key={j} style={{ flex: 1, borderRadius: 3, height: `${(bar.val / maxV) * 80}px`, background: bar.color, opacity: 0.75 }} />
                ))}
              </div>
              <span style={{ fontSize: 10, color: 'var(--ya-text-muted)' }}>{d.m}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
          {[['Свои', 'var(--ya-green)'], ['Против.', 'var(--ya-red)'], ['Развед.', 'var(--ya-orange)']].map(([l, c]) => (
            <div key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c as string }} />
              <span style={{ fontSize: 11, color: 'var(--ya-text-muted)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ya-panel" style={{ padding: 16, borderRadius: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ya-text-muted)', letterSpacing: '0.07em', marginBottom: 14 }}>
          РАСПРЕДЕЛЕНИЕ УГРОЗ
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg viewBox="0 0 36 36" style={{ width: 90, height: 90, flexShrink: 0, transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--ya-border)" strokeWidth="3.5" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--ya-red)"    strokeWidth="3.5" strokeDasharray="38 62" strokeLinecap="round" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--ya-orange)" strokeWidth="3.5" strokeDasharray="24 76" strokeDashoffset="-38" strokeLinecap="round" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--ya-yellow)" strokeWidth="3.5" strokeDasharray="23 77" strokeDashoffset="-62" strokeLinecap="round" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--ya-blue)"   strokeWidth="3.5" strokeDasharray="15 85" strokeDashoffset="-85" strokeLinecap="round" />
          </svg>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {[
              { l: 'Критические', p: '38%', c: 'var(--ya-red)'    },
              { l: 'Высокие',     p: '24%', c: 'var(--ya-orange)' },
              { l: 'Средние',     p: '23%', c: 'var(--ya-yellow)' },
              { l: 'Низкие',      p: '15%', c: 'var(--ya-blue)'   },
            ].map((t) => (
              <div key={t.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 9, height: 9, borderRadius: 2, background: t.c }} />
                  <span style={{ fontSize: 12.5, color: 'var(--ya-text-sec)' }}>{t.l}</span>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: t.c }}>{t.p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── СЛОИ ───────────────────────────────────────────────────── */
function LayersPanel({ mapMode, onModeChange }: { mapMode: MapMode; onModeChange: (m: MapMode) => void }) {
  const [layers, setLayers] = useState(LAYERS_LIST);
  const toggle = (id: number) => setLayers((p) => p.map((l) => (l.id === id ? { ...l, on: !l.on } : l)));

  return (
    <div className="h-full overflow-y-auto" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ya-text)' }}>Слои</h2>
        <button className="ya-btn" style={{ fontSize: 12 }}
          onClick={() => setLayers((p) => p.map((l) => ({ ...l, on: true })))}>
          Включить все
        </button>
      </div>

      {/* Layers list */}
      <div className="ya-panel" style={{ borderRadius: 12, overflow: 'hidden' }}>
        {layers.map((layer, i) => (
          <div key={layer.id}>
            {i > 0 && <div className="ya-divider" />}
            <div onClick={() => toggle(layer.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ya-bg-soft)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name={layer.icon} size={15} style={{ color: layer.on ? layer.color : 'var(--ya-text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, fontWeight: 500, color: layer.on ? 'var(--ya-text)' : 'var(--ya-text-muted)' }}>{layer.label}</span>
              </div>
              <button className={`ya-toggle ${layer.on ? 'on' : ''}`}
                style={layer.on ? { background: layer.color } : {}}
                onClick={(e) => { e.stopPropagation(); toggle(layer.id); }} />
            </div>
          </div>
        ))}
      </div>

      {/* Basemap */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ya-text-muted)', letterSpacing: '0.07em', marginBottom: 10 }}>
          ПОДЛОЖКА КАРТЫ
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {BASEMAPS.map((b) => (
            <button key={b.id}
              onClick={() => onModeChange(b.id)}
              style={{
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                border: `2px solid ${mapMode === b.id ? 'var(--ya-orange)' : 'var(--ya-border)'}`,
                background: mapMode === b.id ? 'rgba(255,115,0,0.06)' : 'var(--ya-bg)',
                transition: 'all 0.15s', textAlign: 'left',
                boxShadow: mapMode === b.id ? '0 0 0 3px rgba(255,115,0,0.1)' : 'none',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <Icon name={b.icon} size={14} style={{ color: mapMode === b.id ? 'var(--ya-orange)' : 'var(--ya-text-muted)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: mapMode === b.id ? 'var(--ya-orange)' : 'var(--ya-text)' }}>{b.label}</span>
                {mapMode === b.id && (
                  <div style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: 'var(--ya-orange)' }} />
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ya-text-muted)' }}>{b.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── ФИЛЬТРЫ ────────────────────────────────────────────────── */
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
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ya-text)' }}>Фильтры</h2>
        <button className="ya-btn"
          style={{ fontSize: 12, color: 'var(--ya-red)', borderColor: 'rgba(239,68,68,0.22)' }}
          onClick={() => { setSel(groups.map(() => 0)); setRadius(65); }}>
          Сбросить
        </button>
      </div>

      {groups.map((g, gi) => (
        <div key={g.label} className="ya-panel" style={{ padding: '13px 14px', borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ya-text-muted)', letterSpacing: '0.07em', marginBottom: 10 }}>
            {g.label.toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {g.items.map((item, ii) => (
              <button key={item}
                className={`ya-chip ${sel[gi] === ii ? 'active' : ''}`}
                onClick={() => setSel((p) => p.map((v, i) => (i === gi ? ii : v)))}>
                {item}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="ya-panel" style={{ padding: '13px 14px', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ya-text-muted)', letterSpacing: '0.07em' }}>РАДИУС ПОИСКА</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ya-orange)' }}>{radius} км</span>
        </div>
        <input type="range" min={5} max={500} value={radius}
          onChange={(e) => setRadius(+e.target.value)}
          style={{ width: '100%', accentColor: 'var(--ya-orange)', cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 10, color: 'var(--ya-text-muted)' }}>5 км</span>
          <span style={{ fontSize: 10, color: 'var(--ya-text-muted)' }}>500 км</span>
        </div>
      </div>

      <button className="ya-btn ya-btn-orange"
        style={{ width: '100%', padding: '11px 0', fontSize: 14, fontWeight: 600, borderRadius: 10 }}>
        Применить фильтры
      </button>
    </div>
  );
}

/* ── ЭКСПОРТ ────────────────────────────────────────────────── */
function ExportPanel() {
  const [picked, setPicked] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  const start = () => {
    if (!picked || busy) return;
    setBusy(true); setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(iv); setBusy(false); return 100; }
        return p + Math.random() * 11;
      });
    }, 150);
  };

  return (
    <div className="h-full overflow-y-auto" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ya-text)' }}>Экспорт</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {EXPORT_FORMATS.map((f) => (
          <button key={f.id}
            onClick={() => { setPicked(f.id); setProgress(0); setBusy(false); }}
            style={{
              padding: '13px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
              border: `1.5px solid ${picked === f.id ? f.color + '66' : 'var(--ya-border)'}`,
              background: picked === f.id ? f.color + '0d' : 'var(--ya-bg)',
              textAlign: 'left', transition: 'all 0.15s',
            }}>
            <Icon name={f.icon} size={17} style={{ color: f.color, marginBottom: 7 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ya-text)' }}>{f.label}</div>
          </button>
        ))}
      </div>

      <div className="ya-panel" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px 4px', fontSize: 11, fontWeight: 700, color: 'var(--ya-text-muted)', letterSpacing: '0.07em' }}>ПАРАМЕТРЫ</div>
        {['Включить статистику', 'Легенда карты', 'Сжать данные', 'Метаданные'].map((opt, i) => (
          <div key={opt}>
            {i > 0 && <div className="ya-divider" />}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer' }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid var(--ya-orange)', background: 'rgba(255,115,0,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="Check" size={10} style={{ color: 'var(--ya-orange)' }} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--ya-text-sec)' }}>{opt}</span>
            </label>
          </div>
        ))}
      </div>

      {(busy || progress === 100) && (
        <div className="ya-panel anim-fadein" style={{ padding: '12px 14px', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ya-text-sec)' }}>{busy ? 'Экспортирую...' : 'Готово!'}</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ya-orange)' }}>{Math.min(Math.round(progress), 100)}%</span>
          </div>
          <div style={{ height: 5, background: 'var(--ya-border)', borderRadius: 5 }}>
            <div className="ya-progress-fill" style={{ width: `${Math.min(progress, 100)}%`, background: 'var(--ya-orange)' }} />
          </div>
          {progress >= 100 && !busy && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <Icon name="CheckCircle" size={14} style={{ color: 'var(--ya-green)' }} />
              <span style={{ fontSize: 12.5, color: 'var(--ya-green)', fontWeight: 500 }}>Файл готов к скачиванию</span>
            </div>
          )}
        </div>
      )}

      <button className={`ya-btn ${picked ? 'ya-btn-orange' : ''}`}
        disabled={!picked || busy} onClick={start}
        style={{ width: '100%', padding: '11px 0', fontSize: 14, fontWeight: 600, borderRadius: 10, opacity: (!picked || busy) ? 0.5 : 1 }}>
        {busy ? 'Идёт экспорт...' : 'Экспортировать'}
      </button>
    </div>
  );
}

/* ── СПРАВКА ────────────────────────────────────────────────── */
function HelpPanel() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="h-full overflow-y-auto" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ya-text)' }}>Справка</h2>

      <div className="ya-panel" style={{ padding: '12px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,115,0,0.09)', border: '1px solid rgba(255,115,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="Globe" size={19} style={{ color: 'var(--ya-orange)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ya-text)' }}>ТАКТИКА v1.0.0</div>
          <div style={{ fontSize: 12, color: 'var(--ya-text-muted)' }}>Военно-аналитическая карта · РФ</div>
        </div>
        <div style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <div className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>Онлайн</span>
        </div>
      </div>

      <div className="ya-panel" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px 4px', fontSize: 11, fontWeight: 700, color: 'var(--ya-text-muted)', letterSpacing: '0.07em' }}>ЧАСТЫЕ ВОПРОСЫ</div>
        {HELP_FAQ.map((item, i) => (
          <div key={i}>
            <div className="ya-divider" />
            <button style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', gap: 10 }}
              onClick={() => setOpen(open === i ? null : i)}>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: open === i ? 'var(--ya-orange)' : 'var(--ya-text)', textAlign: 'left' }}>
                {item.q}
              </span>
              <Icon name={open === i ? 'ChevronUp' : 'ChevronDown'} size={14} style={{ color: 'var(--ya-text-muted)', flexShrink: 0 }} />
            </button>
            {open === i && (
              <div className="anim-fadein" style={{ padding: '0 14px 13px', fontSize: 13, color: 'var(--ya-text-sec)', lineHeight: 1.65, borderTop: '1px solid var(--ya-border-soft)' }}>
                <br />{item.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="ya-panel" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px 4px', fontSize: 11, fontWeight: 700, color: 'var(--ya-text-muted)', letterSpacing: '0.07em' }}>ГОРЯЧИЕ КЛАВИШИ</div>
        {[['M', 'Карта'], ['A', 'Аналитика'], ['L', 'Слои'], ['F', 'Фильтры'], ['Esc', 'Закрыть']].map(([k, d], i) => (
          <div key={k}>
            <div className="ya-divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px' }}>
              <span style={{ fontSize: 13, color: 'var(--ya-text-sec)' }}>{d}</span>
              <kbd style={{ padding: '2px 9px', borderRadius: 6, background: 'var(--ya-bg-muted)', border: '1px solid var(--ya-border)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--ya-text)' }}>{k}</kbd>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── ROOT ───────────────────────────────────────────────────── */
export default function Index() {
  const [tab, setTab] = useState<Tab>('map');
  const [mapMode, setMapMode] = useState<MapMode>('osm');
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
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--ya-bg-soft)', fontFamily: "'Golos Text', system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{ flexShrink: 0, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: 'var(--ya-panel)', borderBottom: '1px solid var(--ya-border)', boxShadow: '0 1px 0 var(--ya-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--ya-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(255,115,0,0.3)' }}>
            <Icon name="Crosshair" size={16} style={{ color: '#fff' }} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ya-text)', letterSpacing: '-0.02em' }}>ТАКТИКА</span>
          <span style={{ fontSize: 11, color: 'var(--ya-text-muted)', background: 'var(--ya-bg-muted)', padding: '1px 7px', borderRadius: 5, border: '1px solid var(--ya-border)' }}>v1.0</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {[{ l: 'Соединение', ok: true }, { l: 'Синхронизация', ok: false }].map((s) => (
            <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div className={s.ok ? 'blink' : ''} style={{ width: 6, height: 6, borderRadius: '50%', background: s.ok ? '#16a34a' : '#d97706', boxShadow: `0 0 4px ${s.ok ? '#16a34a' : '#d97706'}` }} />
              <span style={{ fontSize: 11.5, color: 'var(--ya-text-muted)' }}>{s.l}</span>
            </div>
          ))}
          <div style={{ height: 18, width: 1, background: 'var(--ya-border)' }} />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ya-text)', fontFamily: 'JetBrains Mono, monospace' }}>{time}</span>
          <span style={{ fontSize: 11, color: 'var(--ya-text-muted)' }}>МСК</span>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* SIDEBAR */}
        <aside style={{ flexShrink: 0, width: collapsed ? 52 : 208, display: 'flex', flexDirection: 'column', background: 'var(--ya-panel)', borderRight: '1px solid var(--ya-border)', transition: 'width 0.22s ease' }}>
          <button onClick={() => setCollapsed(!collapsed)}
            style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', borderBottom: '1px solid var(--ya-border)', cursor: 'pointer', color: 'var(--ya-text-muted)', flexShrink: 0 }}>
            <Icon name={collapsed ? 'ChevronRight' : 'ChevronLeft'} size={16} />
          </button>

          <nav style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
            {NAV.map((item) => (
              <button key={item.id}
                className={`ya-nav-item ${tab === item.id ? 'active' : ''}`}
                style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '9px 0' : '8px 10px' }}
                onClick={() => setTab(item.id)}>
                <Icon name={item.icon} size={17} style={{ flexShrink: 0, color: tab === item.id ? 'var(--ya-orange)' : 'var(--ya-text-sec)' }} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          {!collapsed && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--ya-border)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <div className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: 'var(--ya-text-muted)' }}>Система активна</span>
            </div>
          )}
        </aside>

        {/* CONTENT */}
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative', background: 'var(--ya-bg-soft)' }}>
          {tab === 'map'       && <div style={{ width: '100%', height: '100%' }}><MapPanel mapMode={mapMode} onModeChange={setMapMode} /></div>}
          {tab === 'analytics' && <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}><AnalyticsPanel /></div>}
          {tab === 'layers'    && <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}><LayersPanel mapMode={mapMode} onModeChange={setMapMode} /></div>}
          {tab === 'filters'   && <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}><FiltersPanel /></div>}
          {tab === 'export'    && <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}><ExportPanel /></div>}
          {tab === 'help'      && <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}><HelpPanel /></div>}
        </main>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ flexShrink: 0, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: 'var(--ya-panel)', borderTop: '1px solid var(--ya-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 11, color: 'var(--ya-text-muted)' }}>ТАКТИКА · Военно-аналитическая карта</span>
          <span style={{ fontSize: 11, color: 'var(--ya-border)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a' }} />
            <span style={{ fontSize: 11, color: 'var(--ya-text-muted)' }}>Защищённое соединение</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 11, color: 'var(--ya-text-muted)' }}>Объектов: 2 841</span>
          <span style={{ fontSize: 11, color: 'var(--ya-orange)', fontWeight: 600 }}>© 2026 ТАКТИКА</span>
        </div>
      </footer>

    </div>
  );
}
