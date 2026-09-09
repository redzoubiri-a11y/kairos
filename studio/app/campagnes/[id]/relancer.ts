'use server';

/**
 * runCampaign() retraite TOUTES les pièces de la campagne, pas seulement
 * celles en échec — il n'y a pas de filtre sur `status` dans src/campaign.ts.
 * Relancer une campagne de sept restaurants dont un seul a échoué rappelle
 * donc le modèle sept fois, pas une. C'est pourquoi le bouton porte
 * l'avertissement dans la page plutôt que d'agir en silence : le coût est
 * réel (jetons Anthropic, secondes Remotion si la vidéo est demandée), et
 * rien ici ne le limite aux pièces qui en ont besoin.
 */

import { revalidatePath } from 'next/cache';
import { runCampaign } from '../../../src/campaign.ts';

export async function relancerCampagne(campaignId: string): Promise<void> {
  await runCampaign(campaignId);
  revalidatePath(`/campagnes/${campaignId}`);
}
