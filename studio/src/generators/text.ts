/**
 * Section 3.3 — génération du texte d'une campagne.
 *
 * ⚠️ Le schéma de sortie est INFÉRÉ (voir l'avertissement de src/types.ts).
 * Les clés sont en anglais parce qu'elles forment un contrat entre modules ;
 * le contenu, lui, est exclusivement en français : c'est la langue de l'app,
 * de ses restaurateurs et de ses clients.
 *
 * Deux garde-fous, parce qu'un texte marketing faux coûte plus cher qu'un texte
 * absent :
 *   1. la sortie est contrainte par le modèle (output_config.format) ;
 *   2. elle est revalidée localement, longueurs comprises, avec UNE reprise si
 *      elle sort du cadre. La contrainte de format garantit la forme, pas le
 *      respect d'un « 42 signes maximum ».
 */

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { anthropicApiKey, TEXT_MODEL } from '../config.ts';
import type { AppEntity } from '../types.ts';

/** Version du prompt, écrite en base avec chaque génération. */
export const PROMPT_VERSION = 'mida-fr-1';

/**
 * Les longueurs ne sont pas décoratives : `headline` et `subline` sont posées
 * dans un carré de 1080 px par un gabarit qui ne sait pas se réduire. Au-delà,
 * le texte déborde du visuel.
 */
