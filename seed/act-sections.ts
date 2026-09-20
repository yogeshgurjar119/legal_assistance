import type { ActSection } from "@/lib/types";

/**
 * A small, curated, static reference index of well-known Indian statute
 * sections. Deliberately NOT a live external API — research during this
 * project confirmed there is no genuinely free, sustainable Indian
 * case-law/statute API (Indian Kanoon and eCourtsIndia are both paid after a
 * small one-time trial credit; the National Judicial Data Grid is a public
 * search website, not a general-purpose developer API). A small, always-
 * correct static index that's upfront about being a curated reference is
 * more honest and more useful than an unreliable "live" integration.
 *
 * India's core criminal statutes were replaced on 2024-07-01: the Indian
 * Penal Code (IPC) by the Bharatiya Nyaya Sanhita (BNS), and the Code of
 * Criminal Procedure (CrPC) by the Bharatiya Nagarik Suraksha Sanhita
 * (BNSS). Every entry below shows both the old and new section number where
 * a renumbering is confirmed. This is a REFERENCE INDEX, not legal advice —
 * always verify exact statutory text and current punishment ranges via the
 * linked source, since amendments happen over time and this list is not
 * exhaustive. `sourceUrl` is a search link (not a direct citation to a
 * specific document we haven't independently verified) — safer to construct
 * reliably than a guessed direct URL that might 404 or point to the wrong page.
 */

type RawEntry = Omit<ActSection, "sourceUrl">;

