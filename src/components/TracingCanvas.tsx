"use client";

import { motion, useAnimationControls } from "framer-motion";
import { Check, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { BubblyButton } from "@/components/ui/BubblyButton";
import { speakCompleteMarks, speakTryAgain, speakWritingPraise } from "@/lib/arabicSpeech";
import { copy } from "@/lib/copy";

const penColors = [
  { id: "rose", label: "Casaan", value: "#e11d48" },
  { id: "sky", label: "Buluug", value: "#0284c7" },
  { id: "emerald", label: "Cagaar", value: "#059669" },
  { id: "amber", label: "Jaalle", value: "#eab308" },
  { id: "violet", label: "Purple", value: "#7c3aed" },
] as const;

type PenId = (typeof penColors)[number]["id"];
type Point = { x: number; y: number };
type Stroke = { color: string; points: Point[] };
type Verdict = "ok" | "miss" | "marks" | null;

const PEN_WIDTH = 18;
const MIN_STROKE = 72;

export function TracingCanvas({
  guide,
  onListen,
  onSuccess,
}: {
  guide: string;
  onListen: () => void;
  onSuccess: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guideLayer = useRef<HTMLCanvasElement | null>(null);
  const zonesRef = useRef<TraceZones | null>(null);
  const strokes = useRef<Stroke[]>([]);
  const active = useRef<Point[] | null>(null);
  const colorRef = useRef<string>(penColors[0].value);
  const pointerId = useRef<number | null>(null);
  const board = useAnimationControls();
  const [pen, setPen] = useState<PenId>("rose");
  const [awarded, setAwarded] = useState(false);
  const [verdict, setVerdict] = useState<Verdict>(null);

  function choosePen(next: PenId, value: string) {
    colorRef.current = value;
    setPen(next);
  }

  function paint() {
    paintBoard(canvasRef.current, guideLayer.current, strokes.current, active.current, colorRef.current);
  }

  function clearInk() {
    strokes.current = [];
    active.current = null;
    setAwarded(false);
    setVerdict(null);
    paint();
  }

  function shake() {
    void board.start({
      x: [0, -14, 14, -10, 10, -4, 4, 0],
      transition: { duration: 0.45 },
    });
  }

  function finish() {
    if (awarded) return;
    const result = judgeTrace(strokes.current, zonesRef.current, canvasRef.current);
    if (result === "ok") {
      setAwarded(true);
      setVerdict("ok");
      speakWritingPraise();
      onSuccess();
      return;
    }
    setVerdict(result);
    if (result === "marks") speakCompleteMarks();
    else speakTryAgain();
    shake();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const draw = () => {
      const cssWidth = parent.clientWidth;
      const cssHeight = parent.clientHeight;
      if (cssWidth < 2 || cssHeight < 2) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.floor(cssWidth * ratio);
      const height = Math.floor(cssHeight * ratio);
      canvas.width = width;
      canvas.height = height;
      const layers = renderGuides(guide, cssWidth, cssHeight, ratio);
      guideLayer.current = layers.visual;
      zonesRef.current = layers.zones;
      paintBoard(canvas, layers.visual, strokes.current, active.current, colorRef.current);
    };

    const observer = new ResizeObserver(draw);
    observer.observe(parent);
    void document.fonts.ready.then(draw);
    return () => observer.disconnect();
  }, [guide]);

  function pointFromEvent(event: ReactPointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (pointerId.current !== null || awarded) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerId.current = event.pointerId;
    active.current = [pointFromEvent(event)];
    setVerdict(null);
    paint();
  }

  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (pointerId.current !== event.pointerId || !active.current) return;
    active.current.push(pointFromEvent(event));
    paint();
  }

  function onPointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (pointerId.current !== event.pointerId) return;
    pointerId.current = null;
    const points = active.current;
    active.current = null;
    if (points && points.length > 0) {
      strokes.current.push({ color: colorRef.current, points });
    }
    paint();
  }

  const ring = verdict === "miss" || verdict === "marks" ? "ring-rose-500" : verdict === "ok" ? "ring-emerald-400" : "ring-violet-200";

  return (
    <div className="flex flex-col gap-3">
      <motion.div
        animate={board}
        className={`relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] bg-[#fffdf8] shadow-[0_10px_0_0_#ddd6fe] ring-4 sm:aspect-[16/10] ${ring}`}
      >
        <canvas
          ref={canvasRef}
          aria-label={copy.traceTitle}
          className="h-full w-full touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </motion.div>

      <div className="flex flex-wrap items-center justify-center gap-3" role="group" aria-label="Midabka qalinka">
        {penColors.map((swatch) => (
          <button
            key={swatch.id}
            type="button"
            aria-label={swatch.label}
            aria-pressed={pen === swatch.id}
            onClick={() => choosePen(swatch.id, swatch.value)}
            className={`pressable size-14 rounded-full border-4 border-white shadow-[0_5px_0_0_rgba(30,27,75,0.25)] sm:size-16 ${
              pen === swatch.id ? "ring-4 ring-indigo-950 ring-offset-2" : ""
            }`}
            style={{ backgroundColor: swatch.value }}
          />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <BubblyButton tone="rose" onClick={clearInk} className="w-full">
          <RotateCcw className="size-5" aria-hidden="true" />
          {copy.traceClear}
        </BubblyButton>
        <BubblyButton tone="amber" onClick={onListen} className="w-full">
          <Volume2 className="size-5" aria-hidden="true" />
          {copy.listen}
        </BubblyButton>
        <BubblyButton tone="emerald" onClick={finish} className="w-full" disabled={awarded}>
          <Check className="size-5" aria-hidden="true" />
          {copy.traceDone}
        </BubblyButton>
      </div>
      {verdict === "ok" ? <p className="text-center text-xl font-black text-emerald-600">{copy.traceSuccess}</p> : null}
      {verdict === "marks" ? <p className="text-center text-lg font-black leading-snug text-rose-600">{copy.traceMarks}</p> : null}
      {verdict === "miss" ? <p className="text-center text-lg font-black leading-snug text-rose-600">{copy.traceMiss}</p> : null}
    </div>
  );
}

function paintBoard(
  canvas: HTMLCanvasElement | null,
  layer: HTMLCanvasElement | null,
  ink: Stroke[],
  live: Point[] | null,
  color: string,
) {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx || !layer) return;
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const ratio = cssWidth > 0 ? canvas.width / cssWidth : 1;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.drawImage(layer, 0, 0, cssWidth, cssHeight);
  ink.forEach((stroke) => drawSmooth(ctx, stroke.points, stroke.color));
  if (live) drawSmooth(ctx, live, color);
}

type TraceZones = {
  width: number;
  height: number;
  step: number;
  cols: number;
  body: Uint8Array;
  marks: Int32Array;
  markCount: number;
};

const MARK_COVER = 0.22;
const BODY_COVER = 0.16;
const MIN_BLOB = 12;

function judgeTrace(ink: Stroke[], zones: TraceZones | null, canvas: HTMLCanvasElement | null): "ok" | "miss" | "marks" {
  if (!zones || !canvas) return "miss";
  if (canvas.width !== zones.width || canvas.height !== zones.height) return "miss";
  if (strokeLength(ink) < MIN_STROKE) return "miss";

  const drawn = rasterInk(ink, canvas.clientWidth, canvas.clientHeight, zones.width, zones.height);
  let bodyTotal = 0;
  let bodyHit = 0;
  const markTotal = new Array<number>(zones.markCount).fill(0);
  const markHit = new Array<number>(zones.markCount).fill(0);

  for (let index = 0; index < zones.body.length; index += 1) {
    const x = index % zones.cols;
    const y = (index - x) / zones.cols;
    const sx = Math.min(zones.width - 1, x * zones.step);
    const sy = Math.min(zones.height - 1, y * zones.step);
    const inked = drawn[(sy * zones.width + sx) * 4 + 3] > 24;
    if (zones.body[index]) {
      bodyTotal += 1;
      if (inked) bodyHit += 1;
    }
    const mark = zones.marks[index];
    if (mark > 0) {
      markTotal[mark - 1] += 1;
      if (inked) markHit[mark - 1] += 1;
    }
  }

  if (bodyTotal === 0 && zones.markCount === 0) return "miss";
  const bodyRatio = bodyTotal > 0 ? bodyHit / bodyTotal : 1;
  const missingMark = markTotal.some((total, mark) => total > 0 && markHit[mark] / total < MARK_COVER);
  const missingBody = bodyTotal > 0 && bodyRatio < BODY_COVER;
  if (!missingMark && !missingBody) return "ok";

  const templateTotal = bodyTotal + markTotal.reduce((sum, total) => sum + total, 0);
  const templateHit = bodyHit + markHit.reduce((sum, hit) => sum + hit, 0);
  if (templateTotal === 0 || templateHit / templateTotal < 0.08) return "miss";
  return "marks";
}

function strokeLength(ink: Stroke[]) {
  let drawn = 0;
  ink.forEach((stroke) => {
    const points = stroke.points;
    if (points.length === 1) {
      drawn += PEN_WIDTH;
      return;
    }
    for (let index = 1; index < points.length; index += 1) {
      drawn += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
    }
  });
  return drawn;
}

function rasterInk(ink: Stroke[], cssWidth: number, cssHeight: number, width: number, height: number) {
  const layer = blankLayer(width, height);
  const ctx = layer.getContext("2d");
  if (!ctx || cssWidth < 1 || cssHeight < 1) return new Uint8ClampedArray(width * height * 4);
  const ratio = width / cssWidth;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ink.forEach((stroke) => drawSmooth(ctx, stroke.points, "#000"));
  return ctx.getImageData(0, 0, width, height).data;
}

function renderGuides(text: string, cssWidth: number, cssHeight: number, ratio: number) {
  const width = Math.floor(cssWidth * ratio);
  const height = Math.floor(cssHeight * ratio);
  const visual = blankLayer(width, height);
  const family = fontFamily();
  const probe = visual.getContext("2d");
  if (!probe || !text) return { visual, zones: null as TraceZones | null };
  const size = fitSize(probe, text, cssWidth, cssHeight, family);
  fillGlyph(visual, text, cssWidth, cssHeight, ratio, family, size, "#E2E8F0");
  const zones = buildZones(text, cssWidth, cssHeight, ratio, family, size, width, height);
  return { visual, zones };
}

function buildZones(
  text: string,
  cssWidth: number,
  cssHeight: number,
  ratio: number,
  family: string,
  size: number,
  width: number,
  height: number,
): TraceZones {
  const step = 2;
  const cols = Math.ceil(width / step);
  const rows = Math.ceil(height / step);
  const full = alphaMask(text, cssWidth, cssHeight, ratio, family, size, width, height, step, cols, rows);
  const base = alphaMask(baseLetters(text), cssWidth, cssHeight, ratio, family, size, width, height, step, cols, rows);
  const nearBase = dilate(base, cols, rows);
  const body = new Uint8Array(cols * rows);
  const markSeed = new Uint8Array(cols * rows);

  const baseParts = components(base, cols, rows);
  let biggest: Blob | null = null;
  for (const blob of baseParts.blobs) {
    if (!biggest || blob.area > biggest.area) biggest = blob;
  }
  const tall = biggest ? biggest.maxY - biggest.minY + 1 : 0;
  const dotIds = new Set<number>();
  if (biggest) {
    for (const blob of baseParts.blobs) {
      const boxH = blob.maxY - blob.minY + 1;
      const boxW = blob.maxX - blob.minX + 1;
      if (blob.area >= MIN_BLOB && blob.area < biggest.area * 0.22 && boxH < tall * 0.45 && boxW < tall * 0.6) {
        dotIds.add(blob.id);
      }
    }
  }

  for (let index = 0; index < base.length; index += 1) {
    const id = baseParts.labels[index];
    if (!id) continue;
    if (dotIds.has(id)) markSeed[index] = 1;
    else if (baseParts.blobs[id - 1].area >= MIN_BLOB) body[index] = 1;
  }

  const band = bodyBand(body, cols, rows);
  if (band) {
    for (let index = 0; index < body.length; index += 1) {
      if (!body[index]) continue;
      const y = Math.floor(index / cols);
      if (y < band.top || y > band.bottom) {
        body[index] = 0;
        markSeed[index] = 1;
      }
    }
  }

  for (let index = 0; index < full.length; index += 1) {
    if (full[index] && !nearBase[index]) markSeed[index] = 1;
  }

  const markParts = components(markSeed, cols, rows);
  const marks = new Int32Array(cols * rows);
  let markCount = 0;
  const kept = new Map<number, number>();
  markParts.blobs.forEach((blob) => {
    if (blob.area < MIN_BLOB) return;
    markCount += 1;
    kept.set(blob.id, markCount);
  });
  for (let index = 0; index < marks.length; index += 1) {
    const next = kept.get(markParts.labels[index]);
    if (next) marks[index] = next;
  }

  return { width, height, step, cols, body, marks, markCount };
}

function baseLetters(text: string) {
  return text.replace(/[\u0640\u064B-\u0652\u0670]/g, "");
}

function alphaMask(
  text: string,
  cssWidth: number,
  cssHeight: number,
  ratio: number,
  family: string,
  size: number,
  width: number,
  height: number,
  step: number,
  cols: number,
  rows: number,
) {
  const mask = new Uint8Array(cols * rows);
  if (!text) return mask;
  const layer = blankLayer(width, height);
  fillGlyph(layer, text, cssWidth, cssHeight, ratio, family, size, "#000");
  const ctx = layer.getContext("2d", { willReadFrequently: true });
  if (!ctx) return mask;
  const pixels = ctx.getImageData(0, 0, width, height).data;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const sx = Math.min(width - 1, x * step);
      const sy = Math.min(height - 1, y * step);
      if (pixels[(sy * width + sx) * 4 + 3] > 40) mask[y * cols + x] = 1;
    }
  }
  return mask;
}