export const CampaignCopySchema = z.object({
  headline: z
    .string()
    .min(8)
    .max(42)
    .describe("Accroche du visuel, 42 signes maximum, sans point final"),
  subline: z
    .string()
    .min(10)
    .max(70)
    .describe('Sous-titre du visuel, 70 signes maximum'),
  badge: z
    .string()
    .min(3)
    .max(22)
    .describe("Étiquette courte du visuel : un fait, pas un slogan"),
  caption: z
    .string()
    .min(120)
    .max(700)
    .describe('Le texte de la publication, 120 à 700 signes'),
  hashtags: z
    .array(z.string().regex(/^#[\p{L}\p{N}_]{2,28}$/u))
    .min(3)
    .max(6)
    .describe('3 à 6 mots-dièse, accent compris, sans espace'),
  call_to_action: z
    .string()
    .min(6)
    .max(60)
    .describe("Appel à l'action, 60 signes maximum"),
  alt_text: z
    .string()
    .min(20)
    .max(200)
    .describe("Description du visuel pour les personnes qui ne le voient pas"),
});

export type CampaignCopy = z.infer<typeof CampaignCopySchema>;

const SYSTEM_PROMPT = `Tu écris les textes marketing de Mida, l'application algérienne de réservation de restaurants.

LANGUE
Français uniquement. Pas un mot d'anglais, y compris dans les mots-dièse — « #ReserverAAlger », jamais « #FoodLover ». Le français d'Algérie : « réserver une table », pas « booker ».

CE QUE TU PEUX ÉCRIRE
Uniquement ce que les données fournies contiennent. Tu n'as pas d'autre source, et tu n'as pas le droit d'en inventer une :
- pas de note, de nombre d'avis, de prix ni de capacité qui ne soit dans les données ;
- pas de promotion qui ne soit dans les données, et jamais une promotion « bientôt » ou « peut-être » ;
- pas de plat, de chef, d'année d'ouverture, de récompense ni d'ambiance que les données n'attestent pas ;
- si les données sont pauvres, écris court et vrai plutôt que long et décoré.

Un fait absent n'est pas une invitation à le supposer. Une accroche fade et exacte vaut mieux qu'une accroche brillante et fausse : le restaurateur lit la publication, et c'est son établissement qui est nommé.

TON
Direct, concret, adulte. Tu parles à quelqu'un qui cherche où dîner ce soir, pas à une audience.
- Pas de superlatif creux : ni « incontournable », ni « véritable pépite », ni « expérience unique ».
- Pas de question rhétorique en ouverture.
- Au plus une émoji dans la publication, aucune dans le visuel.
- Le nom du restaurant apparaît tel qu'il est écrit dans les données, sans le retoucher.

STRUCTURE
- headline : ce qui donne envie, en un souffle. Un fait ou une image, pas le nom du restaurant.
- subline : le nom du restaurant et son quartier ou sa ville.
- badge : un fait vérifiable et court — « Terrasse », « Vue sur la baie » seulement si les données le disent, sinon le type de cuisine.
- caption : deux ou trois phrases. Ce qu'on y mange, où c'est, pourquoi y aller ce soir.
- call_to_action : la réservation sur Mida.
- alt_text : décris la photo telle qu'elle est probablement — le restaurant, sa cuisine, son cadre — sans affirmer de détail visuel que tu ne peux pas connaître.`;

function factsFor(entity: AppEntity): string {
  const lines: string[] = [];
  const add = (label: string, value: unknown) => {
    if (value === null || value === undefined || value === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    lines.push(`${label} : ${Array.isArray(value) ? value.join(', ') : String(value)}`);
  };

  add('Nom', entity.name);
  add('Ville', entity.city);
  add('Quartier', entity.neighbourhood);
  add('Cuisine', entity.cuisine);
  add('Description fournie par le restaurant', entity.description);
  add('Note moyenne sur 5', entity.rating);
  add("Nombre d'avis", entity.reviewCount);
  add('Ticket moyen en DA', entity.averageTicket);
  add('Couverts', entity.capacity);
  add('Équipements vérifiés', entity.amenities);

  if (entity.promotions.length > 0) {
    lines.push('Promotions en cours :');
    for (const p of entity.promotions) {
      const value =
        p.percentValue !== null
          ? `-${p.percentValue} %`
          : p.fixedValue !== null
            ? `-${p.fixedValue} DA`
            : p.type;
      lines.push(`  - ${p.title} (${value})${p.endDate ? `, jusqu'au ${p.endDate}` : ''}`);
    }
  }

  if (entity.reviews.length > 0) {
    lines.push("Avis clients approuvés (à ne pas citer mot pour mot sans le dire) :");
    for (const r of entity.reviews) {
      lines.push(`  - ${r.rating}/5 — ${r.comment}`);
    }
  }

  // Ce que le restaurant n'a PAS autorisé est dit explicitement : sans ça, le
  // modèle lit un silence comme une absence de donnée et brode pour compenser.
  const missing: string[] = [];
  if (!entity.consent.scopes.includes('promotions')) missing.push('promotions');
  if (!entity.consent.scopes.includes('reviews')) missing.push('avis clients');
  if (missing.length > 0) {
    lines.push(
      `\nNon communiqué (accord non donné, ne pas y faire allusion) : ${missing.join(', ')}.`,
    );
  }

  return lines.join('\n');
}

export interface GenerateTextOptions {
  entity: AppEntity;
  /** L'intention de la campagne, en clair. Reprise telle quelle dans le prompt. */
  objective: string;
  client?: Anthropic;
}

export interface GeneratedText {
  copy: CampaignCopy;
  model: string;
  promptVersion: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
  /** Vrai si une reprise a été nécessaire — utile à suivre dans le temps. */
  repaired: boolean;
}

export async function generateText(
  options: GenerateTextOptions,
): Promise<GeneratedText> {
  const { entity, objective } = options;

  if (!entity.consent.granted) {
    throw new Error(
      `« ${entity.name} » n'a pas donné son accord de communication : aucun texte ne sera écrit.`,
    );
  }

  const client =
    options.client ?? new Anthropic({ apiKey: anthropicApiKey() });

  const userPrompt = [
    `Objectif de la campagne : ${objective}`,
    '',
    'Données du restaurant — la seule source autorisée :',
    factsFor(entity),
  ].join('\n');

  const started = Date.now();
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userPrompt },
  ];

  let repaired = false;
  let inputTokens: number | null = null;
  let outputTokens: number | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await client.messages.parse({
      model: TEXT_MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages,
      output_config: { format: zodOutputFormat(CampaignCopySchema) },
    });

    inputTokens = response.usage.input_tokens ?? null;
    outputTokens = response.usage.output_tokens ?? null;

    if (response.stop_reason === 'refusal') {
      throw new Error(
        `Le modèle a refusé d'écrire pour « ${entity.name} » ` +
          `(${response.stop_details?.category ?? 'sans catégorie'}).`,
      );
    }

    // La contrainte de format garantit la forme du JSON, pas les longueurs.
    const parsed = CampaignCopySchema.safeParse(response.parsed_output);
    if (parsed.success) {
      return {
        copy: parsed.data,
        model: response.model,
        promptVersion: PROMPT_VERSION,
        inputTokens,
        outputTokens,
        latencyMs: Date.now() - started,
        repaired,
      };
    }

    if (attempt === 1) {
      throw new Error(
        `Sortie invalide pour « ${entity.name} » après reprise : ` +
          parsed.error.issues
            .map((i) => `${i.path.join('.')} — ${i.message}`)
            .join(' ; '),
      );
    }

    repaired = true;
    messages.push(
      { role: 'assistant', content: JSON.stringify(response.parsed_output) },
      {
        role: 'user',
        content:
          'Ce rendu sort du cadre. Corrige uniquement ces points, sans rien inventer de neuf :\n' +
          parsed.error.issues
            .map((i) => `- ${i.path.join('.')} : ${i.message}`)
            .join('\n'),
      },
    );
  }

  // Inatteignable : la boucle sort par return ou par throw.
  throw new Error('Génération de texte : état impossible.');
}
