import type { LegalSnippet, RiskClausePattern, SupportedLocale } from "@/lib/types";

/**
 * Single source of truth for the "not legal advice" caveat — reused in the
 * UI banner (components/LegalDisclaimerBanner.tsx), appended to every seeded
 * answer, and injected into every AI system prompt, so the wording can't
 * drift between the places it needs to appear.
 */
export const LEGAL_DISCLAIMER: Record<SupportedLocale, string> = {
  en: "This is general legal information, not legal advice. Laws vary by jurisdiction and change over time — consult a licensed attorney for guidance on your specific situation.",
  es: "Esta es información legal general, no asesoría legal. Las leyes varían según la jurisdicción y cambian con el tiempo; consulte a un abogado con licencia para su situación específica.",
  fr: "Ceci est une information juridique générale, et non un conseil juridique. Les lois varient selon la juridiction et évoluent dans le temps — consultez un avocat agréé pour votre situation particulière.",
  ar: "هذه معلومات قانونية عامة وليست استشارة قانونية. تختلف القوانين حسب الولاية القضائية وتتغير بمرور الوقت — يرجى استشارة محامٍ مرخّص بشأن حالتك الخاصة.",
  pt: "Esta é uma informação jurídica geral, não um aconselhamento jurídico. As leis variam por jurisdição e mudam com o tempo — consulte um advogado licenciado para a sua situação específica.",
};

function withCaveat(answer: Record<SupportedLocale, string>): Record<SupportedLocale, string> {
  const out = {} as Record<SupportedLocale, string>;
  (Object.keys(answer) as SupportedLocale[]).forEach((locale) => {
    out[locale] = `${answer[locale]} ${LEGAL_DISCLAIMER[locale]}`;
  });
  return out;
}

