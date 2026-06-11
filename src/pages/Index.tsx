import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

type Tab = 'map' | 'analytics' | 'layers' | 'filters' | 'export' | 'help';

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'map',       label: 'Карта',      icon: 'Map' },
  { id: 'analytics', label: 'Аналитика',  icon: 'BarChart3' },
  { id: 'layers',    label: 'Слои',       icon: 'Layers' },
  { id: 'filters',   label: 'Фильтры',    icon: 'SlidersHorizontal' },
  { id: 'export',    label: 'Экспорт',    icon: 'Download' },
  { id: 'help',      label: 'Справка',    icon: 'HelpCircle' },
];

const STATS = [
  { label: 'Объектов', value: '2 841', delta: '+14', color: 'var(--neon-green)' },
  { label: 'Активных', value: '384',   delta: '+3',  color: 'var(--neon-orange)' },
  { label: 'Угроз',    value: '127',   delta: '-5',  color: 'var(--neon-red)' },
  { label: 'Секторов', value: '48',    delta: '0',   color: 'var(--neon-blue)' },
];

const MARKERS = [
  { lat: 51.5, lng: 31.2, type: 'friendly', label: 'Позиция А-7' },
  { lat: 50.8, lng: 33.6, type: 'enemy',    label: 'Объект X-3'  },
  { lat: 52.1, lng: 30.0, type: 'intel',    label: 'Разведка-11' },
  { lat: 49.5, lng: 36.1, type: 'enemy',    label: 'Группа В-2'  },
  { lat: 53.3, lng: 28.5, type: 'neutral',  label: 'Транзит-4'   },
  { lat: 50.2, lng: 38.0, type: 'friendly', label: 'База Центр'  },
  { lat: 48.9, lng: 34.7, type: 'intel',    label: 'Наблюд.-5'   },
  { lat: 51.8, lng: 35.5, type: 'enemy',    label: 'Цель D-9'    },
];

const CHART_DATA = [
  { month: 'Янв', friendly: 40, enemy: 28, intel: 15 },
  { month: 'Фев', friendly: 55, enemy: 35, intel: 22 },
  { month: 'Мар', friendly: 38, enemy: 42, intel: 18 },
  { month: 'Апр', friendly: 62, enemy: 31, intel: 28 },
  { month: 'Май', friendly: 71, enemy: 25, intel: 35 },
  { month: 'Июн', friendly: 65, enemy: 39, intel: 30 },
];

const LAYERS_DATA = [
  { id: 1, label: 'Тактические позиции',  icon: 'Shield',    color: 'var(--neon-green)',  active: true  },
  { id: 2, label: 'Вражеские объекты',    icon: 'Target',    color: 'var(--neon-red)',    active: true  },
  { id: 3, label: 'Разведданные',         icon: 'Eye',       color: 'var(--neon-blue)',   active: true  },
  { id: 4, label: 'Транспортные узлы',    icon: 'Truck',     color: 'var(--neon-orange)', active: false },
  { id: 5, label: 'Зоны контроля',        icon: 'MapPin',    color: '#a78bfa',            active: false },
  { id: 6, label: 'Рельеф',              icon: 'Mountain',  color: '#60a5fa',            active: true  },
  { id: 7, label: 'Инфраструктура',      icon: 'Building2', color: '#f472b6',            active: false },
  { id: 8, label: 'Связь и сети',        icon: 'Radio',     color: '#34d399',            active: true  },
];

const FILTER_OPTIONS = [
  { group: 'Временной диапазон', items: ['Последние 24ч', 'Последние 7 дней', 'Последние 30 дней', 'Произвольный'] },
  { group: 'Тип объекта',        items: ['Все типы', 'Военные', 'Гражданские', 'Транспорт', 'Связь'] },
  { group: 'Приоритет угрозы',   items: ['Любой', 'Критический', 'Высокий', 'Средний', 'Низкий'] },
  { group: 'Статус',             items: ['Все', 'Активные', 'Неактивные', 'Под наблюдением'] },
];