const RAW_ENTRIES: RawEntry[] = [
  {
    id: "ipc-302",
    oldAct: "IPC",
    oldSection: "302",
    newAct: "BNS",
    newSection: "103",
    title: "Murder",
    keywords: ["murder", "killing", "homicide"],
    summary:
      "Punishment for murder. One of the most serious offences under Indian criminal law, historically punishable with death or life imprisonment plus a fine.",
  },
  {
    id: "ipc-307",
    oldAct: "IPC",
    oldSection: "307",
    newAct: "BNS",
    newSection: "109",
    title: "Attempt to murder",
    keywords: ["attempt to murder", "attempted murder"],
    summary: "Covers acts done with the intention or knowledge that could cause death, even where death does not actually result.",
  },
  {
    id: "ipc-354",
    oldAct: "IPC",
    oldSection: "354",
    newAct: "BNS",
    newSection: "74",
    title: "Assault or criminal force to a woman with intent to outrage her modesty",
    keywords: ["assault", "outrage modesty", "molestation"],
    summary: "Criminalizes assault or use of criminal force against a woman intending to, or knowing it is likely to, outrage her modesty.",
  },
  {
    id: "ipc-375-376",
    oldAct: "IPC",
    oldSection: "375 / 376",
    newAct: "BNS",
    newSection: "63 / 64",
    title: "Rape — definition and punishment",
    keywords: ["rape", "sexual assault"],
    summary:
      "Section 375 (old) / 63 (new) defines the offence; Section 376 (old) / 64 (new) sets out the punishment. Among the most serious offences under Indian law.",
  },
  {
    id: "ipc-379",
    oldAct: "IPC",
    oldSection: "379",
    newAct: "BNS",
    newSection: "303",
    title: "Theft — punishment",
    keywords: ["theft", "stealing"],
    summary: "General punishment provision for theft — dishonestly taking movable property out of a person's possession without consent.",
  },
  {
    id: "ipc-397",
    oldAct: "IPC",
    oldSection: "397",
    newAct: "BNS",
    newSection: "312",
    title: "Robbery or dacoity with attempt to cause death or grievous hurt",
    keywords: ["robbery", "dacoity", "deadly weapon"],
    summary:
      "Applies when a deadly weapon is used, or grievous hurt is caused or attempted, during a robbery or dacoity — carries a higher minimum sentence than simple robbery/dacoity, and is non-bailable.",
  },
  {
    id: "ipc-406",
    oldAct: "IPC",
    oldSection: "406",
    newAct: "BNS",
    newSection: "316",
    title: "Criminal breach of trust — punishment",
    keywords: ["breach of trust", "misappropriation"],
    summary: "Punishes dishonest misappropriation or conversion of property entrusted to a person, in violation of that trust.",
  },
  {
    id: "ipc-420",
    oldAct: "IPC",
    oldSection: "420",
    newAct: "BNS",
    newSection: "318(4)",
    title: "Cheating and dishonestly inducing delivery of property",
    keywords: ["cheating", "fraud", "dishonest inducement"],
    summary:
      "Covers cheating that dishonestly induces the victim to deliver property, or to make/alter/destroy a valuable security. Cognizable and non-bailable.",
  },
  {
    id: "ipc-498a",
    oldAct: "IPC",
    oldSection: "498A",
    newAct: "BNS",
    newSection: "85",
    title: "Cruelty by husband or his relatives",
    keywords: ["cruelty", "domestic violence", "dowry harassment"],
    summary: "Punishes cruelty towards a married woman by her husband or his relatives, including conduct linked to dowry demands.",
  },
  {
    id: "ipc-506",
    oldAct: "IPC",
    oldSection: "506",
    newAct: "BNS",
    newSection: "351",
    title: "Criminal intimidation — punishment",
    keywords: ["criminal intimidation", "threat"],
    summary: "Punishes threatening a person with injury to their person, reputation, or property, intending to cause alarm or to compel an act.",
  },
  {
    id: "crpc-154",
    oldAct: "CrPC",
    oldSection: "154",
    newAct: "BNSS",
    newSection: "173",
    title: "Information in cognizable cases (FIR)",
    keywords: ["fir", "first information report", "cognizable"],
    summary: "Governs how a First Information Report (FIR) is recorded by police for a cognizable offence.",
  },
  {
    id: "crpc-125",
    oldAct: "CrPC",
    oldSection: "125",
    newAct: "BNSS",
    newSection: "144",
    title: "Order for maintenance of wives, children and parents",
    keywords: ["maintenance", "alimony", "dependents"],
    summary: "Allows a magistrate to order maintenance payments for a wife, children, or parents unable to maintain themselves.",
  },
  {
    id: "crpc-164",
    oldAct: "CrPC",
    oldSection: "164",
    newAct: "BNSS",
    newSection: "183",
    title: "Recording of confessions and statements",
    keywords: ["confession", "statement", "magistrate"],
    summary: "Governs how a magistrate records confessions and witness statements during an investigation.",
  },
  {
    id: "crpc-167",
    oldAct: "CrPC",
    oldSection: "167",
    newAct: "BNSS",
    newSection: "187",
    title: "Procedure when investigation cannot be completed in 24 hours (remand)",
    keywords: ["remand", "police custody", "judicial custody"],
    summary: "Governs remand of an accused to police or judicial custody when investigation cannot be completed within 24 hours.",
  },
  {
    id: "crpc-173",
    oldAct: "CrPC",
    oldSection: "173",
    newAct: "BNSS",
    newSection: "193",
    title: "Report of police officer on completion of investigation (charge sheet)",
    keywords: ["charge sheet", "chargesheet", "final report"],
    summary: "Requires police to submit a report (commonly called a charge sheet) to the magistrate on completing an investigation.",
  },
  {
    id: "crpc-248",
    oldAct: "CrPC",
    oldSection: "248",
    newAct: "BNSS",
    newSection: "271",
    title: "Acquittal or conviction (warrant cases)",
    keywords: ["acquittal", "conviction", "warrant case", "judgment"],
    summary:
      "Sets out the procedure for a magistrate to record acquittal or conviction at the conclusion of a warrant-case trial, and for sentencing after conviction.",
  },
  {
    id: "crpc-438",
    oldAct: "CrPC",
    oldSection: "438",
    newAct: "BNSS",
    newSection: "482",
    title: "Anticipatory bail",
    keywords: ["anticipatory bail", "pre-arrest bail"],
    summary: "Allows a person to apply for bail in anticipation of arrest on an accusation of a non-bailable offence.",
  },
  {
    id: "crpc-482",
    oldAct: "CrPC",
    oldSection: "482",
    newAct: "BNSS",
    newSection: "528",
    title: "Inherent powers of the High Court",
    keywords: ["inherent powers", "high court", "quash fir"],
    summary:
      "Preserves the High Court's inherent power to make orders needed to prevent abuse of process or to secure the ends of justice — commonly invoked to quash an FIR.",
  },
];

function buildSourceUrl(entry: RawEntry): string {
  const query = `Section ${entry.oldSection} ${entry.oldAct} ${entry.title}`;
  return `https://indiankanoon.org/search/?formInput=${encodeURIComponent(query)}`;
}

export const ACT_SECTIONS: ActSection[] = RAW_ENTRIES.map((entry) => ({
  ...entry,
  sourceUrl: buildSourceUrl(entry),
}));