export const legalSnippets: LegalSnippet[] = [
  // ---------------------------------------------------------------- tenant-rights
  {
    id: "tenant-security-deposit",
    category: "tenant-rights",
    keywords: ["security deposit", "deposit", "landlord keep", "move out", "refund deposit"],
    answer: withCaveat({
      en: "Most jurisdictions require a landlord to return a security deposit within a set number of days after move-out, minus documented damage beyond normal wear and tear — a landlord generally cannot keep the entire deposit without an itemized reason.",
      es: "La mayoría de las jurisdicciones exigen que el arrendador devuelva el depósito de seguridad dentro de un plazo determinado tras la mudanza, descontando solo daños documentados que excedan el desgaste normal; por lo general no puede quedarse con todo el depósito sin una justificación detallada.",
      fr: "La plupart des juridictions exigent que le bailleur restitue le dépôt de garantie dans un délai fixé après le départ, déduction faite des dommages documentés dépassant l'usure normale — il ne peut généralement pas conserver la totalité du dépôt sans justification détaillée.",
      ar: "تشترط معظم الولايات القضائية على المالك إعادة مبلغ التأمين خلال مدة محددة بعد إخلاء المسكن، مع خصم الأضرار الموثقة التي تتجاوز الاستهلاك العادي فقط — ولا يجوز له عادة الاحتفاظ بكامل المبلغ دون بيان تفصيلي بالأسباب.",
      pt: "A maioria das jurisdições exige que o locador devolva o depósito de segurança dentro de um prazo definido após a mudança, descontando apenas danos documentados além do desgaste normal — geralmente não pode reter o depósito integral sem uma justificativa detalhada.",
    }),
  },
  {
    id: "tenant-eviction-notice",
    category: "tenant-rights",
    keywords: ["eviction", "evict", "notice to vacate", "kicked out", "landlord notice"],
    answer: withCaveat({
      en: "Landlords typically must provide written notice and, in most places, go through a court process before evicting a tenant — a landlord generally cannot lock you out, remove your belongings, or shut off utilities to force you out.",
      es: "Por lo general, los arrendadores deben entregar un aviso por escrito y, en la mayoría de los lugares, seguir un proceso judicial antes de desalojar a un inquilino; normalmente no pueden cambiar las cerraduras, retirar sus pertenencias ni cortar los servicios para obligarlo a irse.",
      fr: "Les bailleurs doivent généralement fournir un préavis écrit et, dans la plupart des cas, suivre une procédure judiciaire avant d'expulser un locataire — ils ne peuvent normalement pas changer les serrures, retirer vos biens ou couper les services pour vous forcer à partir.",
      ar: "يجب على المالك عادة تقديم إشعار كتابي، وفي معظم الأماكن اتباع إجراء قضائي قبل إخلاء المستأجر — ولا يجوز له عادة تغيير الأقفال أو إزالة ممتلكاتك أو قطع الخدمات لإجبارك على المغادرة.",
      pt: "Os locadores geralmente devem fornecer aviso por escrito e, na maioria dos lugares, seguir um processo judicial antes de despejar um inquilino — normalmente não podem trocar as fechaduras, remover seus pertences ou cortar os serviços para forçar sua saída.",
    }),
  },
  {
    id: "tenant-habitability",
    category: "tenant-rights",
    keywords: ["habitability", "repairs", "landlord fix", "unsafe apartment", "no heat", "mold"],
    answer: withCaveat({
      en: "Landlords generally must keep a rental unit safe and livable (working heat, water, plumbing, and no serious hazards) — a tenant can often report the issue in writing, and some jurisdictions allow rent withholding or repair-and-deduct if the landlord fails to fix serious problems.",
      es: "Por lo general, los arrendadores deben mantener la vivienda segura y habitable (calefacción, agua y plomería funcionando, sin peligros graves); el inquilino suele poder reportar el problema por escrito, y algunas jurisdicciones permiten retener la renta o reparar y descontar el costo si el arrendador no soluciona problemas graves.",
      fr: "Les bailleurs doivent généralement maintenir le logement sûr et habitable (chauffage, eau et plomberie fonctionnels, sans danger grave) — le locataire peut souvent signaler le problème par écrit, et certaines juridictions permettent de retenir le loyer ou de réparer puis déduire les frais si le bailleur ne corrige pas des problèmes graves.",
      ar: "يتعين على المالك عادة الحفاظ على الوحدة السكنية آمنة وصالحة للسكن (تدفئة ومياه وسباكة تعمل، وخلوها من المخاطر الجسيمة) — ويمكن للمستأجر غالبًا الإبلاغ عن المشكلة كتابيًا، وتسمح بعض الولايات القضائية بحجز الإيجار أو الإصلاح وخصم التكلفة إذا لم يعالج المالك المشكلات الجسيمة.",
      pt: "Os locadores geralmente devem manter a unidade alugada segura e habitável (aquecimento, água e encanamento funcionando, sem perigos graves) — o inquilino costuma poder relatar o problema por escrito, e algumas jurisdições permitem reter o aluguel ou reparar e deduzir o custo se o locador não corrigir problemas graves.",
    }),
  },

  // ------------------------------------------------------------ contract-basics
  {
    id: "contract-what-is",
    category: "contract-basics",
    keywords: ["what is a contract", "valid contract", "offer acceptance consideration", "binding agreement"],
    answer: withCaveat({
      en: "A contract is generally a legally binding agreement formed when one party makes an offer, another accepts it, and something of value (consideration) is exchanged — it can be written, oral, or implied by conduct, though some contracts (like real estate) must be in writing to be enforceable.",
      es: "Un contrato es generalmente un acuerdo legalmente vinculante que se forma cuando una parte hace una oferta, otra la acepta y se intercambia algo de valor (contraprestación); puede ser escrito, oral o implícito por conducta, aunque algunos contratos (como los de bienes raíces) deben constar por escrito para ser exigibles.",
      fr: "Un contrat est généralement un accord juridiquement contraignant formé lorsqu'une partie fait une offre, qu'une autre l'accepte, et qu'une contrepartie de valeur est échangée — il peut être écrit, oral ou implicite par le comportement, bien que certains contrats (comme l'immobilier) doivent être écrits pour être exécutoires.",
      ar: "العقد بوجه عام اتفاق ملزم قانونًا ينشأ عندما يقدّم أحد الطرفين عرضًا ويقبله الطرف الآخر مع تبادل شيء ذي قيمة (المقابل) — ويمكن أن يكون مكتوبًا أو شفهيًا أو ضمنيًا من خلال التصرف، رغم أن بعض العقود (مثل العقارات) يجب أن تكون مكتوبة لتكون قابلة للتنفيذ.",
      pt: "Um contrato é geralmente um acordo juridicamente vinculativo formado quando uma parte faz uma oferta, outra a aceita, e algo de valor (contraprestação) é trocado — pode ser escrito, oral ou implícito pela conduta, embora alguns contratos (como os imobiliários) devam ser escritos para serem exequíveis.",
    }),
  },
  {
    id: "contract-cooling-off-period",
    category: "contract-basics",
    keywords: ["cooling off period", "cancel contract", "right to cancel", "rescind"],
    answer: withCaveat({
      en: "A cooling-off period is a set number of days after signing certain contracts (common for door-to-door sales, timeshares, or some loans) during which a consumer can cancel without penalty — it does not apply to every contract, so check the specific law or the contract's own terms.",
      es: "Un período de reflexión es un número determinado de días tras firmar ciertos contratos (comunes en ventas a domicilio, multipropiedad o algunos préstamos) durante los cuales el consumidor puede cancelar sin penalización; no aplica a todos los contratos, así que conviene verificar la ley específica o los términos del propio contrato.",
      fr: "Un délai de rétractation est un nombre de jours défini après la signature de certains contrats (courant pour la vente à domicile, la multipropriété ou certains prêts) pendant lequel un consommateur peut annuler sans pénalité — cela ne s'applique pas à tous les contrats, il faut donc vérifier la loi spécifique ou les termes du contrat.",
      ar: "فترة التروّي هي عدد محدد من الأيام بعد توقيع بعض العقود (شائعة في المبيعات المنزلية أو الملكية بالتناوب أو بعض القروض) يمكن خلالها للمستهلك الإلغاء دون غرامة — ولا تنطبق على كل عقد، لذا يجب التحقق من القانون المحدد أو شروط العقد نفسه.",
      pt: "Um período de reflexão é um número definido de dias após a assinatura de certos contratos (comum em vendas porta a porta, multipropriedade ou alguns empréstimos) durante o qual o consumidor pode cancelar sem penalidade — não se aplica a todo contrato, então verifique a lei específica ou os termos do próprio contrato.",
    }),
  },
  {
    id: "contract-breach",
    category: "contract-basics",
    keywords: ["breach of contract", "broke the contract", "didn't perform", "contract violation"],
    answer: withCaveat({
      en: "A breach of contract happens when one party fails to perform an obligation the agreement required — remedies can include damages (money to cover the loss), specific performance (a court order to complete the obligation), or cancellation of the contract, depending on how serious the breach is.",
      es: "Un incumplimiento de contrato ocurre cuando una parte no cumple una obligación exigida por el acuerdo; los recursos pueden incluir daños (dinero para cubrir la pérdida), cumplimiento específico (una orden judicial para completar la obligación) o la cancelación del contrato, según la gravedad del incumplimiento.",
      fr: "Une rupture de contrat survient lorsqu'une partie n'exécute pas une obligation requise par l'accord — les recours peuvent inclure des dommages-intérêts (argent pour couvrir la perte), l'exécution forcée (une ordonnance du tribunal pour accomplir l'obligation) ou l'annulation du contrat, selon la gravité de la rupture.",
      ar: "يحدث الإخلال بالعقد عندما يفشل أحد الطرفين في تنفيذ التزام يفرضه الاتفاق — وقد تشمل سبل الانتصاف التعويضات (مبلغ مالي لتغطية الخسارة)، أو التنفيذ العيني (أمر من المحكمة بإتمام الالتزام)، أو إلغاء العقد، بحسب مدى جسامة الإخلال.",
      pt: "Uma quebra de contrato ocorre quando uma parte não cumpre uma obrigação exigida pelo acordo — os remédios podem incluir indenização (dinheiro para cobrir a perda), execução específica (uma ordem judicial para cumprir a obrigação) ou cancelamento do contrato, dependendo da gravidade da quebra.",
    }),
  },

  // ------------------------------------------------------- consumer-protection
  {
    id: "consumer-warranty-basics",
    category: "consumer-protection",
    keywords: ["warranty", "implied warranty", "product defective", "warranty claim"],
    answer: withCaveat({
      en: "Many purchases carry an implied warranty that a product will work as expected, even without a written warranty — a seller may be required to repair, replace, or refund a defective product within a reasonable time, subject to local consumer protection law.",
      es: "Muchas compras incluyen una garantía implícita de que el producto funcionará como se espera, incluso sin garantía escrita; es posible que el vendedor deba reparar, reemplazar o reembolsar un producto defectuoso dentro de un plazo razonable, según la ley local de protección al consumidor.",
      fr: "De nombreux achats comportent une garantie implicite que le produit fonctionnera comme prévu, même sans garantie écrite — le vendeur peut être tenu de réparer, remplacer ou rembourser un produit défectueux dans un délai raisonnable, selon la loi locale de protection des consommateurs.",
      ar: "تحمل الكثير من المشتريات ضمانًا ضمنيًا بأن المنتج سيعمل كما هو متوقع حتى بدون ضمان مكتوب — وقد يُلزَم البائع بإصلاح المنتج المعيب أو استبداله أو رد ثمنه خلال مدة معقولة، وفقًا لقانون حماية المستهلك المحلي.",
      pt: "Muitas compras têm uma garantia implícita de que o produto funcionará como esperado, mesmo sem garantia escrita — o vendedor pode ser obrigado a reparar, substituir ou reembolsar um produto defeituoso dentro de um prazo razoável, conforme a lei local de proteção ao consumidor.",
    }),
  },
  {
    id: "consumer-returns-refunds",
    category: "consumer-protection",
    keywords: ["return policy", "refund rights", "store return", "no refund sign"],
    answer: withCaveat({
      en: "Return and refund rights mostly come from the seller's own posted policy, not a universal law — but a defective, unsafe, or misrepresented product is often covered by consumer protection law regardless of a store's 'no refunds' sign.",
      es: "Los derechos de devolución y reembolso provienen mayormente de la política publicada por el vendedor, no de una ley universal; sin embargo, un producto defectuoso, inseguro o mal representado suele estar protegido por la ley de protección al consumidor, sin importar un aviso de 'no hay reembolsos'.",
      fr: "Les droits de retour et de remboursement proviennent surtout de la politique affichée par le vendeur, et non d'une loi universelle — mais un produit défectueux, dangereux ou mal représenté est souvent couvert par la loi de protection des consommateurs, malgré un panneau « non remboursable ».",
      ar: "تنبع حقوق الإرجاع والاسترداد غالبًا من السياسة المعلنة من البائع وليس من قانون عام موحّد — لكن المنتج المعيب أو غير الآمن أو الذي جرى وصفه بشكل مضلل غالبًا ما يكون مشمولاً بقانون حماية المستهلك بصرف النظر عن لافتة 'لا استرداد للمبالغ'.",
      pt: "Os direitos de devolução e reembolso vêm principalmente da política divulgada pelo vendedor, não de uma lei universal — mas um produto defeituoso, inseguro ou descrito de forma enganosa geralmente é coberto pela lei de proteção ao consumidor, independentemente de um aviso de 'sem reembolso'.",
    }),
  },
  {
    id: "consumer-unfair-practices",
    category: "consumer-protection",
    keywords: ["unfair trade practice", "deceptive advertising", "scam", "false advertising"],
    answer: withCaveat({
      en: "Deceptive or unfair trade practices — false advertising, bait-and-switch pricing, hidden fees — are commonly prohibited by consumer protection law, and a consumer can often file a complaint with a local consumer protection agency or pursue a civil claim.",
      es: "Las prácticas comerciales engañosas o desleales —publicidad falsa, ofertas señuelo, cargos ocultos— suelen estar prohibidas por la ley de protección al consumidor, y el consumidor a menudo puede presentar una queja ante una agencia local de protección al consumidor o iniciar una demanda civil.",
      fr: "Les pratiques commerciales trompeuses ou déloyales — publicité mensongère, appât et substitution, frais cachés — sont généralement interdites par la loi de protection des consommateurs, et un consommateur peut souvent déposer une plainte auprès d'un organisme local de protection des consommateurs ou intenter une action civile.",
      ar: "غالبًا ما تحظر قوانين حماية المستهلك الممارسات التجارية المخادعة أو غير العادلة — كالإعلانات الكاذبة أو أسلوب 'الطعم والتبديل' أو الرسوم الخفية — ويمكن للمستهلك غالبًا تقديم شكوى لدى جهة محلية لحماية المستهلك أو رفع دعوى مدنية.",
      pt: "Práticas comerciais enganosas ou desleais — publicidade falsa, preços de isca e troca, taxas ocultas — geralmente são proibidas pela lei de proteção ao consumidor, e o consumidor muitas vezes pode registrar uma reclamação em um órgão local de proteção ao consumidor ou mover uma ação civil.",
    }),
  },

  // ------------------------------------------------------- employment-basics
  {
    id: "employment-at-will",
    category: "employment-basics",
    keywords: ["at will employment", "fired without reason", "terminated", "can i be fired"],
    answer: withCaveat({
      en: "In many places, employment is 'at will,' meaning either the employer or employee can end the relationship at any time for almost any reason — but termination is still illegal if it's based on a protected characteristic (like race or disability) or retaliation for a protected activity.",
      es: "En muchos lugares, el empleo es 'a voluntad', lo que significa que tanto el empleador como el empleado pueden terminar la relación en cualquier momento por casi cualquier motivo; sin embargo, el despido sigue siendo ilegal si se basa en una característica protegida (como raza o discapacidad) o en represalia por una actividad protegida.",
      fr: "Dans de nombreux endroits, l'emploi est « à volonté », ce qui signifie que l'employeur ou l'employé peut mettre fin à la relation à tout moment pour presque n'importe quelle raison — mais le licenciement reste illégal s'il est fondé sur une caractéristique protégée (comme la race ou un handicap) ou en représailles d'une activité protégée.",
      ar: "في العديد من الأماكن، يكون التوظيف 'حرًّا' بمعنى أن لصاحب العمل أو الموظف إنهاء العلاقة في أي وقت ولأي سبب تقريبًا — لكن الفصل يظل غير قانوني إذا استند إلى صفة محمية (كالعرق أو الإعاقة) أو كان انتقامًا بسبب نشاط محمي.",
      pt: "Em muitos lugares, o emprego é 'à vontade', o que significa que o empregador ou o funcionário podem encerrar a relação a qualquer momento por quase qualquer motivo — mas a demissão continua ilegal se baseada em uma característica protegida (como raça ou deficiência) ou em retaliação por uma atividade protegida.",
    }),
  },
  {
    id: "employment-wage-hour",
    category: "employment-basics",
    keywords: ["minimum wage", "overtime pay", "unpaid wages", "wage theft"],
    answer: withCaveat({
      en: "Wage and hour laws typically set a minimum wage and require overtime pay (often 1.5x the regular rate) for hours worked beyond a set threshold — an employer withholding earned wages or misclassifying a worker to avoid overtime may be violating these laws.",
      es: "Las leyes de salario y horas suelen establecer un salario mínimo y exigir pago de horas extra (a menudo 1.5 veces la tarifa regular) por las horas trabajadas más allá de un umbral fijado; un empleador que retenga salarios devengados o clasifique erróneamente a un trabajador para evitar pagar horas extra podría estar violando estas leyes.",
      fr: "Les lois sur le salaire et les heures fixent généralement un salaire minimum et exigent le paiement des heures supplémentaires (souvent 1,5 fois le taux normal) au-delà d'un seuil défini — un employeur qui retient des salaires dus ou classe mal un travailleur pour éviter les heures supplémentaires peut enfreindre ces lois.",
      ar: "تحدد قوانين الأجور وساعات العمل عادة حدًّا أدنى للأجور وتفرض دفع أجر إضافي (غالبًا 1.5 ضعف المعدل العادي) عن ساعات العمل التي تتجاوز حدًّا معينًا — وقد يخالف صاحب العمل هذه القوانين إذا حجب أجورًا مستحقة أو صنّف عاملاً بشكل خاطئ لتجنب دفع الأجر الإضافي.",
      pt: "As leis de salário e jornada geralmente estabelecem um salário mínimo e exigem pagamento de horas extras (frequentemente 1,5 vez a taxa normal) por horas trabalhadas além de um limite definido — um empregador que retém salários devidos ou classifica erroneamente um trabalhador para evitar horas extras pode estar violando essas leis.",
    }),
  },
  {
    id: "employment-discrimination",
    category: "employment-basics",
    keywords: ["workplace discrimination", "harassment at work", "discriminated", "hostile work environment"],
    answer: withCaveat({
      en: "Workplace discrimination or harassment based on characteristics like race, gender, age, disability, or religion is generally prohibited by employment law — an affected employee can often file a complaint with an employment or human-rights agency before or instead of a lawsuit.",
      es: "La discriminación o el acoso laboral por características como raza, género, edad, discapacidad o religión suele estar prohibido por la legislación laboral; un empleado afectado a menudo puede presentar una queja ante una agencia laboral o de derechos humanos antes de, o en lugar de, una demanda.",
      fr: "La discrimination ou le harcèlement au travail fondés sur des caractéristiques comme la race, le genre, l'âge, le handicap ou la religion sont généralement interdits par le droit du travail — un employé concerné peut souvent déposer une plainte auprès d'un organisme du travail ou des droits humains avant ou à la place d'un procès.",
      ar: "يُحظر التمييز أو التحرش في مكان العمل بناءً على خصائص مثل العرق أو الجنس أو العمر أو الإعاقة أو الدين بموجب قانون العمل عادة — ويمكن للموظف المتضرر غالبًا تقديم شكوى لدى جهة عمل أو حقوق إنسان قبل رفع دعوى قضائية أو بدلاً منها.",
      pt: "A discriminação ou o assédio no trabalho com base em características como raça, gênero, idade, deficiência ou religião geralmente é proibido pela legislação trabalhista — um funcionário afetado muitas vezes pode registrar uma reclamação em um órgão trabalhista ou de direitos humanos antes de, ou em vez de, um processo judicial.",
    }),
  },

  // ------------------------------------------------------------- small-claims
  {
    id: "small-claims-what-is",
    category: "small-claims",
    keywords: ["small claims court", "what is small claims", "sue someone", "small claims limit"],
    answer: withCaveat({
      en: "Small claims court is a simplified, lower-cost court for disputes below a set dollar limit (often a few thousand dollars, varying by jurisdiction) — it's designed so people can represent themselves without a lawyer, with a faster process than regular civil court.",
      es: "El tribunal de reclamos menores es un tribunal simplificado y de bajo costo para disputas por debajo de un límite monetario fijado (a menudo unos pocos miles de dólares, según la jurisdicción); está diseñado para que las personas puedan representarse a sí mismas sin abogado, con un proceso más rápido que el tribunal civil ordinario.",
      fr: "Le tribunal des petites créances est une juridiction simplifiée et peu coûteuse pour les litiges en dessous d'un plafond fixé (souvent quelques milliers de dollars, selon la juridiction) — conçu pour que les gens puissent se représenter eux-mêmes sans avocat, avec une procédure plus rapide que le tribunal civil ordinaire.",
      ar: "محكمة الدعاوى الصغيرة هي محكمة مبسطة ومنخفضة التكلفة للنزاعات التي تقل عن حد مالي معين (غالبًا بضعة آلاف من الدولارات، ويختلف بحسب الولاية القضائية) — وهي مصممة لتمكين الأفراد من تمثيل أنفسهم دون محامٍ، مع إجراءات أسرع من المحكمة المدنية العادية.",
      pt: "O tribunal de pequenas causas é um tribunal simplificado e de baixo custo para disputas abaixo de um limite monetário definido (geralmente alguns milhares de dólares, variando por jurisdição) — projetado para que as pessoas possam se representar sem advogado, com um processo mais rápido que o tribunal civil comum.",
    }),
  },
  {
    id: "small-claims-how-to-file",
    category: "small-claims",
    keywords: ["how to file small claims", "filing a claim", "small claims process", "sue in small claims"],
    answer: withCaveat({
      en: "Filing a small claims case generally involves completing a claim form at the local courthouse (or online where available), paying a modest filing fee, and formally notifying (serving) the other party — court staff or the court's website often have templates and instructions for each step.",
      es: "Presentar un caso en el tribunal de reclamos menores generalmente implica completar un formulario de demanda en el juzgado local (o en línea donde esté disponible), pagar una tarifa de presentación modesta y notificar formalmente (emplazar) a la otra parte; el personal del tribunal o su sitio web suelen tener plantillas e instrucciones para cada paso.",
      fr: "Déposer une plainte aux petites créances implique généralement de remplir un formulaire au tribunal local (ou en ligne si disponible), de payer des frais de dépôt modestes et de notifier formellement (signifier) l'autre partie — le personnel du tribunal ou son site web disposent souvent de modèles et d'instructions pour chaque étape.",
      ar: "يتضمن رفع دعوى في محكمة الدعاوى الصغيرة عادة تعبئة نموذج دعوى في المحكمة المحلية (أو عبر الإنترنت إن أمكن)، ودفع رسوم تقديم بسيطة، وإخطار الطرف الآخر رسميًا (التبليغ) — وغالبًا ما يوفر موظفو المحكمة أو موقعها الإلكتروني نماذج وتعليمات لكل خطوة.",
      pt: "Registrar uma ação no tribunal de pequenas causas geralmente envolve preencher um formulário de reclamação no fórum local (ou on-line, quando disponível), pagar uma taxa de registro modesta e notificar formalmente (citar) a outra parte — a equipe do tribunal ou seu site geralmente têm modelos e instruções para cada etapa.",
    }),
  },
  {
    id: "small-claims-statute-of-limitations",
    category: "small-claims",
    keywords: ["statute of limitations", "how long to sue", "deadline to file lawsuit", "time limit claim"],
    answer: withCaveat({
      en: "A statute of limitations is a deadline (often ranging from one to several years depending on the type of claim and jurisdiction) after which a lawsuit generally can no longer be filed — it's important to check the specific deadline for the type of claim early, since missing it can permanently bar the case.",
      es: "Un plazo de prescripción es una fecha límite (que suele oscilar entre uno y varios años según el tipo de reclamo y la jurisdicción) después de la cual generalmente ya no se puede presentar una demanda; es importante verificar el plazo específico para el tipo de reclamo cuanto antes, ya que perderlo puede impedir el caso de forma permanente.",
      fr: "Un délai de prescription est une échéance (souvent d'un à plusieurs ans selon le type de créance et la juridiction) après laquelle une action en justice ne peut généralement plus être intentée — il est important de vérifier tôt le délai précis pour ce type de créance, car le manquer peut définitivement empêcher l'action.",
      ar: "مدة التقادم هي أجل محدد (غالبًا ما يتراوح من سنة إلى عدة سنوات حسب نوع الدعوى والولاية القضائية) لا يمكن بعده عادة رفع دعوى قضائية — ومن المهم التحقق مبكرًا من الأجل المحدد لنوع الدعوى، لأن تفويته قد يمنع القضية نهائيًا.",
      pt: "Um prazo prescricional é um limite de tempo (geralmente de um a vários anos, dependendo do tipo de ação e da jurisdição) após o qual uma ação judicial geralmente não pode mais ser movida — é importante verificar cedo o prazo específico para o tipo de ação, pois perdê-lo pode impedir permanentemente o caso.",
    }),
  },

  // -------------------------------------------------------------- data-privacy
  {
    id: "privacy-personal-data-basics",
    category: "data-privacy",
    keywords: ["personal data", "data privacy", "what counts as personal data", "privacy rights"],
    answer: withCaveat({
      en: "Personal data typically includes any information that can identify a specific person — name, email, ID numbers, location, or online identifiers — and many privacy laws require companies to collect only what's needed, explain how it's used, and protect it with reasonable security.",
      es: "Los datos personales suelen incluir cualquier información que pueda identificar a una persona específica —nombre, correo electrónico, números de identificación, ubicación o identificadores en línea—; muchas leyes de privacidad exigen que las empresas recopilen solo lo necesario, expliquen cómo se usa y lo protejan con seguridad razonable.",
      fr: "Les données personnelles incluent généralement toute information permettant d'identifier une personne précise — nom, email, numéros d'identification, localisation ou identifiants en ligne — et de nombreuses lois sur la vie privée exigent que les entreprises ne collectent que le nécessaire, expliquent son usage et le protègent par une sécurité raisonnable.",
      ar: "تشمل البيانات الشخصية عادة أي معلومات يمكن أن تحدد هوية شخص معيّن — كالاسم أو البريد الإلكتروني أو أرقام الهوية أو الموقع أو المعرّفات عبر الإنترنت — وتلزم العديد من قوانين الخصوصية الشركات بجمع ما هو ضروري فقط، وشرح كيفية استخدامه، وحمايته بإجراءات أمنية معقولة.",
      pt: "Dados pessoais geralmente incluem qualquer informação que possa identificar uma pessoa específica — nome, e-mail, números de identificação, localização ou identificadores on-line — e muitas leis de privacidade exigem que as empresas coletem apenas o necessário, expliquem como é usado e o protejam com segurança razoável.",
    }),
  },
  {
    id: "privacy-data-breach-notification",
    category: "data-privacy",
    keywords: ["data breach", "hacked", "breach notification", "my data was leaked"],
    answer: withCaveat({
      en: "Many jurisdictions require a company to notify affected individuals within a set time after discovering a data breach involving personal information — affected people are often entitled to details about what was exposed and steps being taken, and sometimes to free credit monitoring.",
      es: "Muchas jurisdicciones exigen que una empresa notifique a las personas afectadas dentro de un plazo determinado tras descubrir una brecha de datos que involucre información personal; las personas afectadas suelen tener derecho a detalles sobre lo expuesto y las medidas tomadas, y a veces a monitoreo de crédito gratuito.",
      fr: "De nombreuses juridictions exigent qu'une entreprise informe les personnes concernées dans un délai fixé après avoir découvert une violation de données impliquant des informations personnelles — les personnes concernées ont souvent droit à des détails sur ce qui a été exposé et les mesures prises, et parfois à une surveillance de crédit gratuite.",
      ar: "تشترط العديد من الولايات القضائية على الشركة إخطار الأشخاص المتضررين خلال مدة محددة بعد اكتشاف اختراق بيانات يتعلق بمعلومات شخصية — ويحق للمتضررين غالبًا معرفة تفاصيل ما تم كشفه والإجراءات المتخذة، وأحيانًا الحصول على مراقبة ائتمانية مجانية.",
      pt: "Muitas jurisdições exigem que uma empresa notifique as pessoas afetadas dentro de um prazo definido após descobrir uma violação de dados envolvendo informações pessoais — as pessoas afetadas geralmente têm direito a detalhes sobre o que foi exposto e as medidas tomadas, e às vezes a monitoramento de crédito gratuito.",
    }),
  },
  {
    id: "privacy-right-to-access",
    category: "data-privacy",
    keywords: ["right to access my data", "request my data", "delete my data", "data subject request"],
    answer: withCaveat({
      en: "Under many modern privacy laws, an individual can request a copy of the personal data a company holds about them, ask for corrections, or request deletion — companies are usually required to respond within a set period, and repeatedly ignoring such a request can itself be a violation.",
      es: "Según muchas leyes de privacidad modernas, una persona puede solicitar una copia de los datos personales que una empresa tiene sobre ella, pedir correcciones o solicitar su eliminación; las empresas suelen estar obligadas a responder dentro de un plazo fijado, e ignorar repetidamente esa solicitud puede constituir en sí mismo una infracción.",
      fr: "En vertu de nombreuses lois modernes sur la vie privée, une personne peut demander une copie des données personnelles qu'une entreprise détient à son sujet, demander des corrections ou une suppression — les entreprises sont généralement tenues de répondre dans un délai fixé, et ignorer à répétition une telle demande peut constituer en soi une infraction.",
      ar: "بموجب العديد من قوانين الخصوصية الحديثة، يمكن للفرد طلب نسخة من بياناته الشخصية التي تحتفظ بها شركة ما، أو طلب تصحيحها، أو طلب حذفها — وعادة ما تُلزَم الشركات بالرد خلال مدة محددة، وقد يشكّل تجاهل هذا الطلب بشكل متكرر مخالفة بحد ذاته.",
      pt: "Sob muitas leis de privacidade modernas, um indivíduo pode solicitar uma cópia dos dados pessoais que uma empresa mantém sobre ele, pedir correções ou solicitar exclusão — as empresas geralmente são obrigadas a responder dentro de um prazo definido, e ignorar repetidamente tal solicitação pode, por si só, constituir uma violação.",
    }),
  },
];

