import type { NodeSDK } from "@opentelemetry/sdk-node";

const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const cardNumberPattern = /\b(?:\d[ -]*?){13,16}\b/g;
const phoneNumberPattern = /\b(?:\+?\d{1,3}[ -]?)?(?:\d{3}[ -]?){2}\d{4}\b/g;

type LangfuseGlobal = typeof globalThis & {
  satyaVachanLangfuseSdk?: NodeSDK;
};

export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    !process.env.LANGFUSE_PUBLIC_KEY?.trim() ||
    !process.env.LANGFUSE_SECRET_KEY?.trim()
  ) {
    return;
  }

  const langfuseGlobal = globalThis as LangfuseGlobal;

  if (langfuseGlobal.satyaVachanLangfuseSdk) {
    return;
  }

  const [{ NodeSDK }, { LangfuseSpanProcessor }] = await Promise.all([
    import("@opentelemetry/sdk-node"),
    import("@langfuse/otel"),
  ]);

  const sdk = new NodeSDK({
    serviceName: "satya-vachan",
    spanProcessors: [
      new LangfuseSpanProcessor({
        publicKey: process.env.LANGFUSE_PUBLIC_KEY.trim(),
        secretKey: process.env.LANGFUSE_SECRET_KEY.trim(),
        baseUrl:
          process.env.LANGFUSE_BASE_URL?.trim() ||
          "https://cloud.langfuse.com",
        environment:
          process.env.LANGFUSE_TRACING_ENVIRONMENT?.trim() ||
          process.env.NODE_ENV ||
          "development",
        release:
          process.env.LANGFUSE_TRACING_RELEASE?.trim() ||
          process.env.LANGFUSE_RELEASE?.trim() ||
          undefined,
        // Serverless runtimes can freeze immediately after a request finishes.
        exportMode: "immediate",
        // Prompts and outputs remain useful for review while common PII never
        // leaves the application in a trace payload.
        mask: ({ data }) =>
          typeof data === "string"
            ? data
                .replace(emailPattern, "[EMAIL_REDACTED]")
                .replace(cardNumberPattern, "[CARD_REDACTED]")
                .replace(phoneNumberPattern, "[PHONE_REDACTED]")
            : data,
      }),
    ],
  });

  sdk.start();
  langfuseGlobal.satyaVachanLangfuseSdk = sdk;
}
