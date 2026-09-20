/**
 * Tests parsePdfBuffer against a REAL, minimal, valid PDF fixture — not a
 * mock. This exists because a prior version of this file used `pdf-parse`,
 * which bundles a years-old copy of pdf.js that threw "bad XRef entry" on
 * PDFs from mainstream writers (confirmed against pdfkit output) — i.e. the
 * real PDF-upload feature was silently broken while every mocked/text-only
 * test still passed. Switched to `unpdf`; this test is what would have
 * caught that regression, so keep it exercising real parsing, not a mock.
 *
 * Fixture: a one-page PDF containing the text "Hello world", generated with
 * pdfkit and base64-embedded here so this test has no external file/network
 * dependency.
 */
import { describe, expect, it } from "vitest";
import { DocumentParseError, parsePdfBuffer } from "@/lib/document-parser";

const HELLO_WORLD_PDF_BASE64 =
  "JVBERi0xLjMKJf////8KNyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDEgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9Db250ZW50cyA1IDAgUgovUmVzb3VyY2VzIDYgMCBSCi9Vc2VyVW5pdCAxCj4+CmVuZG9iago2IDAgb2JqCjw8Ci9Qcm9jU2V0IFsvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJXQovRm9udCA8PAovRjEgOCAwIFIKPj4KL0NvbG9yU3BhY2UgPDwKPj4KPj4KZW5kb2JqCjUgMCBvYmoKPDwKL0xlbmd0aCAxMDIKL0ZpbHRlciAvRmxhdGVEZWNvZGUKPj4Kc3RyZWFtCnicZcghDsMwDAVQ7lP8C3T191K7k6KASRsYq2RWFUUKK9j9ychYH3yEQjERingY+ilf4eWe+U8iDEHe7mtBnjK/CRpyyF7L6ot37z5MIxqoqD7CGiYuqN69NOiB/MgrZZMf3X4ZKAplbmRzdHJlYW0KZW5kb2JqCjEwIDAgb2JqCihQREZLaXQpCmVuZG9iagoxMSAwIG9iagooUERGS2l0KQplbmRvYmoKMTIgMCBvYmoKKEQ6MjAyNjA5MjAxMzIwMjVaKQplbmRvYmoKOSAwIG9iago8PAovUHJvZHVjZXIgMTAgMCBSCi9DcmVhdG9yIDExIDAgUgovQ3JlYXRpb25EYXRlIDEyIDAgUgo+PgplbmRvYmoKOCAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL0hlbHZldGljYQovU3VidHlwZSAvVHlwZTEKL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcKPj4KZW5kb2JqCjQgMCBvYmoKPDwKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDEgMCBSCi9OYW1lcyAyIDAgUgo+PgplbmRvYmoKMSAwIG9iago8PAovVHlwZSAvUGFnZXMKL0NvdW50IDEKL0tpZHMgWzcgMCBSXQo+PgplbmRvYmoKMiAwIG9iago8PAovRGVzdHMgPDwKICAvTmFtZXMgWwpdCj4+Cj4+CmVuZG9iagp4cmVmCjAgMTMKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwNzUzIDAwMDAwIG4gCjAwMDAwMDA4MTAgMDAwMDAgbiAKMDAwMDAwMDY5MSAwMDAwMCBuIAowMDAwMDAwNjcwIDAwMDAwIG4gCjAwMDAwMDAyMzggMDAwMDAgbiAKMDAwMDAwMDEzMSAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDA1NzMgMDAwMDAgbiAKMDAwMDAwMDQ5OCAwMDAwMCBuIAowMDAwMDAwNDEyIDAwMDAwIG4gCjAwMDAwMDA0MzcgMDAwMDAgbiAKMDAwMDAwMDQ2MiAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDEzCi9Sb290IDMgMCBSCi9JbmZvIDkgMCBSCi9JRCBbPDc1ZTJjZTkzNTcxYmUzY2U0ZmNjMDMxYWY0YWU0MDY2PiA8NzVlMmNlOTM1NzFiZTNjZTRmY2MwMzFhZjRhZTQwNjY+XQo+PgpzdGFydHhyZWYKODU3CiUlRU9GCg==";

