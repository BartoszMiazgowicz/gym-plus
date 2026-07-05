import { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
    imageSrc: string;
    onConfirm: (croppedDataUrl: string) => void;
    onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onConfirm, onCancel }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [imgLoaded, setImgLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement | null>(null);

    // Transform state: offset and scale
    const [scale, setScale] = useState(1);
    const [baseScale, setBaseScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const dragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const lastPinchDist = useRef<number | null>(null);

    const CANVAS_SIZE = 280;
    const OUTPUT_SIZE = 300;

    // Load image
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            imgRef.current = img;
            // Fit image so the shorter side fills the canvas
            const fitScale = CANVAS_SIZE / Math.min(img.width, img.height);
            setScale(fitScale);
            setBaseScale(fitScale);
            setOffset({
                x: (CANVAS_SIZE - img.width * fitScale) / 2,
                y: (CANVAS_SIZE - img.height * fitScale) / 2,
            });
            setImgLoaded(true);
        };
        img.src = imageSrc;
    }, [imageSrc]);

    // Draw
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.save();
        ctx.beginPath();
        ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale);
        ctx.restore();
    }, [offset, scale]);

    useEffect(() => {
        if (imgLoaded) draw();
    }, [imgLoaded, draw]);

    // Mouse/touch handlers
    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };

    const getPinchDist = (e: React.TouchEvent) => {
        if (e.touches.length < 2) return null;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        dragging.current = true;
        const pos = getPos(e);
        lastPos.current = pos;
        if ('touches' in e) {
            lastPinchDist.current = getPinchDist(e);
        }
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!dragging.current) return;
        e.preventDefault();

        // Pinch zoom
        if ('touches' in e && e.touches.length >= 2) {
            const dist = getPinchDist(e);
            if (dist && lastPinchDist.current) {
                const delta = dist / lastPinchDist.current;
                setScale(prev => {
                    const img = imgRef.current;
                    if (!img) return prev;
                    const minScale = CANVAS_SIZE / Math.max(img.width, img.height);
                    return Math.max(minScale * 0.5, Math.min(prev * delta, 5));
                });
            }
            lastPinchDist.current = dist;
            return;
        }

        const pos = getPos(e);
        const dx = pos.x - lastPos.current.x;
        const dy = pos.y - lastPos.current.y;
        lastPos.current = pos;

        setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    };

    const handleEnd = () => {
        dragging.current = false;
        lastPinchDist.current = null;
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.95 : 1.05;
        setScale(prev => {
            const img = imgRef.current;
            if (!img) return prev;
            const minScale = CANVAS_SIZE / Math.max(img.width, img.height) * 0.5;
            return Math.max(minScale, Math.min(prev * delta, 5));
        });
    };

    const handleConfirm = () => {
        const img = imgRef.current;
        if (!img) return;

        const outCanvas = document.createElement('canvas');
        outCanvas.width = OUTPUT_SIZE;
        outCanvas.height = OUTPUT_SIZE;
        const ctx = outCanvas.getContext('2d');
        if (!ctx) return;

        // Scale offset/scale from canvas coordinates to output coordinates
        const ratio = OUTPUT_SIZE / CANVAS_SIZE;
        ctx.drawImage(
            img,
            offset.x * ratio,
            offset.y * ratio,
            img.width * scale * ratio,
            img.height * scale * ratio,
        );

        onConfirm(outCanvas.toDataURL('image/jpeg', 0.85));
    };

    return (
        <>
            <div className="bottom-sheet-overlay" onClick={onCancel} />
            <div className="bottom-sheet" style={{ maxHeight: '90vh' }}>
                <div className="bottom-sheet-handle" />
                <div className="bottom-sheet-content" style={{ textAlign: 'center' }}>
                    <div style={{ font: 'var(--heading-3)', marginBottom: 'var(--space-sm)' }}>
                        Przytnij zdjęcie
                    </div>
                    <div style={{ font: 'var(--caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                        Przeciągnij i przybliż aby ustawić kadr
                    </div>

                    <div
                        ref={containerRef}
                        style={{
                            width: CANVAS_SIZE,
                            height: CANVAS_SIZE,
                            margin: '0 auto',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '2px solid rgba(255,255,255,0.15)',
                            cursor: 'grab',
                            touchAction: 'none',
                            position: 'relative',
                            background: 'rgba(255,255,255,0.03)',
                        }}
                        onMouseDown={handleStart}
                        onMouseMove={handleMove}
                        onMouseUp={handleEnd}
                        onMouseLeave={handleEnd}
                        onTouchStart={handleStart}
                        onTouchMove={handleMove}
                        onTouchEnd={handleEnd}
                        onWheel={handleWheel}
                    >
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_SIZE}
                            height={CANVAS_SIZE}
                            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
                        />
                    </div>

                    {/* Zoom slider */}
                    <div style={{ margin: 'var(--space-lg) auto', maxWidth: 200 }}>
                        <input
                            type="range"
                            min="0.2"
                            max="3"
                            step="0.01"
                            value={scale / baseScale}
                            onChange={(e) => {
                                setScale(baseScale * parseFloat(e.target.value));
                            }}
                            style={{ width: '100%', accentColor: 'var(--accent)' }}
                        />
                        <div className="flex justify-between text-muted" style={{ fontSize: 10, marginTop: 4 }}>
                            <span>−</span>
                            <span>Zoom</span>
                            <span>+</span>
                        </div>
                    </div>

                    <div className="flex gap-sm" style={{ marginTop: 'var(--space-md)' }}>
                        <button className="btn btn-secondary btn-full" onClick={onCancel}>
                            Anuluj
                        </button>
                        <button className="btn btn-primary btn-full" onClick={handleConfirm}>
                            Zatwierdź
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