/**
 * Regex-based clause risk flagging. Runs regardless of AI availability so
 * /analyze always has a working, non-AI path — mirrors the app-wide
 * principle that every feature has a working fallback with zero config.
 */
export const RISK_CLAUSE_PATTERNS: RiskClausePattern[] = [
  {
    id: "auto-renewal",
    label: "Automatic renewal",
    pattern: /(automatically\s+renew|auto[- ]renew|shall\s+renew\s+for\s+successive)/i,
    severity: "medium",
    explanation:
      "This clause renews the agreement automatically unless you actively cancel — missing the cancellation window can lock you in for another term.",
  },
  {
    id: "sole-discretion-termination",
    label: "Termination at sole discretion",
    pattern: /(sole\s+discretion|at\s+its\s+sole\s+and\s+absolute\s+discretion).{0,80}(terminat|cancel|end\s+this\s+agreement)/i,
    severity: "high",
    explanation:
      "This lets the other party end the agreement essentially whenever they want, with no requirement to show cause — it leaves you with little ability to object.",
  },
  {
    id: "indemnification",
    label: "Indemnification obligation",
    pattern: /(indemnify|indemnification|hold\s+harmless)/i,
    severity: "high",
    explanation:
      "This requires you to cover the other party's losses or legal costs in certain situations — it can create significant open-ended financial exposure.",
  },
  {
    id: "arbitration",
    label: "Mandatory arbitration",
    pattern: /(binding\s+arbitration|mandatory\s+arbitration|waive.{0,40}right\s+to\s+(a\s+)?jury\s+trial)/i,
    severity: "medium",
    explanation:
      "This requires disputes to go through private arbitration instead of court, and often waives your right to a jury trial or to join a class action.",
  },
  {
    id: "liquidated-damages",
    label: "Liquidated damages",
    pattern: /(liquidated\s+damages)/i,
    severity: "medium",
    explanation:
      "This sets a predetermined dollar amount you'd owe if you breach the agreement, regardless of the other party's actual loss — it can be much higher than real damages.",
  },
  {
    id: "broad-liability-waiver",
    label: "Broad liability waiver",
    pattern: /(waive[s]?\s+(any\s+and\s+)?all\s+(claims|liability)|no\s+liability\s+whatsoever|not\s+liable\s+for\s+any\s+(and\s+all\s+)?damages)/i,
    severity: "high",
    explanation:
      "This tries to release the other party from essentially all liability, even for their own negligence — such broad waivers are unenforceable in some jurisdictions but still worth flagging.",
  },
];
