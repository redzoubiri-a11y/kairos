#!/usr/bin/env node
/**
 * Compare des offres fournisseurs ou sous-traitants sur base identique.
 *
 *   node artizon/cli/comparer.js artizon/exemples/consultation-platrerie.json
 */

import { readFile } from 'node:fs/promises';
import { comparerOffres } from '../src/core/comparatif.js';
import { formaterComparatif } from '../src/rendu.js';

const fichier = process.argv[2];
if (!fichier) {
  console.error('Usage : node artizon/cli/comparer.js <consultation.json>');
  process.exit(2);
}

const config = JSON.parse(await readFile(fichier, 'utf8'));
console.log(formaterComparatif(comparerOffres(config)));
