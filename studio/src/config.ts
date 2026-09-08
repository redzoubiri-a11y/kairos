/**
 * Lecture de l'environnement.
 *
 * Chaque secret est réclamé au moment où il sert, pas au chargement du module :
 * le serveur MCP doit pouvoir lister les applications sans clé Anthropic, et le
 * rendu d'un visuel n'a pas besoin d'accéder à Mida.
 */

function required(name: string, why: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Variable d'environnement manquante : ${name} — ${why}. ` +
        `Voir .env.example.`,
    );
  }
  return value.trim();
}

/** Projet Supabase du studio : le seul où l'on écrit. */
export function studioSupabase(): { url: string; serviceRoleKey: string } {
  return {
    url: required('STUDIO_SUPABASE_URL', 'projet Supabase du studio'),
    serviceRoleKey: required(
      'STUDIO_SUPABASE_SERVICE_ROLE_KEY',
      'clé service_role du projet studio, serveur uniquement',
    ),
  };
}

/** Base Mida, en lecture seule, via le rôle studio_reader. */
export function midaDatabaseUrl(): string {
  return required(
    'MIDA_DB_URL',
    'chaîne Postgres du rôle studio_reader sur le projet Kairos',
  );
}

export function anthropicApiKey(): string {
  return required('ANTHROPIC_API_KEY', 'génération de texte');
}

/**
 * Le modèle est surchargeable, mais le défaut est explicite : une campagne
 * produite hier et rejouée demain doit sortir du même modèle tant que personne
 * n'a décidé le contraire.
 */
export const TEXT_MODEL = process.env.STUDIO_TEXT_MODEL?.trim() || 'claude-opus-5';
