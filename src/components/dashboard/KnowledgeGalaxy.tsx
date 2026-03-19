'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Save, RotateCcw, Plus, Minus } from 'lucide-react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  NodeProps,
  EdgeProps,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Note } from '@/types';

// ─── Category Colors ────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Work:     '#7C3AED',
  Personal: '#06B6D4',
  Ideas:    '#10B981',
  Research: '#F59E0B',
  Learning: '#EC4899',
  Creative: '#EF4444',
  default:  '#6366F1',
};

// ─── Custom Glowing Edge with Particle ─────────────────────────────────────────
function GlowEdge({ id, sourceX, sourceY, targetX, targetY, style, data }: EdgeProps) {
  // Calculate a taut, dynamic quadratic bezier curve between nodes
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  
  // Midpoint
  const mx = (sourceX + targetX) / 2;
  const my = (sourceY + targetY) / 2;

  // Perpendicular normal vector for curvature offset
  const nx = -dy / dist;
  const ny = dx / dist;

  // Alternate curve direction dynamically based on layout quadrants
  const curveDirection = (sourceX < targetX ? 1 : -1) * (sourceY < targetY ? 1 : -1);
  // Tighten curve by using a smaller offset factor (0.15) for a natural, taut string look
  const offset = dist * 0.15 * curveDirection;

  const cx = mx + nx * offset;
  const cy = my + ny * offset;

  const edgePath = `M ${sourceX} ${sourceY} Q ${cx} ${cy} ${targetX} ${targetY}`;
  const color    = (style?.stroke as string) || '#6366F1';
  const opacity  = (style?.opacity as number) ?? 0.5;
  const width    = (style?.strokeWidth as number) ?? 1.5;
  const isActive = (data?.isActive as boolean) ?? false;
  const dur      = (data?.particleDur as number) ?? 3;

  return (
    <g>
      {/* Base glow line */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={isActive ? width * 2 : width}
        strokeOpacity={isActive ? Math.min(1, opacity * 2) : opacity}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 ${isActive ? 8 : 4}px ${color}${isActive ? 'CC' : '77'}) drop-shadow(0 0 2px ${color}88)`, transition: 'all 0.3s ease' }}
      />
      {/* Bright center line over top */}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={isActive ? 1.5 : 0.5}
        strokeOpacity={isActive ? 0.9 : 0.2}
        strokeLinecap="round"
        style={isActive ? { animation: 'synapsePulse 1.5s ease-in-out infinite', filter: `drop-shadow(0 0 4px ${color})` } : { transition: 'all 0.3s ease' }}
      />
      {/* Comet Trail Particles (Shooting Star effect) */}
      {[0, 0.1, 0.2, 0.35].map((offset, i) => (
        <circle 
          key={i}
          r={isActive ? (3.5 * (1 - offset)) : (2 * (1 - offset))} 
          fill={i === 0 && isActive ? '#FFFFFF' : color} 
          opacity={isActive ? (0.9 * (1 - offset)) : (0.5 * (1 - offset))}
        >
          <animateMotion 
            dur={`${dur}s`} 
            repeatCount="indefinite" 
            path={edgePath} 
            begin={`-${offset * (dur * 0.2)}s`}
          />
        </circle>
      ))}
      
      {/* Secondary white particle for extra sparkle */}
      <circle r={isActive ? 2 : 1} fill="white" opacity={isActive ? 0.8 : 0.3}>
        <animateMotion dur={`${dur * 1.5}s`} begin={`-${dur * 0.6}s`} repeatCount="indefinite" path={edgePath} />
      </circle>
    </g>
  );
}

// ─── Custom Galaxy Node ─────────────────────────────────────────────────────────
function GalaxyNode({ data }: NodeProps) {
  const color       = data.color as string;
  const size        = data.size  as number;
  const label       = data.label as string;
  const isConnected = (data.isConnected as boolean) ?? true;
  const isHighlight = (data.isHighlight as boolean) ?? false;
  const delay       = (data.entranceDelay as number) ?? 0;
  const [hovered, setHovered] = useState(false);

  const wrapperSize = size + 48;
  const dimmed      = !isConnected;
  const glowing     = isHighlight || hovered;

  return (
    <>
      <Handle type="target" position={Position.Top}    style={{ opacity: 0, pointerEvents: 'none', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 0, height: 0, minWidth: 0, minHeight: 0, margin: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 0, height: 0, minWidth: 0, minHeight: 0, margin: 0 }} />

      <div
        style={{
          width:      wrapperSize,
          height:     wrapperSize,
          position:   'relative',
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow:   'visible',
          cursor:     'pointer',
          opacity:    0, // Will be animated to 1/0.15
          zIndex:     10, // Ensure nodes are rendered above edges
          animation:  `galaxyNodeIn 0.6s ${delay}s cubic-bezier(0.34,1.56,0.64,1) forwards`,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Entrance wrapper to handle dimming separate from entrance opacity */}
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: dimmed ? 0.2 : 1,
          transition: 'opacity 0.35s ease',
          position: 'relative',
        }}>
          {/* Outermost ripple ring */}
          <div style={{
            position: 'absolute',
            width: size + 40,
            height: size + 40,
            borderRadius: '50%',
            border: `1px solid ${color}${glowing ? '30' : '14'}`,
            animation: `ripple1 ${glowing ? 2 : 3.5}s ease-in-out infinite`,
            pointerEvents: 'none',
            transition: 'border-color 0.3s ease',
          }} />

          {/* Middle ripple ring */}
          <div style={{
            position: 'absolute',
            width: size + 22,
            height: size + 22,
            borderRadius: '50%',
            border: `1px solid ${color}${glowing ? '50' : '28'}`,
            animation: `ripple2 ${glowing ? 1.5 : 3.5}s 0.3s ease-in-out infinite`,
            pointerEvents: 'none',
            transition: 'border-color 0.3s ease',
          }} />

          {/* Inner ring */}
          <div style={{
            position: 'absolute',
            width: size + 8,
            height: size + 8,
            borderRadius: '50%',
            border: `1.5px solid ${color}${glowing ? '88' : '44'}`,
            boxShadow: `0 0 ${glowing ? 20 : 8}px ${color}${glowing ? '44' : '18'}`,
            pointerEvents: 'none',
            transition: 'all 0.3s ease',
          }} />

          {/* Core sphere */}
          <div
            className="galaxy-node-core-float"
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: '#0B0F19', // Solid base to occlude edges
              backgroundImage: `radial-gradient(circle at 35% 30%, ${color}FF 0%, ${color}CC 30%, ${color}66 60%, ${color}22 100%)`, // Use backgroundImage for gradient over solid color
              boxShadow: glowing
                ? `0 0 ${size * 0.7}px ${color}BB, 0 0 ${size * 1.5}px ${color}55, inset 0 0 ${size * 0.4}px ${color}55`
                : `0 0 ${size * 0.4}px ${color}66, 0 0 ${size * 0.8}px ${color}22, inset 0 0 ${size * 0.2}px ${color}22`,
              border: `1.5px solid ${color}${glowing ? 'BB' : '66'}`,
              transform: glowing ? 'scale(1.12)' : 'scale(1)',
              transition: 'box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55) 0%, transparent 55%)`,
              pointerEvents: 'none',
              zIndex: 2,
            }} />
            {/* Atmospheric Rim Light (Luxury Touch) */}
            <div style={{
              position: 'absolute',
              inset: '-1px',
              borderRadius: '50%',
              boxShadow: `inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(255,255,255,0.1)`,
              opacity: glowing ? 0.8 : 0.4,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none',
              zIndex: 3,
            }} />
          </div>

          {/* Label */}
          <div style={{
            position:      'absolute',
            top:           wrapperSize + 8,
            left:          '50%',
            transform:     'translateX(-50%)',
            whiteSpace:    'nowrap',
            fontFamily:    "'Outfit', sans-serif",
            fontSize:      Math.max(11, Math.min(13, size * 0.18)) + 'px',
            fontWeight:    glowing ? '500' : '400',
            color:         glowing ? '#FFFFFF' : 'rgba(244,244,255,0.7)',
            textShadow:    `0 0 ${glowing ? 18 : 12}px ${color}${glowing ? 'CC' : '77'}`,
            background:    'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            border:        '1px solid rgba(255,255,255,0.05)',
            padding:       '4px 10px',
            borderRadius:  '12px',
            maxWidth:      '180px',
            overflow:      'hidden',
            textOverflow:  'ellipsis',
            textAlign:     'center',
            pointerEvents: 'none',
            letterSpacing: '0.02em',
            transition:    'all 0.3s ease',
            zIndex:        100,
            userSelect:    'none',
          }}>
            {label}
          </div>
        </div>
      </div>
    </>
  );
}

