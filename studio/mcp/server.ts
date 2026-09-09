/**
 * Serveur MCP de Kairos Studio.
 *
 * Cinq outils, et une règle qui les traverse : rien de ce qui est exposé ici ne
 * peut écrire sur une base applicative. Les trois premiers lisent, les deux
 * derniers n'écrivent que dans le projet studio et son Storage.
 *
 * Transport stdio : le serveur est lancé par le client MCP, pas par le réseau.
 * Aucun secret ne transite — ils viennent de l'environnement du processus.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { studioDb } from '../src/db.ts';
import { connectorKeys, openConnector } from '../src/connectors/registry.ts';
import {
  createCampaign,
  previewCampaign,
  runCampaign,
} from '../src/campaign.ts';

const server = new McpServer({ name: 'kairos-studio', version: '0.1.0' });

/** Réponse texte : le contenu MCP est du texte, la structure passe en JSON lisible. */
const asText = (payload: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
});

const asError = (error: unknown) => ({
  isError: true,
  content: [
    {
      type: 'text' as const,
      text: error instanceof Error ? error.message : String(error),
    },
  ],
});

server.registerTool(
  'list_apps',
  {
    title: 'Lister les applications connectées',
    description:
      "Applications que le studio sait lire, avec l'état de leur connecteur. " +
      "Un connecteur « indisponible » signale une variable d'environnement " +
      'manquante ou une base injoignable, pas une application inexistante.',
    inputSchema: {},
  },
  async () => {
    try {
      const { data, error } = await studioDb()
        .from('apps')
        .select('key, name, connector, is_active')
        .order('key');
      if (error) throw new Error(error.message);

      const apps = [];
      for (const app of data ?? []) {
        let health: unknown = { ok: false, details: 'connecteur non enregistré' };
        if (connectorKeys().includes(app.connector as string)) {
          const connector = openConnector(app.connector as string);
          try {
            health = await connector.check();
          } catch (e) {
            health = {
              ok: false,
              details: e instanceof Error ? e.message : String(e),
            };
          } finally {
            await connector.close().catch(() => {});
          }
        }
        apps.push({ ...app, connector_health: health });
      }
      return asText({ apps });
    } catch (error) {
      return asError(error);
    }
  },
);

server.registerTool(
  'find_entities',
  {
    title: 'Chercher des entités dans une application',
    description:
      "Recherche dans la base d'une application, en lecture seule. " +
      'Par défaut, seules les entités ayant donné leur accord de communication ' +
      'sont rendues — mettre consented_only à false sert à mesurer le reste à ' +
      'aller chercher, pas à produire.',
    inputSchema: {
      app: z.string().describe("Clé de l'application, par exemple « mida »"),
      search: z.string().optional().describe('Recherche libre sur le nom'),
      city: z.string().optional(),
      cuisine: z.string().optional(),
      consented_only: z.boolean().optional().default(true),
      min_photos: z.number().int().min(0).optional(),
      limit: z.number().int().min(1).max(200).optional().default(25),
    },
  },
  async (args) => {
    const connector = openConnector(args.app);
    try {
      const health = await connector.check();
      if (!health.ok) throw new Error(health.details);

      const results = await connector.find({
        kind: 'restaurant',
        search: args.search,
        city: args.city,
        cuisine: args.cuisine,
        consentedOnly: args.consented_only,
        minPhotos: args.min_photos,
        limit: args.limit,
      });
      return asText({ count: results.length, entities: results });
    } catch (error) {
      return asError(error);
    } finally {
      await connector.close().catch(() => {});
    }
  },
);

server.registerTool(
  'inspect_entity',
  {
    title: 'Lire la fiche complète d’une entité',
    description:
      'Fiche normalisée : faits, photos, promotions et avis, dans la limite de ' +
      "ce que l'accord de communication autorise. Ce qui n'est pas autorisé " +
      "n'est pas rendu vide, il est absent.",
    inputSchema: {
      app: z.string(),
      external_id: z.string().describe("Identifiant de l'entité dans la base source"),
    },
  },
  async (args) => {
    const connector = openConnector(args.app);
    try {
      const health = await connector.check();
      if (!health.ok) throw new Error(health.details);

      const entity = await connector.get('restaurant', args.external_id);
      if (!entity) {
        throw new Error(
          `Aucune entité « ${args.external_id} » dans « ${args.app} » ` +
            '(inexistante, ou fiche non active).',
        );
      }
      return asText(entity);
    } catch (error) {
      return asError(error);
    } finally {
      await connector.close().catch(() => {});
    }
  },
);

server.registerTool(
  'create_campaign',
  {
    title: 'Créer une campagne',
    description:
      'Crée la campagne et fige un instantané des entités retenues. ' +
      'Produit un visuel carré 1080², et une story 1080×1920 de 6 s si le ' +
      'format vidéo est demandé — tous deux à partir du même texte. ' +
      'Français ou arabe, au choix — la mise en page se retourne pour ' +
      "l'arabe. Les entités sans accord de communication sont écartées et nommées dans " +
      'la réponse. Avec run à true, les pièces sont produites dans la foulée : ' +
      'un texte et un visuel par entité, déposés dans le Storage du studio.',
    inputSchema: {
      app: z.string(),
      slug: z
        .string()
        .regex(/^[a-z0-9-]{3,60}$/)
        .describe('Identifiant court, minuscules et tirets. Rejouer le même écrase.'),
      name: z.string(),
      objective: z
        .string()
        .min(10)
        .describe("L'intention de la campagne, en clair — elle entre dans le prompt"),
      external_ids: z.array(z.string()).min(1).max(50),
      formats: z
        .array(z.enum(['image', 'video']))
        .optional()
        .describe(
          "Formats produits. Défaut : l'image seule. La vidéo coûte une " +
            "trentaine de secondes par entité contre moins d'une pour l'image — " +
            'sept fondateurs, c\'est dix secondes ou quatre minutes.',
        ),
      locale: z
        .enum(['fr', 'ar'])
        .optional()
        .describe(
          'Langue de la campagne, décidée à sa création : elle traverse ' +
            "l'invite, le texte, la police du visuel et le sens de lecture. " +
            'Défaut : le français. Une campagne ne mélange pas les deux — deux ' +
            'langues, deux campagnes.',
        ),
      run: z.boolean().optional().default(false),
    },
  },
  async (args) => {
    try {
      const created = await createCampaign({
        appKey: args.app,
        slug: args.slug,
        name: args.name,
        objective: args.objective,
        externalIds: args.external_ids,
        formats: args.formats,
        locale: args.locale,
      });

      if (!args.run) return asText(created);

      const run = await runCampaign(created.campaignId);
      return asText({ ...created, ...run });
    } catch (error) {
      return asError(error);
    }
  },
);

server.registerTool(
  'preview_campaign',
  {
    title: 'Relire une campagne',
    description:
      'Rend, pour chaque pièce, son état, son texte et des URL signées vers son ' +
      "visuel et sa vidéo. Les seaux sont privés : les URL expirent au bout " +
      "d'une heure.",
    inputSchema: {
      campaign_id: z.string().uuid(),
    },
  },
  async (args) => {
    try {
      return asText(await previewCampaign(args.campaign_id));
    } catch (error) {
      return asError(error);
    }
  },
);

await server.connect(new StdioServerTransport());
