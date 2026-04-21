"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onSign: (dataUrl: string) => void;
  onClear: () => void;
};

export function SignaturePad({ onSign, onClear }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing   = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // キャンバスサイズをDPRに合わせて調整
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#1E5CB3"; // brand-500
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";

    // プレースホルダーテキスト
    ctx.fillStyle = "#d1d5db";
    ctx.font      = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ここに署名してください", rect.width / 2, rect.height / 2);
  }, []);

  function getPos(e: MouseEvent | Touch, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#d1d5db";
    ctx.font      = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ここに署名してください", rect.width / 2, rect.height / 2);
    setIsEmpty(true);
    onClear();
    void dpr; // suppress warning
  }

  // マウス操作
  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (isEmpty) {
      // プレースホルダーを消去
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      setIsEmpty(false);
    }
    drawing.current = true;
    const pos = getPos(e.nativeEvent, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e.nativeEvent, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function onMouseUp() {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) onSign(canvas.toDataURL());
  }

  // タッチ操作
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onTouchStart(e: TouchEvent) {
      e.preventDefault();
      const ctx = canvas!.getContext("2d");
      if (!ctx) return;
      if (isEmpty) {
        const rect = canvas!.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        setIsEmpty(false);
      }
      drawing.current = true;
      const pos = getPos(e.touches[0], canvas!);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      if (!drawing.current) return;
      const ctx = canvas!.getContext("2d");
      if (!ctx) return;
      const pos = getPos(e.touches[0], canvas!);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    function onTouchEnd(e: TouchEvent) {
      void e;
      if (!drawing.current) return;
      drawing.current = false;
      if (canvas) onSign(canvas.toDataURL());
    }

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove",  onTouchMove,  { passive: false });
    canvas.addEventListener("touchend",   onTouchEnd,   { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove",  onTouchMove);
      canvas.removeEventListener("touchend",   onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty]);

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl bg-white cursor-crosshair touch-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
      {!isEmpty && (
        <button
          type="button"
          onClick={clearCanvas}
          className="text-xs text-red-500 hover:text-red-700 underline"
        >
          署名をクリア
        </button>
      )}
    </div>
  );
}
