import type { HindiText } from "@/types";

/**
 * Renders a "before → after" transformation as a 1080×1080 PNG for sharing.
 *
 * The card deliberately uses a fixed warm-paper palette regardless of the
 * viewer's active theme, so a shared image always looks like Satya-Vachan
 * rather than inheriting a dark or neo-brutal surface.
 */

const SIZE = 1080;
const MARGIN = 96;
const CONTENT_WIDTH = SIZE - MARGIN * 2;

const PALETTE = {
  canvasTop: "#FBF5E9",
  canvasBottom: "#F4EEDC",
  card: "#FFFDF9",
  border: "#E7DFD1",
  text: "#1A1714",
  muted: "#6B6156",
  subtle: "#8F857A",
  accent: "#C2710C",
  success: "#4F7A52",
};

export type ShareCardContent = {
  original: string;
  polished: HindiText;
};

type WrappedLine = { text: string; width: number };

/** Reads the real Hindi font family so canvas text matches the app. */
function resolveHindiFontFamily(): string {
  if (typeof document === "undefined") {
    return "serif";
  }

  const probe = document.createElement("span");
  probe.className = "font-hindi";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.setAttribute("aria-hidden", "true");
  document.body.appendChild(probe);
  const family = getComputedStyle(probe).fontFamily || "serif";
  probe.remove();

  return family;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): WrappedLine[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: WrappedLine[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push({ text: current, width: ctx.measureText(current).width });
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push({ text: current, width: ctx.measureText(current).width });
  }

  return lines;
}

function drawParagraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  color: string,
  startY: number,
  lineHeight: number,
  maxWidth: number,
): number {
  ctx.font = font;
  ctx.fillStyle = color;
  const lines = wrapText(ctx, text, maxWidth);

  lines.forEach((line, index) => {
    ctx.fillText(line.text, SIZE / 2, startY + index * lineHeight);
  });

  return startY + lines.length * lineHeight;
}

async function renderCard(content: ShareCardContent): Promise<Blob> {
  const family = resolveHindiFontFamily();

  // The font may not be loaded at the weights we draw; ensure both before use
  // so the first render is not a fallback serif.
  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      await Promise.all([
        document.fonts.load(`700 68px ${family}`),
        document.fonts.load(`400 34px ${family}`),
      ]);
      await document.fonts.ready;
    } catch {
      // Font loading is best-effort; a fallback render is still acceptable.
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  // Background wash.
  const gradient = ctx.createLinearGradient(0, 0, 0, SIZE);
  gradient.addColorStop(0, PALETTE.canvasTop);
  gradient.addColorStop(1, PALETTE.canvasBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Inner card.
  const cardInset = 48;
  ctx.fillStyle = PALETTE.card;
  ctx.strokeStyle = PALETTE.border;
  ctx.lineWidth = 2;
  roundRect(ctx, cardInset, cardInset, SIZE - cardInset * 2, SIZE - cardInset * 2, 40);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Eyebrow.
  ctx.font = `600 26px ${family}`;
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText("मैंने कहा", SIZE / 2, 210);

  // Original (muted).
  const afterOriginal = drawParagraph(
    ctx,
    content.original,
    `400 40px ${family}`,
    PALETTE.muted,
    268,
    58,
    CONTENT_WIDTH,
  );

  // Divider.
  const dividerY = afterOriginal + 44;
  ctx.strokeStyle = PALETTE.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN + 120, dividerY);
  ctx.lineTo(SIZE - MARGIN - 120, dividerY);
  ctx.stroke();

  ctx.font = `600 26px ${family}`;
  ctx.fillStyle = PALETTE.success;
  ctx.fillText("अब इस तरह", SIZE / 2, dividerY + 62);

  // Polished sentence (hero).
  const afterPolished = drawParagraph(
    ctx,
    content.polished.dev,
    `700 66px ${family}`,
    PALETTE.text,
    dividerY + 148,
    88,
    CONTENT_WIDTH,
  );

  // Roman transliteration.
  if (content.polished.roman) {
    drawParagraph(
      ctx,
      content.polished.roman,
      `400 32px ${family}`,
      PALETTE.subtle,
      afterPolished + 20,
      44,
      CONTENT_WIDTH,
    );
  }

  // Footer brand line.
  ctx.font = `700 30px ${family}`;
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText("सत्य-वचन", SIZE / 2, SIZE - 128);
  ctx.font = `500 24px ${family}`;
  ctx.fillStyle = PALETTE.subtle;
  ctx.fillText("शुद्ध हिंदी बोलना सीखें", SIZE / 2, SIZE - 90);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not export the share card image."));
      }
    }, "image/png");
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/**
 * Builds the card and hands it to the native share sheet when available,
 * otherwise triggers a download. Returns how it was delivered.
 */
export async function shareTransformationCard(
  content: ShareCardContent,
): Promise<"shared" | "downloaded"> {
  const blob = await renderCard(content);
  const file = new File([blob], "satya-vachan.png", { type: "image/png" });

  const shareData: ShareData = {
    files: [file],
    title: "सत्य-वचन",
    text: content.polished.dev,
  };

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] }) &&
    typeof navigator.share === "function"
  ) {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (error) {
      // A user-cancelled share should not fall through to a download.
      if (error instanceof DOMException && error.name === "AbortError") {
        return "shared";
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "satya-vachan.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return "downloaded";
}