function bodyBand(body: Uint8Array, cols: number, rows: number) {
  const counts = new Int32Array(rows);
  for (let index = 0; index < body.length; index += 1) {
    if (body[index]) counts[Math.floor(index / cols)] += 1;
  }
  let peak = 0;
  counts.forEach((count) => {
    if (count > peak) peak = count;
  });
  if (peak < 2) return null;
  const threshold = Math.max(2, peak * 0.18);
  let top = -1;
  let bottom = -1;
  for (let y = 0; y < rows; y += 1) {
    if (counts[y] < threshold) continue;
    if (top < 0) top = y;
    bottom = y;
  }
  if (top < 0 || bottom < 0) return null;
  return { top, bottom };
}

type Blob = { id: number; area: number; minX: number; minY: number; maxX: number; maxY: number };

function components(mask: Uint8Array, cols: number, rows: number) {
  const labels = new Int32Array(cols * rows);
  const blobs: Blob[] = [];
  const stack: number[] = [];
  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || labels[start]) continue;
    const id = blobs.length + 1;
    const blob: Blob = { id, area: 0, minX: cols, minY: rows, maxX: 0, maxY: 0 };
    const push = (next: number) => {
      if (!mask[next] || labels[next]) return;
      labels[next] = id;
      stack.push(next);
    };
    stack.push(start);
    labels[start] = id;
    while (stack.length > 0) {
      const point = stack.pop() ?? 0;
      const x = point % cols;
      const y = (point - x) / cols;
      blob.area += 1;
      if (x < blob.minX) blob.minX = x;
      if (y < blob.minY) blob.minY = y;
      if (x > blob.maxX) blob.maxX = x;
      if (y > blob.maxY) blob.maxY = y;
      if (x > 0) push(point - 1);
      if (x + 1 < cols) push(point + 1);
      if (y > 0) push(point - cols);
      if (y + 1 < rows) push(point + cols);
    }
    blobs.push(blob);
  }
  return { labels, blobs };
}