// A one-page PDF containing the actual "sample lease clause" demo text
// (multiple paragraphs, well over MIN_TEXT_LENGTH) — same pdfkit-generated
// fixture used for the demo-video sample document, so this test doubles as
// a guarantee that the file handed to users for the demo actually works.
const LEASE_CLAUSE_PDF_BASE64 =
  "JVBERi0xLjMKJf////8KNyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDEgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9Db250ZW50cyA1IDAgUgovUmVzb3VyY2VzIDYgMCBSCi9Vc2VyVW5pdCAxCj4+CmVuZG9iago2IDAgb2JqCjw8Ci9Qcm9jU2V0IFsvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJXQovRm9udCA8PAovRjEgOCAwIFIKPj4KL0NvbG9yU3BhY2UgPDwKPj4KPj4KZW5kb2JqCjUgMCBvYmoKPDwKL0xlbmd0aCA5OTQKL0ZpbHRlciAvRmxhdGVEZWNvZGUKPj4Kc3RyZWFtCnicnVe7jiNHDMz1Ff0DN+5mk8VpQFBgwA6cGdjMcGDPI7vA/58YJFujkUbrvXGyu2r1g1VkFbkl5ZTTt5Jy0kZp+n7551IOaz9/9MWSJCetPJRM6eP75adfSyolfayXP65CLFK5MbPwIsyNC0+UeWLhIpWFMpdbqjldWW03C8+xl3JTyr62sIje7J1rP194YaYca8IsQjxz48VuKxSLjVdebin/mT5+u/zycfn9R4DkcYAecDBGNK0WOQRFKzxy6C2VnK5KEAhmCBZlyloxomDCRBlFRRkrZhRlNNT4RhtlP7dAbslCVqUMBBtYleweFVRUiFataIpbIklXex2rnaRZW5z2uOwMQ5Ru6ZtvnLWeZABNhib8SoFaoFMEQhmCpkaK+JMG0p5kQ8GOzLCtt1QkXRVosKgqZVXfaMt2gwWLhTIWrJ2cgAbKaEbmndLY4fDWt8QV39XTo3wW9VgHquMr6oqaKYPRi1S9CAzcBqJnKsJySpyeBXwHcl+N31hoRlVRChAd1D5ntNwScro+CrwXtd9bOiEFtWf+byOnc61OAUM73/ZmOU+H5kHooOetOgsaJsPQca3vM+7fNdeF1/tzmlXtFtOI3eO1Pjmy5iVR+k8Ge7E1r/ji+1m78vzmhypmzLbLUJ9FLDqMGQfEO71jBXXGJzRo1/MacfY8fpXp/lfHQR2F3SQuJGO1BvrOZYtP/tlKUOKssYTq93l8Z/GyDLkdVF7VireiwVIo2NLBoqOZIMiSYeZHZ70VpQ2Qg8Z4cniMyaTkL84PvRlok8K0Sdxso7rHrpadzk4ogmLVHVdcuE1rsLTlajrozam8p+Bh9Z/Y+1nUGUPjo5RKF/EuzXexUFbRHIVV6xsH0h800lDm5yYyhQgd82qkUbb2ZCW4J/Z5z0n80nggeiesZglzC2i9aXwR7kt3fNGIaWpGCeeLda8aKyvrns+r4dqW2Amrg35oufoJDh3uaa5eKd6mzewwn+ViLIOUN6IzyY2f12UE9oNd4aloew9Yu1+wl/Fi8t58xU6NrqX4q+wj2Dr+G5X+Tw4wDtoO88Ubwws4MURVTN505qckfpbyKA/pihnd05YogS9T+l/0qtMpuptSwurPciAYsh6cUKMgZw/rgWjLO78WfDO/3szuPS4f3LgPal+a28vsGv3du7P76tZp0budcaYCPd1vhetQcbRF6nV6z0pRipbz1Cs3J98Khdz3xsMwal0sBs9gzqpoP0b3Vt3CDh5TnWJ8jJsolPGXhjbDhX0I2e2PnrzNgmfZqHkAH0zyiMX+Ccj3XvUYlHZV4UrpU3pB3bvHLqR/AaCF804KZW5kc3RyZWFtCmVuZG9iagoxMCAwIG9iagooUERGS2l0KQplbmRvYmoKMTEgMCBvYmoKKFBERktpdCkKZW5kb2JqCjEyIDAgb2JqCihEOjIwMjYwOTIwMTMxOTQyWikKZW5kb2JqCjkgMCBvYmoKPDwKL1Byb2R1Y2VyIDEwIDAgUgovQ3JlYXRvciAxMSAwIFIKL0NyZWF0aW9uRGF0ZSAxMiAwIFIKPj4KZW5kb2JqCjggMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9IZWx2ZXRpY2EKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCj4+CmVuZG9iago0IDAgb2JqCjw8Cj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAxIDAgUgovTmFtZXMgMiAwIFIKPj4KZW5kb2JqCjEgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9Db3VudCAxCi9LaWRzIFs3IDAgUl0KPj4KZW5kb2JqCjIgMCBvYmoKPDwKL0Rlc3RzIDw8CiAgL05hbWVzIFsKXQo+Pgo+PgplbmRvYmoKeHJlZgowIDEzCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMTY0NSAwMDAwMCBuIAowMDAwMDAxNzAyIDAwMDAwIG4gCjAwMDAwMDE1ODMgMDAwMDAgbiAKMDAwMDAwMTU2MiAwMDAwMCBuIAowMDAwMDAwMjM4IDAwMDAwIG4gCjAwMDAwMDAxMzEgMDAwMDAgbiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAxNDY1IDAwMDAwIG4gCjAwMDAwMDEzOTAgMDAwMDAgbiAKMDAwMDAwMTMwNCAwMDAwMCBuIAowMDAwMDAxMzI5IDAwMDAwIG4gCjAwMDAwMDEzNTQgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSAxMwovUm9vdCAzIDAgUgovSW5mbyA5IDAgUgovSUQgWzw4YTE1Y2NhMjY2ZGRmYmVhYmIyYzJkOWU5ODgwYTNiNj4gPDhhMTVjY2EyNjZkZGZiZWFiYjJjMmQ5ZTk4ODBhM2I2Pl0KPj4Kc3RhcnR4cmVmCjE3NDkKJSVFT0YK";