const NODE_TYPES = { galaxy: GalaxyNode };
const EDGE_TYPES = { glow: GlowEdge };

// ─── Similarity Calculator ──────────────────────────────────────────────────────
function getSimilarity(a: Note, b: Note): number {
  // Language-agnostic tokenizer: keeps Arabic, Latin, digits, and all Unicode letters
  // This ensures Arabic notes connect just like English ones
  const stopWordsEn = new Set(['the','a','an','is','in','on','at','to','for','of','and','or','with','this','that','it','be','as','was','are','were','has','have','had','i','my','me','we','our','you','your','they','their','will','can','do','did','not','but','so','if','from','by','about','into','than','then','when','who','what','how','just','also','some','all']);
  // Common Arabic stopwords
  const stopWordsAr = new Set(['في','من','إلى','على','عن','مع','هذا','هذه','التي','الذي','هو','هي','كان','كانت','يكون','أن','إن','ثم','أو','لا','ما','لم','عند','كل','بعض','حتى','قد','لقد','إذا','منذ','خلال','نحو','يتم','وهو','التي','بين']);
  
  const words = (text: string) => {
    // Split on whitespace and punctuation while preserving Arabic characters (Unicode block \u0600-\u06FF)
    return text.toLowerCase()
      .split(/[\s\u060C\u061B\u061F\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E<>«»"'()\[\]{}|\\\/\-_=+*&^%$#@!~`]+/)
      .filter(w => w.length > 2 && !stopWordsEn.has(w) && !stopWordsAr.has(w));
  };
  
  const set1 = new Set(words(`${a.title} ${a.content || ''} ${(a.tags || []).join(' ')}`));
  const set2 = new Set(words(`${b.title} ${b.content || ''} ${(b.tags || []).join(' ')}`));
  const categoryBonus = a.category === b.category ? 2 : 0;
  const tags1 = new Set<string>(a.tags || []);
  const tags2 = new Set<string>(b.tags || []);
  const sharedTags = Array.from(tags1).filter(t => tags2.has(t)).length;
  const intersection = Array.from(set1).filter(w => set2.has(w)).length;
  return intersection + categoryBonus + sharedTags * 2;
}


// ─── Force-directed layout ──────────────────────────────────────────────────────
function getLayout(notes: Note[], savedPositions: Record<string, { x: number; y: number }> = {}): Record<string, { x: number; y: number }> {
  const n = notes.length;
  const W = 1800, H = 900, PADDING = 200;
  const pos: Record<string, { x: number; y: number }> = {};

  notes.forEach((note, i) => {
    if (savedPositions[note.id]) {
      pos[note.id] = { ...savedPositions[note.id] };
    } else {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      pos[note.id] = {
        x: W / 2 + Math.cos(angle) * (W / 2 - PADDING) * 0.85,
        y: H / 2 + Math.sin(angle) * (H / 2 - PADDING) * 0.85,
      };
    }
  });

  for (let iter = 0; iter < 150; iter++) {
    notes.forEach(a => {
      notes.forEach(b => {
        if (a.id === b.id) return;
        const dx = pos[a.id].x - pos[b.id].x;
        const dy = pos[a.id].y - pos[b.id].y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const minDist = 280;
        if (dist < minDist) {
          const force = ((minDist - dist) / dist) * 0.6;
          if (!savedPositions[a.id]) { pos[a.id].x += dx * force; pos[a.id].y += dy * force; }
          if (!savedPositions[b.id]) { pos[b.id].x -= dx * force; pos[b.id].y -= dy * force; }
        }
      });
      if (!savedPositions[a.id]) {
        pos[a.id].x = Math.max(PADDING, Math.min(W - PADDING, pos[a.id].x));
        pos[a.id].y = Math.max(PADDING, Math.min(H - PADDING, pos[a.id].y));
        pos[a.id].x += (W / 2 - pos[a.id].x) * 0.005;
        pos[a.id].y += (H / 2 - pos[a.id].y) * 0.005;
      }
    });
  }

  return pos;
}

// ─── Tooltip data type ──────────────────────────────────────────────────────────
interface TooltipData {
  fullTitle: string;
  category: string;
  summary: string;
  tags: string[];
  connections: number;
  color: string;
  size: number;
}

interface TooltipState {
  data: TooltipData;
  x: number;
  y: number;
}

// ─── Main Inner Component ────────────────────────────────────────────────────────
interface Props {
  notes: Note[];
  onSelectNote: (note: Note) => void;
}

function GalaxyInner({ notes, onSelectNote }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesState]  = useEdgesState<Edge>([]);
  const [tooltip, setTooltip]            = useState<TooltipState | null>(null);
  const [connections, setConnections]    = useState(0);
  const [hoveredId, setHoveredId]        = useState<string | null>(null);
  const [entered, setEntered]            = useState(false);
  
  // Custom positions states
  const [savedPositions, setSavedPositions] = useState<Record<string, {x: number, y: number}>>({});
  // Ref mirrors state so the build-graph effect always sees the latest positions (avoids stale closure)
  const savedPositionsRef = useRef<Record<string, {x: number, y: number}>>({});
  const [positionsLoaded, setPositionsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [layoutTrigger, setLayoutTrigger] = useState(0);

  const adjacencyRef = useRef<Map<string, Set<string>>>(new Map());
  const starsRef     = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut }  = useReactFlow();

  // ── Fetch Profile Positions via browser Supabase client (SELECT allowed by RLS) ──
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setPositionsLoaded(true); return; }
      supabase
        .from('profiles')
        .select('galaxy_positions')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data?.galaxy_positions && Object.keys(data.galaxy_positions).length > 0) {
            savedPositionsRef.current = data.galaxy_positions;
            setSavedPositions(data.galaxy_positions);
          }
          setPositionsLoaded(true);
        });
    });
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────
  const handleSaveLayout = async () => {
    setIsSaving(true);
    const newPositions: Record<string, {x: number, y: number}> = {};
    nodes.forEach(n => {
      const size = n.data.size as number;
      newPositions[n.id] = { x: n.position.x + (size + 48) / 2, y: n.position.y + (size + 48) / 2 };
    });

    const res = await fetch('/api/profile/galaxy-positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions: newPositions }),
    });

    setIsSaving(false);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      toast.error(`Failed to save: ${errBody?.error || res.status}`);
    } else {
      toast.success('Galaxy layout saved! ✦');
      savedPositionsRef.current = newPositions; // keep ref in sync
      setSavedPositions(newPositions);
    }
  };

  const handleResetLayout = async () => {
    setIsSaving(true);
    const res = await fetch('/api/profile/galaxy-positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions: null }),
    });

    setIsSaving(false);
    if (!res.ok) {
      toast.error('Failed to reset layout');
    } else {
      toast.success('Layout reset to default');
      savedPositionsRef.current = {}; // clear ref
      setSavedPositions({});
      setLayoutTrigger(prev => prev + 1);
    }
  };

  // ── Build star field ──────────────────────────────────────────────
  useEffect(() => {
    const el = starsRef.current;
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < 140; i++) {
      const s = document.createElement('div');
      const sz = Math.random() * 2.2 + 0.4;
      const dur = Math.random() * 6 + 3;
      const del = -(Math.random() * 8);
      s.style.cssText = `position:absolute;border-radius:50%;background:white;width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;animation:starTwinkle ${dur}s ${del}s ease-in-out infinite;opacity:${Math.random()*0.5+0.08};`;
      el.appendChild(s);
    }
    for (let i = 0; i < 4; i++) {
      const nb  = document.createElement('div');
      const hue = [267, 195, 160, 330][i];
      nb.style.cssText = `position:absolute;border-radius:50%;width:${Math.random()*350+200}px;height:${Math.random()*220+150}px;left:${Math.random()*80}%;top:${Math.random()*80}%;background:radial-gradient(ellipse,hsla(${hue},80%,50%,0.045) 0%,transparent 70%);pointer-events:none;animation:nebulaDrift ${20+i*5}s ${-i*4}s ease-in-out infinite alternate;filter:blur(3px);`;
      el.appendChild(nb);
    }
  }, []);

  // ── Build graph ────────────────────────────────────────────────────
  useEffect(() => {
    if (!notes?.length || !positionsLoaded) return;
    setEntered(false);

    const positions  = getLayout(notes, savedPositionsRef.current);
    const connCount: Record<string, number> = {};
    const edgePairs: Array<{ a: Note; b: Note; score: number }> = [];
    const adjacency  = new Map<string, Set<string>>();

    notes.forEach((a, i) => {
      notes.forEach((b, j) => {
        if (i >= j) return;
        const score = getSimilarity(a, b);
        if (score >= 2) {
          edgePairs.push({ a, b, score });
          connCount[a.id] = (connCount[a.id] || 0) + 1;
          connCount[b.id] = (connCount[b.id] || 0) + 1;
          if (!adjacency.has(a.id)) adjacency.set(a.id, new Set());
          if (!adjacency.has(b.id)) adjacency.set(b.id, new Set());
          adjacency.get(a.id)!.add(b.id);
          adjacency.get(b.id)!.add(a.id);
        }
      });
    });

    adjacencyRef.current = adjacency;
    setConnections(edgePairs.length);

    const maxConn = Math.max(1, ...notes.map(n => connCount[n.id] || 0));

    const newNodes: Node[] = notes.map((note, idx) => {
      const color     = CATEGORY_COLORS[note.category ?? ''] || CATEGORY_COLORS.default;
      const conn      = connCount[note.id] || 0;
      const sizeRatio = conn / maxConn;
      const size      = Math.round(48 + sizeRatio * 52);
      const pos       = positions[note.id] || { x: 400, y: 300 };

      return {
        id:       note.id,
        type:     'galaxy',
        position: { x: pos.x - (size + 48) / 2, y: pos.y - (size + 48) / 2 },
        style:    { background: 'transparent', border: 'none', overflow: 'visible' },
        zIndex:   10, // Tell React Flow to render this node above edges
        data: {
          label:        (note.title || 'Untitled').slice(0, 22),
          fullTitle:    note.title || 'Untitled',
          category:     note.category || 'default',
          summary:      note.summary || (note.content || '').replace(/<[^>]+>/g, '').slice(0, 120),
          tags:         note.tags || [],
          color,
          size,
          connections:  conn,
          isConnected:  true,
          isHighlight:  false,
          entranceDelay: idx * 0.08,
          note,
        },
      };
    });

    const sortedEdges = edgePairs.sort((a, b) => b.score - a.score).slice(0, 60);

    const newEdges: Edge[] = sortedEdges.map((ep, idx) => {
      const color   = CATEGORY_COLORS[ep.a.category ?? ''] || CATEGORY_COLORS.default;
      const opacity = Math.min(0.7, 0.25 + ep.score * 0.07);
      const width   = Math.min(2.2, 0.9 + ep.score * 0.18);
      return {
        id:     `e-${idx}`,
        source: ep.a.id,
        target: ep.b.id,
        type:   'glow',
        data:   { isActive: false, particleDur: 2.5 + Math.random() * 3, score: ep.score },
        style:  { stroke: color, strokeWidth: width, opacity },
      };
    });

    setNodes(newNodes);
    setEdges(newEdges);
    setTimeout(() => { setEntered(true); fitView({ padding: 0.4, duration: 1200, minZoom: 0.2, maxZoom: 1.5 }); }, 200);
  }, [notes, fitView, setNodes, setEdges, positionsLoaded, layoutTrigger]);

  // ── Hover: update connected node highlight state ───────────────────
  useEffect(() => {
    if (!entered) return;
    const adjacency = adjacencyRef.current;

    setNodes(nds => nds.map(n => {
      if (!hoveredId) {
        return { ...n, data: { ...n.data, isConnected: true, isHighlight: false } };
      }
      const connectedIds = adjacency.get(hoveredId) || new Set();
      return {
        ...n,
        data: {
          ...n.data,
          isConnected: n.id === hoveredId || connectedIds.has(n.id),
          isHighlight:  n.id === hoveredId,
        },
      };
    }));

    setEdges(eds => eds.map(e => {
      if (!hoveredId) return { ...e, data: { ...e.data, isActive: false } };
      const src = typeof e.source === 'string' ? e.source : (e.source as unknown as Node).id;
      const tgt = typeof e.target === 'string' ? e.target : (e.target as unknown as Node).id;
      return { ...e, data: { ...e.data, isActive: src === hoveredId || tgt === hoveredId } };
    }));
  }, [hoveredId, entered, setNodes, setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onSelectNote((node.data as { note: Note }).note);
  }, [onSelectNote]);

  const onNodeMouseEnter = useCallback((e: React.MouseEvent, node: Node) => {
    setHoveredId(node.id);
    const rect = (e.currentTarget as HTMLElement).closest('.galaxy-graph')?.getBoundingClientRect();
    const gx   = rect ? e.clientX - rect.left : e.clientX;
    const gy   = rect ? e.clientY - rect.top  : e.clientY;
    setTooltip({ data: node.data as unknown as TooltipData, x: gx, y: gy });
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredId(null);
    setTooltip(null);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!starsRef.current) return;
    const { clientX, clientY } = e;
    const x = (clientX / (typeof window !== 'undefined' ? window.innerWidth : 1200) - 0.5) * 30;
    const y = (clientY / (typeof window !== 'undefined' ? window.innerHeight : 800) - 0.5) * 30;
    // Move stars slightly in the opposite direction of the mouse
    starsRef.current.style.transform = `translate(${-x}px, ${-y}px)`;
  }, []);

  if (!notes?.length) {
    return (
      <div className="galaxy-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="galaxy-empty">
          <div className="galaxy-empty-icon">✦</div>
          <h3>Your Galaxy is Empty</h3>
          <p>Write at least 3 notes to see your knowledge come alive.</p>
        </div>
      </div>
    );
  }

  const tooltipColor = tooltip ? (CATEGORY_COLORS[tooltip.data.category] || CATEGORY_COLORS.default) : '';

  return (
    <div className="galaxy-container" onMouseMove={onMouseMove} style={{ position: 'relative' }}>
      <div 
        ref={starsRef} 
        className="galaxy-stars" 
        style={{ transition: 'transform 0.1s ease-out', position: 'absolute', inset: -50 }} 
      />

      <div className="galaxy-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div>
            <div className="galaxy-title">✦ Knowledge Galaxy</div>
            <div className="galaxy-subtitle">{notes.length} notes · {connections} connections</div>
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            pointerEvents: 'all',
          }}>
            <button
              onClick={handleSaveLayout}
              disabled={isSaving}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(14, 165, 233, 0.18)',
                border: '1px solid rgba(14, 165, 233, 0.4)',
                color: '#38BDF8',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.6 : 1,
                transition: 'all 0.2s ease',
                fontFamily: '"Outfit", sans-serif',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <Save size={13} /> Save Layout
            </button>

            <button
              onClick={() => zoomIn({ duration: 300 })}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'rgba(255, 255, 255, 0.65)',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: '"Outfit", sans-serif',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)'; }}
            >
              <Plus size={13} />
            </button>

            <button
              onClick={() => zoomOut({ duration: 300 })}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'rgba(255, 255, 255, 0.65)',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: '"Outfit", sans-serif',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)'; }}
            >
              <Minus size={13} />
            </button>

            <button
              onClick={handleResetLayout}
              disabled={isSaving}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'rgba(255, 255, 255, 0.65)',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.6 : 1,
                transition: 'all 0.2s ease',
                fontFamily: '"Outfit", sans-serif',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
              onMouseEnter={e => { if(!isSaving) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'; } }}
              onMouseLeave={e => { if(!isSaving) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)'; } }}
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>

        <div className="galaxy-legend">
          {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'default').map(([cat, color]) => (
            <div key={cat} className="galaxy-legend-item">
              <div className="galaxy-legend-dot" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
              <span>{cat}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="galaxy-graph">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesState}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          fitView
          minZoom={0.2}
          maxZoom={2.5}
          panOnScroll
          zoomOnScroll
          style={{ background: 'transparent' }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={50} size={0.8} color="rgba(255,255,255,0.03)" />
        </ReactFlow>
      </div>

      {tooltip && (
        <div
          className="galaxy-tooltip"
          style={{
            position: 'absolute',
            // Push tooltip significantly further right to clear the node + glowing rings
            // Offset is now 120px minimum plus extra scaling based on node size
            left:     Math.min(tooltip.x + 100 + (tooltip.data.size / 2), (typeof window !== 'undefined' ? window.innerWidth : 1200) - 390),
            top:      Math.max(tooltip.y - 140, 60),
            bottom:   'unset',
            transform: 'none',
            borderColor: `${tooltipColor}33`,
          }}
        >
          <div className="galaxy-tooltip-top">
            <div className="galaxy-tooltip-dot" style={{ background: tooltipColor, boxShadow: `0 0 8px ${tooltipColor}` }} />
            <span className="galaxy-tooltip-category" style={{ color: tooltipColor }}>
              {tooltip.data.category || 'Note'}
            </span>
          </div>
          <div className="galaxy-tooltip-title">{tooltip.data.fullTitle}</div>
          {tooltip.data.summary && (
            <div className="galaxy-tooltip-summary">
              {tooltip.data.summary.slice(0, 130)}{tooltip.data.summary.length > 130 ? '…' : ''}
            </div>
          )}
          {tooltip.data.tags?.length > 0 && (
            <div className="galaxy-tooltip-tags">
              {tooltip.data.tags.slice(0, 4).map((t: string) => (
                <span key={t} className="galaxy-tooltip-tag">{t}</span>
              ))}
            </div>
          )}
          <div className="galaxy-tooltip-connections">{tooltip.data.connections} connection{tooltip.data.connections !== 1 ? 's' : ''}</div>
          <div className="galaxy-tooltip-hint">Click to open →</div>
        </div>
      )}

      <style>{`
        @keyframes galaxyNodeIn {
          from { opacity: 0; transform: scale(0.3); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes coreFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes ripple1 {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.05); opacity: 0.6; }
        }
        @keyframes ripple2 {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.08); opacity: 0.7; }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes nebulaDrift {
          from { transform: translate(0,0) rotate(0deg); }
          to { transform: translate(40px, 20px) rotate(5deg); }
        }
        @keyframes synapsePulse {
          0%, 100% { opacity: 0.4; stroke-width: 0.5; filter: blur(0px); }
          50% { opacity: 1; stroke-width: 2.5; filter: blur(1px); }
        }
        .galaxy-node-core-float {
          animation: coreFloat 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default function KnowledgeGalaxy(props: Props) {
  return (
    <ReactFlowProvider>
      <GalaxyInner {...props} />
    </ReactFlowProvider>
  );
}
