"use client";

import { motion, useAnimationControls } from "framer-motion";
import { Check, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { BubblyButton } from "@/components/ui/BubblyButton";
import { speakTryAgain, speakWritingPraise } from "@/lib/arabicSpeech";
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
type Verdict = "ok" | "miss" | null;

const PEN_WIDTH = 14;
const COVER_MIN = 0.6;
const STRAY_MAX = 0.4;

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
  const targetLayer = useRef<HTMLCanvasElement | null>(null);
  const roomLayer = useRef<HTMLCanvasElement | null>(null);
  const inkLayer = useRef<HTMLCanvasElement | null>(null);
  const strokes = useRef<Stroke[]>([]);
  const active = useRef<Point[] | null>(null);
  const colorRef = useRef<string>(penColors[0].value);
  const pointerId = useRef<number | null>(null);
  const board = useAnimationControls();
  const [pen, setPen] = useState<PenId>("rose");
  const [hasInk, setHasInk] = useState(false);
  const [awarded, setAwarded] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [verdict, setVerdict] = useState<Verdict>(null);

  function choosePen(next: PenId, value: string) {
    colorRef.current = value;
    setPen(next);
  }

  function paint() {
    paintBoard(canvasRef.current, guideLayer.current, strokes.current, active.current, colorRef.current);
    paintInk(inkLayer.current, canvasRef.current, strokes.current, active.current, colorRef.current);
  }

  function clearInk() {
    strokes.current = [];
    active.current = null;
    setHasInk(false);
    setAwarded(false);
    setNudge(false);
    setVerdict(null);
    paint();
  }

  function finish() {
    if (!hasInk) {
      setNudge(true);
      setVerdict(null);
      return;
    }
    if (awarded) return;
    paint();
    const result = scoreTrace(targetLayer.current, roomLayer.current, inkLayer.current);
    if (result.ok) {
      setAwarded(true);
      setVerdict("ok");
      setNudge(false);
      speakWritingPraise();
      onSuccess();
      return;
    }
    setVerdict("miss");
    setNudge(false);
    speakTryAgain();
    void board.start({
      x: [0, -14, 14, -10, 10, -4, 4, 0],
      transition: { duration: 0.45 },
    });
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
      targetLayer.current = layers.target;
      roomLayer.current = layers.room;
      inkLayer.current = blankLayer(width, height);
      paintBoard(canvas, layers.visual, strokes.current, active.current, colorRef.current);
      paintInk(inkLayer.current, canvas, strokes.current, active.current, colorRef.current);
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
      setHasInk(true);
      setNudge(false);
    }
    paint();
  }

  const ring = verdict === "miss" ? "ring-rose-500" : verdict === "ok" ? "ring-emerald-400" : "ring-violet-200";

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
      {nudge ? <p className="text-center text-base font-extrabold text-rose-600">{copy.traceEmpty}</p> : null}
      {verdict === "ok" ? <p className="text-center text-xl font-black text-emerald-600">{copy.traceSuccess}</p> : null}
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

function paintInk(
  layer: HTMLCanvasElement | null,
  canvas: HTMLCanvasElement | null,
  ink: Stroke[],
  live: Point[] | null,
  color: string,
) {
  const ctx = layer?.getContext("2d", { willReadFrequently: true });
  if (!layer || !ctx || !canvas) return;
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  const ratio = cssWidth > 0 ? layer.width / cssWidth : 1;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  ctx.globalCompositeOperation = "source-over";
  ink.forEach((stroke) => drawSmooth(ctx, stroke.points, stroke.color));
  if (live) drawSmooth(ctx, live, color);
}

function scoreTrace(target: HTMLCanvasElement | null, room: HTMLCanvasElement | null, ink: HTMLCanvasElement | null) {
  if (!target || !room || !ink) return { ok: false };
  if (target.width !== ink.width || target.height !== ink.height || room.width !== ink.width) return { ok: false };
  const targetCtx = target.getContext("2d", { willReadFrequently: true });
  const roomCtx = room.getContext("2d", { willReadFrequently: true });
  const inkCtx = ink.getContext("2d", { willReadFrequently: true });
  if (!targetCtx || !roomCtx || !inkCtx) return { ok: false };
  const targetPx = targetCtx.getImageData(0, 0, target.width, target.height).data;
  const roomPx = roomCtx.getImageData(0, 0, room.width, room.height).data;
  const inkPx = inkCtx.getImageData(0, 0, ink.width, ink.height).data;
  let path = 0;
  let covered = 0;
  let drawn = 0;
  let stray = 0;
  const step = 2;
  for (let y = 0; y < target.height; y += step) {
    for (let x = 0; x < target.width; x += step) {
      const alpha = (y * target.width + x) * 4 + 3;
      const onPath = targetPx[alpha] > 40;
      const inside = roomPx[alpha] > 40;
      const marked = inkPx[alpha] > 40;
      if (onPath) {
        path += 1;
        if (marked) covered += 1;
      }
      if (marked) {
        drawn += 1;
        if (!inside) stray += 1;
      }
    }
  }
  if (path < 30 || drawn < 12) return { ok: false };
  const coverage = covered / path;
  const strayRatio = stray / drawn;
  return { ok: coverage >= COVER_MIN && strayRatio <= STRAY_MAX };
}

function renderGuides(text: string, cssWidth: number, cssHeight: number, ratio: number) {
  const width = Math.floor(cssWidth * ratio);
  const height = Math.floor(cssHeight * ratio);
  const visual = blankLayer(width, height);
  const target = blankLayer(width, height);
  const room = blankLayer(width, height);
  const family = fontFamily();
  const probe = visual.getContext("2d");
  if (!probe || !text) return { visual, target, room };
  const size = fitSize(probe, text, cssWidth, cssHeight, family);
  strokeGlyph(visual, text, cssWidth, cssHeight, ratio, family, size, {
    width: 11,
    color: "rgba(196, 181, 253, 0.95)",
    dash: [],
  });
  strokeGlyph(visual, text, cssWidth, cssHeight, ratio, family, size, {
    width: 7,
    color: "rgba(109, 40, 217, 0.95)",
    dash: [1.2, 13],
  });
  strokeGlyph(target, text, cssWidth, cssHeight, ratio, family, size, { width: 20, color: "#000", dash: [] });
  strokeGlyph(room, text, cssWidth, cssHeight, ratio, family, size, { width: 54, color: "#000", dash: [] });
  return { visual, target, room };
}

function strokeGlyph(
  layer: HTMLCanvasElement,
  text: string,
  cssWidth: number,
  cssHeight: number,
  ratio: number,
  family: string,
  size: number,
  style: { width: number; color: string; dash: number[] },
) {
  const ctx = layer.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.font = `800 ${size}px ${family}`;
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = style.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = style.color;
  ctx.setLineDash(style.dash);
  ctx.strokeText(text, cssWidth / 2, cssHeight / 2);
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