describe("parsePdfBuffer (real PDF, not mocked)", () => {
  it("extracts text from a real, minimal, valid PDF", async () => {
    const buffer = Buffer.from(HELLO_WORLD_PDF_BASE64, "base64");
    // Below MIN_TEXT_LENGTH ("Hello world" is 11 chars), so this specific
    // fixture is expected to throw text_too_short — which still proves the
    // PDF was *readable* (a corrupt_pdf error would mean parsing itself failed).
    // The real assertion here is "does NOT throw corrupt_pdf".
    await expect(parsePdfBuffer(buffer)).rejects.toMatchObject({ reason: "text_too_short" });
  });

  it("extracts full multi-paragraph text from a real PDF (full success path)", async () => {
    const buffer = Buffer.from(LEASE_CLAUSE_PDF_BASE64, "base64");
    const text = await parsePdfBuffer(buffer);
    expect(text).toContain("automatically renew");
    expect(text).toContain("sole and absolute discretion");
    expect(text).toContain("binding arbitration");
    expect(text.length).toBeGreaterThan(500);
  });

  it("throws corrupt_pdf for genuinely invalid PDF bytes", async () => {
    const buffer = Buffer.from("this is not a pdf at all", "utf-8");
    try {
      await parsePdfBuffer(buffer);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(DocumentParseError);
      expect((err as DocumentParseError).reason).toBe("corrupt_pdf");
    }
  });
});
