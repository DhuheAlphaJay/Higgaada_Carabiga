"use client";

import { Check, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { BubblyButton } from "@/components/ui/BubblyButton";
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

const PEN_WIDTH = 14;

export function TracingCanvas({
  guide,
  onListen,
  onDone,
}: {
  guide: string;
  onListen: () => void;
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guideLayer = useRef<HTMLCanvasElement | null>(null);
  const strokes = useRef<Stroke[]>([]);
  const active = useRef<Point[] | null>(null);
  const colorRef = useRef<string>(penColors[0].value);
  const pointerId = useRef<number | null>(null);
  const [pen, setPen] = useState<PenId>("rose");
  const [hasInk, setHasInk] = useState(false);
  const [awarded, setAwarded] = useState(false);
  const [nudge, setNudge] = useState(false);

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
    setHasInk(false);
    setAwarded(false);
    setNudge(false);
    paint();
  }

  function finish() {
    if (!hasInk) {
      setNudge(true);
      return;
    }
    if (awarded) return;
    setAwarded(true);
    setNudge(false);
    onDone();
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
      canvas.width = Math.floor(cssWidth * ratio);
      canvas.height = Math.floor(cssHeight * ratio);
      guideLayer.current = renderGuide(guide, cssWidth, cssHeight, ratio);
      paintBoard(canvas, guideLayer.current, strokes.current, active.current, colorRef.current);
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
    if (pointerId.current !== null) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerId.current = event.pointerId;
    active.current = [pointFromEvent(event)];
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

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] bg-[#fffdf8] shadow-[0_10px_0_0_#ddd6fe] ring-4 ring-violet-200 sm:aspect-[16/10]">
        <canvas
          ref={canvasRef}
          aria-label={copy.traceTitle}
          className="h-full w-full touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>

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
        <BubblyButton tone="emerald" onClick={finish} className="w-full">
          <Check className="size-5" aria-hidden="true" />
          {copy.traceDone}
        </BubblyButton>
      </div>
      {nudge ? <p className="text-center text-base font-extrabold text-rose-600">{copy.traceEmpty}</p> : null}
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

function renderGuide(text: string, cssWidth: number, cssHeight: number, ratio: number) {
  const layer = document.createElement("canvas");
  layer.width = Math.floor(cssWidth * ratio);
  layer.height = Math.floor(cssHeight * ratio);
  const ctx = layer.getContext("2d");
  if (!ctx || !text) return layer;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const family = fontFamily();
  const size = fitSize(ctx, text, cssWidth, cssHeight, family);
  ctx.font = `900 ${size}px ${family}`;
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(109, 40, 217, 0.92)";
  ctx.fillText(text, cssWidth / 2, cssHeight / 2);
  const mask = document.createElement("canvas");
  mask.width = layer.width;
  mask.height = layer.height;
  const maskCtx = mask.getContext("2d");
  if (!maskCtx) return layer;
  maskCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  maskCtx.fillStyle = "#000";
  const gap = 12;
  for (let y = gap / 2; y < cssHeight; y += gap) {
    for (let x = gap / 2; x < cssWidth; x += gap) {
      maskCtx.beginPath();
      maskCtx.arc(x, y, 2.8, 0, Math.PI * 2);
      maskCtx.fill();
    }
  }
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0, cssWidth, cssHeight);
  return layer;
}

function fontFamily() {
  const family = getComputedStyle(document.body).fontFamily;
  return family || "Cairo, sans-serif";
}

function fitSize(ctx: CanvasRenderingContext2D, text: string, cssWidth: number, cssHeight: number, family: string) {
  let size = Math.floor(cssHeight * (text.length > 2 ? 0.5 : 0.62));
  ctx.font = `900 ${size}px ${family}`;
  const measured = ctx.measureText(text).width;
  const limit = cssWidth * 0.88;
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