const EXPORT_FORMATS = [
  { id: 'pdf',  label: 'PDF-отчёт',         desc: 'Полный отчёт с картой и статистикой', icon: 'FileText', color: 'var(--neon-red)'    },
  { id: 'xlsx', label: 'Excel таблица',      desc: 'Данные XLSX для анализа',             icon: 'Table',    color: 'var(--neon-green)'  },
  { id: 'kml',  label: 'KML / Google Earth', desc: 'Экспорт геоданных',                   icon: 'Globe',    color: 'var(--neon-blue)'   },
  { id: 'json', label: 'JSON / API',         desc: 'Машиночитаемый формат',               icon: 'Code2',    color: '#a78bfa'             },
  { id: 'png',  label: 'Снимок карты',       desc: 'PNG текущего вида карты',             icon: 'Image',    color: 'var(--neon-orange)' },
  { id: 'gpx',  label: 'GPX маршруты',       desc: 'Экспорт маршрутов и путей',           icon: 'Route',    color: '#f472b6'             },
];

declare global {
   
  interface Window { L: unknown; }
}

function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: [51.0, 33.0],
      zoom: 6,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    MARKERS.forEach((m) => {
      const colorMap: Record<string, string> = {
        friendly: '#39ff8a',
        enemy: '#ff3b30',
        neutral: '#ff6b1a',
        intel: '#00d4ff',
      };
      const color = colorMap[m.type] || '#fff';

      const icon = L.divIcon({
        className: '',
        html: `<div class="tactic-marker ${m.type}" style="color:${color}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      L.marker([m.lat, m.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="background:#0d1318;border:1px solid ${color};padding:8px 12px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:${color};min-width:140px;">
            <div style="font-weight:600;margin-bottom:4px;">${m.label}</div>
            <div style="color:#666;font-size:10px;">Тип: ${m.type}</div>
            <div style="color:#666;font-size:10px;">Статус: активен</div>
          </div>`,
          { className: 'tactic-popup' }
        );
    });

    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <div className="map-grid-overlay scanlines" />

      <div className="absolute top-3 right-3 z-[600] panel-glass neon-border px-3 py-2 font-mono text-xs"
           style={{ color: 'var(--neon-green)' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="status-blip animate-blink" />
          <span style={{ color: '#556677' }}>LIVE</span>
        </div>
        <div>51°02′N  33°00′E</div>
        <div style={{ color: '#556677' }}>Zoom: 6 | UTM 37U</div>
      </div>

      <div className="absolute bottom-6 right-3 z-[600] flex flex-col gap-1">
        {['+', '−'].map((s, i) => (
          <button key={i}
            onClick={() => { const m = mapInstanceRef.current; if (m) { if (i === 0) { m.zoomIn(); } else { m.zoomOut(); } } }}
            className="w-8 h-8 panel-glass neon-border flex items-center justify-center font-oswald text-lg transition-all hover:bg-[rgba(57,255,138,0.15)]"
            style={{ color: 'var(--neon-green)' }}>
            {s}
          </button>
        ))}
      </div>

      <div className="absolute bottom-6 left-3 z-[600] panel-glass neon-border px-3 py-2 font-mono text-xs space-y-1">
        {[
          { color: '#39ff8a', label: 'Свои позиции' },
          { color: '#ff3b30', label: 'Противник'    },
          { color: '#ff6b1a', label: 'Нейтральные'  },
          { color: '#00d4ff', label: 'Разведка'     },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: l.color, boxShadow: `0 0 5px ${l.color}` }} />
            <span style={{ color: '#889' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsView() {
  const maxVal = 80;
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-oswald text-2xl font-semibold tracking-wider glow-text" style={{ color: 'var(--neon-green)' }}>
          АНАЛИТИКА
        </h2>
        <span className="font-mono text-xs px-2 py-1 rounded"
          style={{ background: 'rgba(57,255,138,0.1)', color: 'var(--neon-green)' }}>
          11.06.2026 06:42
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {STATS.map((s) => (
          <div key={s.label} className="panel-glass neon-border rounded p-4">
            <div className="font-mono text-xs mb-1" style={{ color: '#556677' }}>{s.label}</div>
            <div className="font-oswald text-3xl font-bold"
              style={{ color: s.color, textShadow: `0 0 12px ${s.color}` }}>
              {s.value}
            </div>
            <div className="font-mono text-xs mt-1"
              style={{ color: s.delta.startsWith('-') ? 'var(--neon-red)' : 'var(--neon-green)' }}>
              {s.delta} за 24ч
            </div>
          </div>
        ))}
      </div>

      <div className="panel-glass neon-border rounded p-4">
        <div className="font-rajdhani text-sm font-semibold mb-4 tracking-wider" style={{ color: '#aabbcc' }}>
          АКТИВНОСТЬ ПО МЕСЯЦАМ
        </div>
        <div className="flex items-end gap-2 h-32">
          {CHART_DATA.map((d, i) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-[2px] items-end" style={{ height: '100px' }}>
                {[
                  { val: d.friendly, color: 'var(--neon-green)' },
                  { val: d.enemy,    color: 'var(--neon-red)'   },
                  { val: d.intel,    color: 'var(--neon-blue)'  },
                ].map((bar, j) => (
                  <div key={j} className="flex-1 rounded-sm chart-bar"
                    style={{
                      height: `${(bar.val / maxVal) * 100}px`,
                      background: bar.color,
                      opacity: 0.85,
                      boxShadow: `0 0 4px ${bar.color}`,
                    }} />
                ))}
              </div>
              <span className="font-mono text-[9px]" style={{ color: '#556677' }}>{d.month}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3">
          {[
            { label: 'Свои',     color: 'var(--neon-green)' },
            { label: 'Против.',  color: 'var(--neon-red)'   },
            { label: 'Разведка', color: 'var(--neon-blue)'  },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <div className="w-2 h-2" style={{ background: l.color }} />
              <span className="font-mono text-[10px]" style={{ color: '#556677' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-glass neon-border rounded p-4">
        <div className="font-rajdhani text-sm font-semibold mb-4 tracking-wider" style={{ color: '#aabbcc' }}>
          РАСПРЕДЕЛЕНИЕ УГРОЗ
        </div>
        <div className="flex gap-4 items-center">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#1e2d1e" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--neon-red)" strokeWidth="3"
                strokeDasharray="40 60" strokeLinecap="round" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--neon-orange)" strokeWidth="3"
                strokeDasharray="25 75" strokeDashoffset="-40" strokeLinecap="round" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--neon-green)" strokeWidth="3"
                strokeDasharray="22 78" strokeDashoffset="-65" strokeLinecap="round" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--neon-blue)" strokeWidth="3"
                strokeDasharray="13 87" strokeDashoffset="-87" strokeLinecap="round" />
            </svg>
          </div>
          <div className="space-y-2 flex-1">
            {[
              { label: 'Критические', pct: '40%', color: 'var(--neon-red)'    },
              { label: 'Высокие',     pct: '25%', color: 'var(--neon-orange)' },
              { label: 'Средние',     pct: '22%', color: 'var(--neon-green)'  },
              { label: 'Низкие',      pct: '13%', color: 'var(--neon-blue)'   },
            ].map((t) => (
              <div key={t.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm" style={{ background: t.color }} />
                  <span className="font-mono text-xs" style={{ color: '#889' }}>{t.label}</span>
                </div>
                <span className="font-mono text-xs font-semibold" style={{ color: t.color }}>{t.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LayersView() {
  const [layers, setLayers] = useState(LAYERS_DATA);

  const toggle = (id: number) =>
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, active: !l.active } : l)));

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-oswald text-2xl font-semibold tracking-wider glow-text" style={{ color: 'var(--neon-green)' }}>
          СЛОИ КАРТЫ
        </h2>
        <button
          className="font-mono text-xs px-3 py-1 rounded transition-all hover:opacity-80"
          style={{ background: 'rgba(57,255,138,0.1)', color: 'var(--neon-green)', border: '1px solid rgba(57,255,138,0.3)' }}
          onClick={() => setLayers((p) => p.map((l) => ({ ...l, active: true })))}>
          Включить все
        </button>
      </div>

      <div className="space-y-2">
        {layers.map((layer) => (
          <div key={layer.id}
            className="panel-glass rounded p-3 flex items-center justify-between cursor-pointer transition-all hover:bg-[rgba(57,255,138,0.04)]"
            style={{ borderLeft: `3px solid ${layer.active ? layer.color : '#1e2d1e'}`, borderTop: '1px solid #1e2d1e', borderRight: '1px solid #1e2d1e', borderBottom: '1px solid #1e2d1e' }}
            onClick={() => toggle(layer.id)}>
            <div className="flex items-center gap-3">
              <Icon name={layer.icon} size={16} style={{ color: layer.active ? layer.color : '#445' }} />
              <span className="font-rajdhani text-sm font-medium" style={{ color: layer.active ? '#ccd' : '#556' }}>
                {layer.label}
              </span>
            </div>
            <div className={`toggle-layer ${layer.active ? 'active' : ''}`}
              style={layer.active ? { borderColor: layer.color, background: `${layer.color}22`, boxShadow: `0 0 8px ${layer.color}44` } : {}}
            />
          </div>
        ))}
      </div>

      <div className="panel-glass neon-border rounded p-4 space-y-3">
        <div className="font-rajdhani text-sm font-semibold tracking-wider" style={{ color: '#aabbcc' }}>ПОДЛОЖКА КАРТЫ</div>
        {['OpenStreetMap', 'Спутник', 'Рельеф', 'Тёмная тема'].map((name, i) => (
          <label key={name} className="flex items-center gap-3 cursor-pointer">
            <div className="w-3 h-3 rounded-full border flex items-center justify-center"
              style={{ borderColor: i === 0 ? 'var(--neon-green)' : '#334' }}>
              {i === 0 && <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--neon-green)' }} />}
            </div>
            <span className="font-mono text-xs" style={{ color: i === 0 ? 'var(--neon-green)' : '#556677' }}>{name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FiltersView() {
  const [selected, setSelected] = useState(FILTER_OPTIONS.map(() => 0));
  const [range, setRange] = useState(65);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-oswald text-2xl font-semibold tracking-wider glow-text" style={{ color: 'var(--neon-green)' }}>
          ФИЛЬТРЫ
        </h2>
        <button
          className="font-mono text-xs px-3 py-1 rounded transition-all"
          style={{ background: 'rgba(255,59,48,0.1)', color: 'var(--neon-red)', border: '1px solid rgba(255,59,48,0.3)' }}
          onClick={() => setSelected(FILTER_OPTIONS.map(() => 0))}>
          Сбросить
        </button>
      </div>

      {FILTER_OPTIONS.map((group, gi) => (
        <div key={group.group} className="panel-glass neon-border rounded p-4 space-y-3">
          <div className="font-rajdhani text-sm font-semibold tracking-wider" style={{ color: '#aabbcc' }}>
            {group.group.toUpperCase()}
          </div>
          <div className="flex flex-wrap gap-2">
            {group.items.map((item, ii) => (
              <button key={item}
                className="font-mono text-xs px-3 py-1.5 rounded transition-all"
                style={{
                  background: selected[gi] === ii ? 'rgba(57,255,138,0.15)' : 'rgba(30,45,30,0.5)',
                  color:      selected[gi] === ii ? 'var(--neon-green)' : '#556677',
                  border:     `1px solid ${selected[gi] === ii ? 'rgba(57,255,138,0.4)' : '#1e2d1e'}`,
                  boxShadow:  selected[gi] === ii ? '0 0 8px rgba(57,255,138,0.2)' : 'none',
                }}
                onClick={() => setSelected((prev) => prev.map((v, i) => (i === gi ? ii : v)))}>
                {item}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="panel-glass neon-border rounded p-4 space-y-3">
        <div className="font-rajdhani text-sm font-semibold tracking-wider flex justify-between" style={{ color: '#aabbcc' }}>
          <span>РАДИУС ПОИСКА</span>
          <span style={{ color: 'var(--neon-green)' }}>{range} км</span>
        </div>
        <input type="range" min={5} max={500} value={range}
          onChange={(e) => setRange(Number(e.target.value))}
          className="w-full h-1 rounded appearance-none cursor-pointer"
          style={{ accentColor: 'var(--neon-green)' }}
        />
        <div className="flex justify-between font-mono text-[9px]" style={{ color: '#445566' }}>
          <span>5 км</span><span>500 км</span>
        </div>
      </div>

      <button className="w-full py-3 font-oswald text-sm font-semibold tracking-widest rounded transition-all hover:brightness-110"
        style={{ background: 'rgba(57,255,138,0.15)', color: 'var(--neon-green)', border: '1px solid rgba(57,255,138,0.4)', boxShadow: '0 0 16px rgba(57,255,138,0.1)' }}>
        ПРИМЕНИТЬ ФИЛЬТРЫ
      </button>
    </div>
  );
}

function ExportView() {
  const [picked, setPicked] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    if (!picked) return;
    setExporting(true);
    setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(iv); setExporting(false); return 100; }
        return p + Math.random() * 12;
      });
    }, 150);
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 animate-fade-in">
      <h2 className="font-oswald text-2xl font-semibold tracking-wider glow-text" style={{ color: 'var(--neon-green)' }}>
        ЭКСПОРТ ДАННЫХ
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {EXPORT_FORMATS.map((fmt) => (
          <div key={fmt.id}
            className="panel-glass rounded p-3 cursor-pointer transition-all hover:scale-[1.02]"
            style={{
              borderLeft: `3px solid ${picked === fmt.id ? fmt.color : '#1e2d1e'}`,
              borderTop: '1px solid #1e2d1e', borderRight: '1px solid #1e2d1e', borderBottom: '1px solid #1e2d1e',
              background: picked === fmt.id ? `${fmt.color}10` : 'rgba(13,19,24,0.95)',
            }}
            onClick={() => setPicked(fmt.id)}>
            <div className="flex items-center gap-2 mb-1">
              <Icon name={fmt.icon} size={14} style={{ color: fmt.color }} />
              <span className="font-rajdhani text-sm font-semibold" style={{ color: '#ccd' }}>{fmt.label}</span>
            </div>
            <p className="font-mono text-[10px] leading-tight" style={{ color: '#556677' }}>{fmt.desc}</p>
          </div>
        ))}
      </div>

      <div className="panel-glass neon-border rounded p-4 space-y-3">
        <div className="font-rajdhani text-sm font-semibold tracking-wider" style={{ color: '#aabbcc' }}>ПАРАМЕТРЫ</div>
        {['Включить статистику', 'Включить легенду', 'Сжать данные', 'Добавить метаданные'].map((opt) => (
          <label key={opt} className="flex items-center gap-3 cursor-pointer">
            <div className="w-4 h-4 rounded border flex items-center justify-center"
              style={{ borderColor: 'rgba(57,255,138,0.3)', background: 'rgba(57,255,138,0.08)' }}>
              <Icon name="Check" size={10} style={{ color: 'var(--neon-green)' }} />
            </div>
            <span className="font-mono text-xs" style={{ color: '#778899' }}>{opt}</span>
          </label>
        ))}
      </div>

      {exporting && (
        <div className="space-y-2">
          <div className="flex justify-between font-mono text-xs" style={{ color: '#778899' }}>
            <span>Экспорт...</span>
            <span style={{ color: 'var(--neon-green)' }}>{Math.min(Math.round(progress), 100)}%</span>
          </div>
          <div className="w-full h-1 rounded" style={{ background: '#1e2d1e' }}>
            <div className="h-full rounded transition-all duration-150"
              style={{ width: `${Math.min(progress, 100)}%`, background: 'var(--neon-green)', boxShadow: '0 0 8px var(--neon-green)' }} />
          </div>
        </div>
      )}

      {progress >= 100 && !exporting && (
        <div className="panel-glass rounded p-3 flex items-center gap-2 animate-fade-in"
          style={{ border: '1px solid rgba(57,255,138,0.4)' }}>
          <Icon name="CheckCircle" size={16} style={{ color: 'var(--neon-green)' }} />
          <span className="font-mono text-xs" style={{ color: 'var(--neon-green)' }}>Файл готов к скачиванию</span>
        </div>
      )}

      <button
        className="w-full py-3 font-oswald text-sm font-semibold tracking-widest rounded transition-all hover:brightness-110 disabled:opacity-40"
        disabled={!picked || exporting}
        onClick={handleExport}
        style={{
          background: picked ? 'rgba(57,255,138,0.15)' : 'rgba(30,45,30,0.3)',
          color:  picked ? 'var(--neon-green)' : '#445',
          border: `1px solid ${picked ? 'rgba(57,255,138,0.4)' : '#1e2d1e'}`,
        }}>
        {exporting ? 'ЭКСПОРТИРУЮ...' : 'ЭКСПОРТИРОВАТЬ'}
      </button>
    </div>
  );
}

function HelpView() {
  const [open, setOpen] = useState<number | null>(0);
  const items = [
    { q: 'Как добавить маркер на карту?',    a: 'Нажмите на карте правой кнопкой мыши и выберите "Добавить объект". Заполните форму с типом, координатами и описанием объекта.' },
    { q: 'Как включить/выключить слои?',     a: 'Перейдите в раздел "Слои". Каждый слой переключается кликом. Кнопка "Включить все" активирует все слои сразу.' },
    { q: 'Как экспортировать данные?',       a: 'Раздел "Экспорт" — выберите формат (PDF, Excel, KML и др.), настройте параметры и нажмите "Экспортировать".' },
    { q: 'Что означают цвета маркеров?',     a: 'Зелёный — свои позиции. Красный — противник. Оранжевый — нейтральные. Синий — разведывательные данные.' },
    { q: 'Как настроить фильтры?',           a: 'Раздел "Фильтры" — выберите временной диапазон, тип объекта, приоритет угрозы и радиус поиска. Нажмите "Применить".' },
    { q: 'Как обновляются данные?',          a: 'Данные обновляются каждые 5 минут. Индикатор LIVE в правом углу карты показывает активное соединение.' },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 animate-fade-in">
      <h2 className="font-oswald text-2xl font-semibold tracking-wider glow-text" style={{ color: 'var(--neon-green)' }}>
        СПРАВКА
      </h2>

      <div className="panel-glass neon-border rounded p-4 flex items-center gap-3">
        <Icon name="Shield" size={20} style={{ color: 'var(--neon-green)' }} />
        <div>
          <div className="font-rajdhani text-sm font-semibold" style={{ color: '#ccd' }}>ТАКТИКА v1.0.0</div>
          <div className="font-mono text-xs" style={{ color: '#556677' }}>Военно-аналитическая карта • Россия</div>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="panel-glass rounded overflow-hidden"
            style={{ border: `1px solid ${open === i ? 'rgba(57,255,138,0.25)' : '#1e2d1e'}` }}>
            <button className="w-full flex items-center justify-between p-4 text-left transition-all hover:bg-[rgba(57,255,138,0.04)]"
              onClick={() => setOpen(open === i ? null : i)}>
              <span className="font-rajdhani text-sm font-medium" style={{ color: open === i ? 'var(--neon-green)' : '#aabbcc' }}>
                {item.q}
              </span>
              <Icon name={open === i ? 'ChevronUp' : 'ChevronDown'} size={14}
                style={{ color: open === i ? 'var(--neon-green)' : '#445566', flexShrink: 0 }} />
            </button>
            {open === i && (
              <div className="px-4 pb-4 font-mono text-xs leading-relaxed animate-fade-in"
                style={{ color: '#778899', borderTop: '1px solid #1e2d1e', paddingTop: '12px' }}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="panel-glass rounded p-4 space-y-2" style={{ border: '1px solid rgba(255,107,26,0.2)' }}>
        <div className="font-rajdhani text-sm font-semibold mb-3" style={{ color: 'var(--neon-orange)' }}>ГОРЯЧИЕ КЛАВИШИ</div>
        {[['M', 'Карта'], ['A', 'Аналитика'], ['L', 'Слои'], ['+/−', 'Масштаб карты'], ['Esc', 'Закрыть панель']].map(([key, desc]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="font-mono text-xs" style={{ color: '#556677' }}>{desc}</span>
            <kbd className="px-2 py-0.5 rounded font-mono text-xs"
              style={{ background: 'rgba(255,107,26,0.1)', color: 'var(--neon-orange)', border: '1px solid rgba(255,107,26,0.3)' }}>
              {key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>('map');
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
      if (e.key === 'm') setActiveTab('map');
      if (e.key === 'a') setActiveTab('analytics');
      if (e.key === 'l') setActiveTab('layers');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden" style={{ background: 'var(--dark-bg)' }}>

      {/* TOP BAR */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 panel-glass"
        style={{ borderBottom: '1px solid var(--panel-border)', height: '48px' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: 'rgba(57,255,138,0.15)', border: '1px solid rgba(57,255,138,0.3)' }}>
            <Icon name="Crosshair" size={14} style={{ color: 'var(--neon-green)' }} />
          </div>
          <span className="font-oswald text-base font-bold tracking-widest glow-text" style={{ color: 'var(--neon-green)' }}>
            ТАКТИКА
          </span>
          <span className="font-mono text-[10px]" style={{ color: '#334455' }}>v1.0</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4">
            {[{ label: 'СОЕДИНЕНИЕ', ok: true }, { label: 'ДАННЫЕ', ok: true }, { label: 'СИНХРОН.', ok: false }].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div className={`status-blip ${s.ok ? '' : 'orange'} animate-blink`} />
                <span className="font-mono text-[9px]" style={{ color: '#445566' }}>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="font-mono text-sm" style={{ color: 'var(--neon-green)', textShadow: '0 0 8px rgba(57,255,138,0.5)' }}>
            {time}
          </div>
          <span className="font-mono text-[10px]" style={{ color: '#445566' }}>МСК</span>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex-1 flex overflow-hidden">

        {/* SIDEBAR */}
        <aside className="flex-shrink-0 flex flex-col panel-glass transition-all duration-300"
          style={{ width: collapsed ? '52px' : '196px', borderRight: '1px solid var(--panel-border)' }}>
          <button
            className="p-3 flex items-center justify-center transition-all hover:bg-[rgba(57,255,138,0.06)]"
            style={{ borderBottom: '1px solid var(--panel-border)', color: '#445566' }}
            onClick={() => setCollapsed(!collapsed)}>
            <Icon name={collapsed ? 'ChevronRight' : 'ChevronLeft'} size={14} />
          </button>

          <nav className="flex-1 py-2">
            {NAV_ITEMS.map((item) => (
              <button key={item.id}
                className={`nav-item w-full flex items-center gap-3 px-3 py-3 text-left ${activeTab === item.id ? 'nav-item-active' : ''}`}
                style={{ color: activeTab === item.id ? 'var(--neon-green)' : '#556677' }}
                onClick={() => setActiveTab(item.id)}>
                <Icon name={item.icon} size={16} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <span className="font-rajdhani text-sm font-medium tracking-wide">{item.label}</span>
                )}
              </button>
            ))}
          </nav>

          {!collapsed && (
            <div className="p-3 space-y-1" style={{ borderTop: '1px solid var(--panel-border)' }}>
              <div className="font-mono text-[9px]" style={{ color: '#334455' }}>11.06.2026</div>
              <div className="flex items-center gap-1">
                <div className="status-blip" />
                <span className="font-mono text-[9px]" style={{ color: '#445566' }}>СИСТЕМА АКТИВНА</span>
              </div>
            </div>
          )}
        </aside>

        {/* CONTENT */}
        <main className="flex-1 overflow-hidden relative">
          {activeTab === 'map' && (
            <div className="w-full h-full relative">
              <MapView />
              <div className="absolute top-3 left-3 z-[600] flex gap-2">
                <div className="panel-glass neon-border px-3 py-1.5 font-mono text-xs flex items-center gap-2">
                  <Icon name="MapPin" size={11} style={{ color: 'var(--neon-orange)' }} />
                  <span style={{ color: '#778899' }}>Зона: </span>
                  <span style={{ color: 'var(--neon-orange)' }}>Восточная Европа</span>
                </div>
                <div className="panel-glass neon-border px-3 py-1.5 font-mono text-xs flex items-center gap-2">
                  <div className="status-blip animate-blink" />
                  <span style={{ color: '#778899' }}>Объектов: </span>
                  <span style={{ color: 'var(--neon-green)' }}>2 841</span>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'analytics' && <div className="w-full h-full overflow-hidden"><AnalyticsView /></div>}
          {activeTab === 'layers'    && <div className="w-full h-full overflow-hidden"><LayersView /></div>}
          {activeTab === 'filters'   && <div className="w-full h-full overflow-hidden"><FiltersView /></div>}
          {activeTab === 'export'    && <div className="w-full h-full overflow-hidden"><ExportView /></div>}
          {activeTab === 'help'      && <div className="w-full h-full overflow-hidden"><HelpView /></div>}
        </main>

      </div>

      {/* BOTTOM BAR */}
      <footer className="flex-shrink-0 flex items-center justify-between px-4 panel-glass"
        style={{ borderTop: '1px solid var(--panel-border)', height: '26px' }}>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[9px]" style={{ color: '#334455' }}>ТАКТИКА • ВОЕННО-АНАЛИТИЧЕСКАЯ КАРТА</span>
          <div className="flex items-center gap-1">
            <div className="status-blip" style={{ width: '5px', height: '5px' }} />
            <span className="font-mono text-[9px]" style={{ color: '#39ff8a55' }}>SECURE CONNECTION</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[9px]" style={{ color: '#334455' }}>Объектов: 2841</span>
          <span className="font-mono text-[9px]" style={{ color: '#39ff8a44' }}>© 2026 ТАКТИКА</span>
        </div>
      </footer>

    </div>
  );
}