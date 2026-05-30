# MIDA — Design System

## Identité visuelle
- **Thème :** Dark · Chaleureux · Premium
- **Inspiration :** TheFork + Deliveroo + marché algérien
- **Ambiance :** Sombre avec accents dorés — évoque la chaleur des restaurants algériens la nuit

---

## Couleurs

| Token | Valeur | Usage |
|---|---|---|
| `colors.bg` | `#0F0D0B` | Fond principal de tous les écrans |
| `colors.card` | `#1A1714` | Fond des cartes et modales |
| `colors.cardBorder` | `#2A2520` | Bordures des cartes |
| `colors.accent` | `#E8A045` | CTA, étoiles, éléments actifs |
| `colors.accentSoft` | `rgba(232,160,69,0.12)` | Fond badges accent |
| `colors.accentDim` | `#C4863A` | Accent secondaire, gradients |
| `colors.text` | `#F0EBE3` | Texte principal |
| `colors.textMuted` | `#8A7F74` | Texte secondaire |
| `colors.textDim` | `#5A5148` | Texte tertiaire, placeholders |
| `colors.green` | `#4CAF82` | Succès, disponible, confirmé |
| `colors.greenSoft` | `rgba(76,175,130,0.12)` | Fond badges succès |
| `colors.red` | `#E05A5A` | Erreur, complet, annulation |
| `colors.redSoft` | `rgba(224,90,90,0.12)` | Fond badges erreur |
| `colors.blue` | `#5A9BE0` | Info, liens |
| `colors.purple` | `#9B7FE8` | Promotions spéciales |

---

## Typographie

| Usage | Taille | Poids | Couleur |
|---|---|---|---|
| Logo Mida | 36 | 900 | `accent` |
| Titre écran | 18–20 | 800 | `text` |
| Titre carte | 13–15 | 700 | `text` |
| Body | 12–13 | 400–500 | `textMuted` |
| Caption | 10–11 | 400 | `textDim` |
| Badge | 11 | 700 | variable |
| Bouton | 14 | 800 | variable |

---

## Composants à créer dans src/components/

### MButton
```jsx
// Variantes : primary | secondary | ghost | danger
// Props : variant, onPress, disabled, loading, small
<MButton variant="primary" onPress={handlePress}>
  Réserver une table →
</MButton>
```

### MTag
```jsx
// Props : variant (default|success|error|info|purple|muted), size (sm|md)
<MTag variant="success">✓ Dispo ce soir</MTag>
<MTag variant="error">✗ Complet</MTag>
<MTag variant="default">★ 4.7</MTag>
```

### MInput
```jsx
// Props : label, value, placeholder, icon, type, error, hint
<MInput
  label="Adresse email"
  value={email}
  placeholder="ton@email.com"
  icon="✉️"
  onChangeText={setEmail}
/>
```

### MCard (carte restaurant)
```jsx
// Props : restaurant, onPress, showPromo, horizontal
// restaurant : { name, quartier, cuisine, note, avis, prix, dispo, emoji, promo }
<MCard restaurant={resto} onPress={() => navigate('Restaurant', { id: resto.id })} />
```

### MToggle
```jsx
// Props : label, sub, value, onValueChange
<MToggle label="Notifications activées" value={notifs} onValueChange={setNotifs} />
```

### MHeader
```jsx
// Props : title, sub, showBack, onBack, rightComponent
<MHeader title="Le Tantra" showBack onBack={() => navigation.goBack()} />
```

### MStars
```jsx
// Props : rating (0-5), size (sm|md|lg), interactive, onRate
<MStars rating={4.7} size="md" />
```

### MLoader (Skeleton)
```jsx
// Props : width, height, borderRadius
<MLoader width="100%" height={100} borderRadius={14} />
```

### MNavBar (Tab bar)
```jsx
// Remplace la tab bar par défaut de React Navigation
// Utiliser dans App.js comme tabBar prop
```

---

## Règles de layout

**Padding écran :** 16px horizontal sur tous les écrans
**Gap entre cartes :** 10px
**Rayon des cartes :** 14px
**Rayon des boutons :** 14px
**Rayon des tags :** 20px (pill)
**Hauteur des boutons :** 50px (padding 14px vertical)
**Hauteur images restaurants :** 100–160px selon contexte

---

## Patterns UX importants

### Navigation
- Tous les headers : fond `bg`, texte `text`, flèche retour `textMuted`
- Pas de header natif React Navigation — utiliser MHeader custom

### États vides
- Toujours un emoji large (52–60px)
- Titre en `text` 16px bold
- Sous-titre en `textMuted` 12px
- Un bouton d'action primaire

### Chargement
- Skeleton cards avec `cardBorder` animé
- Jamais de spinner — toujours des skeletons

### Erreurs
- Fond `redSoft` + bordure `red` + icône ⚠️
- Message clair en `red` 12px bold
- Suggestion d'action en `textMuted`

### Succès / Confirmation
- Grand emoji centré (48–60px)
- Titre 20px black
- Récap dans une card `accent`-bordered
- Deux boutons : primaire + ghost

---

## Animations recommandées

```js
// Apparition d'écran
Animated.spring(opacity, { toValue: 1, useNativeDriver: true })

// Bouton pressé
Animated.spring(scale, { toValue: 0.96, useNativeDriver: true })

// Skeleton shimmer
Animated.loop(Animated.timing(shimmer, { toValue: 1, duration: 1000 }))
```

---

## Ce qu'il NE FAUT PAS faire

- ❌ Couleurs en dur (`#fff`, `'white'`, `'black'`)
- ❌ Tailles de police en dur sans passer par `typography.size`
- ❌ Marges/paddings aléatoires sans passer par `spacing`
- ❌ StyleSheet inline dans les composants partagés
- ❌ Modifier App.js ou supabase.js
- ❌ Supprimer des props ou callbacks existants
- ❌ Créer des doublons de composants existants
