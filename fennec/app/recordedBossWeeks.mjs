/**
 * Fennec — semaines dont le Boss demande un enregistrement audio de
 * l'enfant, telles que spécifiées par les curriculums (pas une décision
 * prise ici : chaque entrée est le prompt exact du document source).
 *
 * docs/curriculum-foundations-semaine-par-semaine.md : S12, S16, S32
 * (section "Preuves" — "3 enregistrements audio datés (S12, S16, S32)").
 * docs/curriculum-builder-semaine-par-semaine.md : chaque Boss de B1 à B8
 * (S36, S40, S44, S48, S52, S56, S60, S64) précise "enregistré".
 *
 * C'était la seule pièce du produit décrite dans l'analyse stratégique
 * (§4.4 : "le parent qui entend son enfant parler anglais devient le
 * meilleur canal d'acquisition") qui n'avait jamais été implémentée —
 * chaque Boss réel ne faisait jusqu'ici que du texte/QCM.
 */

const RECORDED_BOSS_WEEKS = {
  12: 'سجّل نفسك تقدّم عائلتك بالإنجليزية — كما فعلت في تحدي الزعيم',
  16: 'سجّل نفسك تجيب على أسئلة الطبيب فينيك بالإنجليزية',
  32: 'سجّل 90 ثانية بالإنجليزية: عرّف بنفسك، بعائلتك، بما تحبه، وبما تعرف فعله',
  36: 'سجّل نفسك تحكي 3-4 جمل عمّا فعلته أمس أو الأسبوع الماضي',
  40: 'سجّل نفسك تصف وتقارن 2-3 حيوانات من الصحراء',
  44: 'سجّل نفسك تعطي اتجاهات بسيطة من مكان إلى آخر',
  48: 'سجّل نفسك تحكي عن 2-3 مشاريع مستقبلية',
  52: 'سجّل نفسك تحكي قصة قصيرة من اختيارك',
  56: 'سجّل نفسك تعطي رأيين مع سبب لكل واحد',
  60: 'سجّل نفسك تقدّم بلدك في 3-4 جمل',
  64: 'سجّل نفسك حوالي دقيقتين بالإنجليزية: قصة بالماضي، مقارنة، رأي مبرَّر، مشروع مستقبلي، وتقديم بلدك',
};

function recordingPromptFor(week) {
  return RECORDED_BOSS_WEEKS[week] ?? null;
}

export { RECORDED_BOSS_WEEKS, recordingPromptFor };