function dilate(mask: Uint8Array, cols: number, rows: number) {
  const grown = new Uint8Array(mask.length);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (!mask[y * cols + x]) continue;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          grown[ny * cols + nx] = 1;
        }
      }
    }
  }
  return grown;
}

function prepareGlyph(
  layer: HTMLCanvasElement,
  text: string,
  cssWidth: number,
  cssHeight: number,
  ratio: number,
  family: string,
  size: number,
) {
  const ctx = layer.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.font = `800 ${size}px ${family}`;
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  return ctx;
}

function fillGlyph(
  layer: HTMLCanvasElement,
  text: string,
  cssWidth: number,
  cssHeight: number,
  ratio: number,
  family: string,
  size: number,
  color: string,
) {
  const ctx = prepareGlyph(layer, text, cssWidth, cssHeight, ratio, family, size);
  if (!ctx) return;
  ctx.fillStyle = color;
  ctx.fillText(text, cssWidth / 2, cssHeight / 2);
}

function blankLayer(width: number, height: number) {
  const layer = document.createElement("canvas");
  layer.width = width;
  layer.height = height;
  return layer;
}

function fontFamily() {
  const family = getComputedStyle(document.body).fontFamily;
  return family || "Cairo, sans-serif";
}

function fitSize(ctx: CanvasRenderingContext2D, text: string, cssWidth: number, cssHeight: number, family: string) {
  let size = Math.floor(cssHeight * (text.length > 2 ? 0.5 : 0.62));
  ctx.font = `800 ${size}px ${family}`;
  const measured = ctx.measureText(text).width;
  const limit = cssWidth * 0.86;
  if (measured > limit && measured > 0) size = Math.floor(size * (limit / measured));
  return Math.max(56, size);
}

function drawSmooth(ctx: CanvasRenderingContext2D, points: Point[], color: string) {
  if (points.length === 0) return;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = PEN_WIDTH;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([]);
  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, PEN_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length - 1; index += 1) {
    const midX = (points[index].x + points[index + 1].x) / 2;
    const midY = (points[index].y + points[index + 1].y) / 2;
    ctx.quadraticCurveTo(points[index].x, points[index].y, midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}
