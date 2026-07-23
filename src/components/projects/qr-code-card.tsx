"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/* ============================================
   QRCodeCard — Generate, download, print
   QR code for the portal URL.
   ============================================ */

type QRCodeCardProps = {
  url: string;
};

export function QRCodeCard({ url }: QRCodeCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current || !url) return;

    QRCode.toCanvas(
      canvasRef.current,
      url,
      {
        width: 256,
        margin: 2,
        color: {
          dark: "#0a0a0c",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      },
      (err) => {
        if (err) {
          console.error("QR generation error:", err);
        }
        setLoading(false);
      },
    );
  }, [url]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "portal-qr-code.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank", "width=400,height=500");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <title>QR Code — Photography Pixel Hub</title>
        <style>
          body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: sans-serif; gap: 16px; }
          img { width: 300px; height: 300px; }
          h1 { font-size: 18px; margin: 0; }
          p { font-size: 14px; color: #666; margin: 0; }
          .url { font-size: 12px; color: #999; word-break: break-all; max-width: 300px; text-align: center; }
        </style>
      </head>
      <body>
        <h1>Photography Pixel Hub</h1>
        <img src="${dataUrl}" alt="QR Code" />
        <p>امسح الرمز للوصول إلى بوابة المشروع</p>
        <p class="url">${url}</p>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative rounded-2xl border-2 border-border bg-white p-4">
        {loading && (
          <div className="flex h-[256px] w-[256px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        <canvas ref={canvasRef} className={loading ? "hidden" : "block"} />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
          <Download className="h-4 w-4" />
          تحميل PNG
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint} disabled={loading}>
          <Printer className="h-4 w-4" />
          طباعة
        </Button>
      </div>
    </div>
  );
}
