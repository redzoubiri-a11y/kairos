import { useRef, useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme';
import useFavoriteToggle from '../hooks/useFavoriteToggle';

// Photo de restaurant standard de l'app — carrousel swipeable (si plusieurs photos),
// icônes partage/favori en haut à droite, compteur de photos en bas, toutes sur fond
// sombre translucide 55% — image toujours propre, aucun texte superposé.
// Utilisé sur : fiche restaurant, carte vedette Accueil, cartes compactes, bannière résa.
export default function PhotoCarouselHero({
  restaurant, height, onBack, showPrevArrow = false, emptyIcon = '🍽️', style,
}) {
  const photos = restaurant.photos?.length ? restaurant.photos : [];
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const scrollRef = useRef(null);
  const { isFav, favLoading, toggleFav } = useFavoriteToggle(restaurant.id);

  const goPrev = useCallback(() => {
    const i = Math.max(0, index - 1);
    setIndex(i);
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
  }, [index, width]);

  // Lien web et non `mida://` : celui qui recoit le message n'a pas forcement
  // l'app, et un schema d'application ne s'ouvre dans aucun navigateur -- dans
  // la plupart des messageries il n'est meme pas cliquable. Le partage servait
  // donc uniquement a ceux qui avaient deja Mida, soit l'inverse du but.
  // Le slug quand il existe, l'id sinon : les ecrans qui ne selectionnent pas
  // la colonne `slug` (cartes de l'Accueil, resultats de recherche) passent un
  // restaurant sans slug, et le lien doit rester valide.
  const handleShare = useCallback(() => {
    const lien = `https://app.mida-food.com/restaurant/${restaurant.slug || restaurant.id}`;
    Share.share({
      message: `🍽️ ${restaurant.name} sur MIDA\n${restaurant.address || restaurant.quartier || ''}\n\nRéserve ta table : ${lien}`,
      title: restaurant.name,
    });
  }, [restaurant]);

  return (
    <View style={[st.wrap, { height }, style]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {photos.length > 1 ? (
        <ScrollView
          ref={scrollRef}
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / (width || 1)))}
        >
          {photos.map((uri, i) => (
            <Image key={i} source={{ uri }} style={{ width, height }} resizeMode="cover" />
          ))}
        </ScrollView>
      ) : photos[0] ? (
        <Image source={{ uri: photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, st.placeholder]}>
          <Text style={{ fontSize: 48, opacity: 0.5 }}>{emptyIcon}</Text>
        </View>
      )}

      {!!onBack && (
        <TouchableOpacity style={st.iconBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <View style={st.topRight}>
        <TouchableOpacity style={st.iconBtnSm} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={st.iconBtnSm} onPress={toggleFav} disabled={favLoading}>
          <Text style={st.favTxt}>{favLoading ? '···' : isFav ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <View style={st.bottomRow}>
        {showPrevArrow && index > 0 && (
          <TouchableOpacity style={st.iconBtnSm} onPress={goPrev}>
            <Ionicons name="chevron-back" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        {photos.length > 0 && (
          <View style={st.countPill}>
            <Text style={st.countTxt}>{photos.length} photo{photos.length > 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap:        { overflow: 'hidden' },
  placeholder: { backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center' },

  iconBtn:   { position: 'absolute', top: spacing.lg, left: spacing.lg, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(10,10,10,0.55)', alignItems: 'center', justifyContent: 'center' },
  topRight:  { position: 'absolute', top: spacing.lg, right: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtnSm: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(10,10,10,0.55)', alignItems: 'center', justifyContent: 'center' },
  favTxt:    { fontSize: 14 },

  bottomRow: { position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md, flexDirection: 'row', alignItems: 'center' },
  countPill: { marginLeft: 'auto', backgroundColor: 'rgba(10,10,10,0.55)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 1 },
  countTxt:  { fontFamily: typography.bodySemibold, color: '#FFFFFF', fontSize: typography.size.caption },
});
