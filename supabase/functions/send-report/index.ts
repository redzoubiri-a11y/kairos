import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Georgia, serif; max-width: 680px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a; background: #faf9f7; }
  h1 { letter-spacing: 4px; font-size: 22px; margin-bottom: 4px; color: #0F0D0B; }
  h2 { font-size: 17px; margin-top: 32px; margin-bottom: 12px; border-bottom: 1px solid #e8e0d4; padding-bottom: 6px; }
  .badge-ok  { background: #e8f5ee; color: #2e7d5e; border-radius: 4px; padding: 2px 8px; font-size: 13px; font-weight: bold; }
  .badge-fix { background: #fff3e0; color: #b45309; border-radius: 4px; padding: 2px 8px; font-size: 13px; font-weight: bold; }
  .badge-warn { background: #fef2f2; color: #c0392b; border-radius: 4px; padding: 2px 8px; font-size: 13px; font-weight: bold; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 14px; }
  td, th { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e8e0d4; }
  th { color: #888; font-weight: normal; width: 220px; }
  code { background: #f3ede4; padding: 2px 6px; border-radius: 3px; font-size: 13px; font-family: monospace; }
  .section { background: #fff; border: 1px solid #e8e0d4; border-radius: 8px; padding: 20px 24px; margin-bottom: 20px; }
  p { line-height: 1.7; color: #444; }
</style>
</head>
<body>
<h1>MIDA</h1>
<p style="color:#888;font-size:14px;margin-top:0;">Rapport d'audit codebase — 2 juin 2026</p>

<div class="section">
<h2>✅ Résumé</h2>
<table>
  <tr><th>Fichiers lus</th><td>~45 (tous les hooks, screens, composants, edge functions)</td></tr>
  <tr><th>Bugs corrigés</th><td><span class="badge-ok">11</span></td></tr>
  <tr><th>Problèmes non résolus</th><td><span class="badge-warn">1</span></td></tr>
  <tr><th>Edge functions auditées</th><td>5</td></tr>
</table>
</div>

<div class="section">
<h2>🔧 Bugs corrigés (11)</h2>

<p><strong>1–8 · <code>.single()</code> → <code>.maybeSingle()</code></strong><br>
PostgREST lève une erreur quand <code>.single()</code> ne trouve aucune ligne. Si l'utilisateur n'a pas encore de profil dans la table <code>users</code>, toute requête avec <code>.single()</code> faisait crasher silencieusement l'écran. Corrigé dans :</p>
<ul style="font-size:14px;line-height:2;">
  <li><code>useHomeData.js</code> (ligne 73)</li>
  <li><code>useFavoris.js</code> (ligne 39)</li>
  <li><code>useReservations.js</code> (lignes 51, 93, 111, 117, 167)</li>
  <li><code>useRestaurant.js</code> (ligne 129)</li>
  <li><code>useReservationForm.js</code> (ligne 99)</li>
  <li><code>useDeepLink.js</code> (ligne 16)</li>
  <li><code>useNotifications.js</code> (ligne 65)</li>
</ul>

<p><strong>9 · <code>useRestaurant.js</code> — <code>useEffect</code> sans dépendances</strong><br>
Le <code>useEffect</code> utilisait <code>restaurant.id</code> dans son corps mais avait <code>[]</code> comme tableau de dépendances. Si le composant recevait un nouveau restaurant (navigation directe entre fiches), les données (favoris, avis) ne se rechargaient pas. Corrigé : dépendances → <code>[restaurant.id]</code>.</p>

<p><strong>10 · <code>useReservationForm.js</code> — <code>onSuccess</code> absent des dépendances</strong><br>
Le callback <code>confirmer</code> appelait <code>onSuccess()</code> mais <code>onSuccess</code> n'était pas dans son tableau de dépendances <code>useCallback</code>. Cela pouvait causer une fermeture obsolète (stale closure) si le callback changeait entre deux rendus. Corrigé : ajout de <code>onSuccess</code> dans les deps.</p>

<p><strong>11 · <code>useNotifications.js</code> — type <code>review_request</code> absent de <code>TYPE_CFG</code></strong><br>
Le hook <code>useComptoir.js</code> insère des notifications de type <code>review_request</code> quand un client arrive, mais <code>TYPE_CFG</code> dans <code>useNotifications.js</code> ne connaissait que <code>review_ask</code>. Ces notifications s'affichaient sans icône ni couleur, et n'étaient pas comptabilisées dans les badges "Rappels". Corrigé : ajout de <code>review_request</code> dans <code>TYPE_CFG</code>.</p>
</div>

<div class="section">
<h2>⚠️ Problème non résolu (1)</h2>
<p><strong>notify-pro-request — champ <code>name</code> inexistant</strong><br>
La fonction edge <code>notify-pro-request/index.ts</code> utilise <code>record.name</code> et <code>record.email</code> mais la table <code>pro_requests</code> stocke <code>first_name</code>, <code>last_name</code> (sans champ <code>name</code>) et l'email n'est pas dans la table. Cette fonction semble être une ancienne version déclenchée par webhook Supabase, désormais remplacée par <code>pro-inscription</code>.<br><br>
<strong>Action recommandée :</strong> Vérifier dans le dashboard Supabase → Database Webhooks si un webhook pointe encore vers <code>notify-pro-request</code>. Si oui, le supprimer (la fonction <code>pro-inscription</code> gère déjà l'envoi des emails admin + candidat).</p>
</div>

<div class="section">
<h2>✅ Code sain — aucun bug</h2>
<p>Les fichiers suivants ont été audités et ne contiennent aucun bug :</p>
<p style="font-size:13px;color:#666;line-height:2;">
App.js · supabase.js · src/theme.js · AuthScreen.js · useAuth.js · HomeScreen.js · ReservationScreen.js · RestaurantScreen.js · useDashboard.js · useProfil.js · useSearch.js · useProAvis.js · useExplorer.js · useMapScreen.js · useProPromos.js · useOnboarding.js · useAide.js · useSettings.js · useComptoir.js · useProInscription.js · usePushNotifications.js · approve-pro · reject-pro · pro-inscription · push-manager · tous les composants src/components/
</p>
</div>

<div class="section">
<h2>📌 Fonctions edge — état actuel</h2>
<table>
  <tr><th>Fonction</th><th>Statut</th><th>Note</th></tr>
  <tr><td><code>approve-pro</code></td><td><span class="badge-ok">OK</span></td><td>Flux text/plain 2 étapes ✓</td></tr>
  <tr><td><code>reject-pro</code></td><td><span class="badge-ok">OK</span></td><td>Flux text/plain 2 étapes ✓</td></tr>
  <tr><td><code>pro-inscription</code></td><td><span class="badge-ok">OK</span></td><td>Emails admin + candidat ✓</td></tr>
  <tr><td><code>push-manager</code></td><td><span class="badge-ok">OK</span></td><td>Expo Push Notifications ✓</td></tr>
  <tr><td><code>notify-pro-request</code></td><td><span class="badge-warn">À vérifier</span></td><td>Ancienne version, potentiellement inutilisée</td></tr>
  <tr><td><code>send-doc</code></td><td><span class="badge-warn">Temporaire</span></td><td>Peut être supprimée (usage unique)</td></tr>
</table>
</div>

<p style="color:#aaa;font-size:12px;margin-top:32px;border-top:1px solid #e8e0d4;padding-top:16px;">
  Rapport généré automatiquement · MIDA Audit · Claude Code
</p>
</body>
</html>`;

Deno.serve(async () => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MIDA <onboarding@resend.dev>",
      to: ["red.zoubiri@gmail.com"],
      subject: "MIDA — Rapport d'audit codebase (11 bugs corrigés)",
      html,
    }),
  });
  const data = await res.json();
  return new Response(JSON.stringify({ ok: true, data }), {
    headers: { "Content-Type": "application/json" },
  });
});
