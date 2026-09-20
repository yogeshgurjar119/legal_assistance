import { describe, expect, it } from "vitest";
import {
  DocumentParseError,
  FileTooLargeError,
  UnsupportedFileError,
  applyRiskPatterns,
  parsePlainText,
  validateUpload,
} from "@/lib/document-parser";

describe("validateUpload", () => {
  it("accepts allowed MIME types under the size limit", () => {
    expect(() => validateUpload("application/pdf", 1000)).not.toThrow();
    expect(() => validateUpload("text/plain", 1000)).not.toThrow();
  });

  it("rejects an unsupported MIME type", () => {
    expect(() => validateUpload("image/jpeg", 1000)).toThrow(UnsupportedFileError);
  });

  it("rejects a file over the size ceiling", () => {
    expect(() => validateUpload("application/pdf", 6 * 1024 * 1024)).toThrow(FileTooLargeError);
  });
});

describe("parsePlainText", () => {
  it("returns trimmed text for valid input", () => {
    const text = parsePlainText(Buffer.from("  This is a long enough piece of text to analyze.  "));
    expect(text).toBe("This is a long enough piece of text to analyze.");
  });

  it("throws for empty input", () => {
    expect(() => parsePlainText(Buffer.from("   "))).toThrow(DocumentParseError);
  });

  it("throws text_too_short for very short input", () => {
    try {
      parsePlainText(Buffer.from("too short"));
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(DocumentParseError);
      expect((err as DocumentParseError).reason).toBe("text_too_short");
    }
  });
});

describe("applyRiskPatterns", () => {
  it("flags an auto-renewal clause", () => {
    const text = "This agreement shall automatically renew for successive one-year terms unless cancelled.";
    const flags = applyRiskPatterns(text);
    expect(flags.some((f) => f.id === "auto-renewal")).toBe(true);
  });

  it("flags a sole-discretion termination clause", () => {
    const text = "The Company may, at its sole discretion, terminate this agreement at any time.";
    const flags = applyRiskPatterns(text);
    expect(flags.some((f) => f.id === "sole-discretion-termination")).toBe(true);
  });

  it("flags an indemnification clause", () => {
    const text = "Customer agrees to indemnify and hold harmless the Company from any claims.";
    const flags = applyRiskPatterns(text);
    expect(flags.some((f) => f.id === "indemnification")).toBe(true);
  });

  it("flags mandatory arbitration", () => {
    const text = "Any dispute shall be resolved through binding arbitration.";
    const flags = applyRiskPatterns(text);
    expect(flags.some((f) => f.id === "arbitration")).toBe(true);
  });

  it("flags liquidated damages", () => {
    const text = "In the event of breach, Tenant shall pay liquidated damages of $500.";
    const flags = applyRiskPatterns(text);
    expect(flags.some((f) => f.id === "liquidated-damages")).toBe(true);
  });

  it("flags a broad liability waiver", () => {
    const text = "Company waives any and all claims and shall have no liability whatsoever.";
    const flags = applyRiskPatterns(text);
    expect(flags.some((f) => f.id === "broad-liability-waiver")).toBe(true);
  });

  it("returns an empty array for benign text", () => {
    const flags = applyRiskPatterns("The parties agree to meet on the first Monday of each month.");
    expect(flags).toEqual([]);
  });
});
