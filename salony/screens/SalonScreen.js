import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from 'react-native';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import RatingStars from '../src/components/RatingStars';
import ServiceListItem from '../src/components/ServiceListItem';
import Button from '../src/components/Button';
import { useT } from '../src/i18n';

export default function SalonScreen({ route, navigation }) {
  const t = useT();
  const { salonId } = route.params;
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [selection, setSelection] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [estFavori, setEstFavori] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();

      const [{ data: s }, { data: svc }, { data: avis }, { data: fav }] = await Promise.all([
        supabase.from('salons').select('*').eq('id', salonId).single(),
        supabase.from('services').select('*').eq('salon_id', salonId).eq('actif', true).order('categorie'),
        supabase
          .from('reviews')
          .select('id, note, commentaire, created_at, reponse_pro, profiles(prenom)')
          .eq('salon_id', salonId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('favoris').select('salon_id').eq('client_id', user.id).eq('salon_id', salonId).maybeSingle(),
      ]);

      setSalon(s);
      setServices(svc ?? []);
      setReviews(avis ?? []);
      setEstFavori(!!fav);
    })();
  }, [salonId]);

  const basculerFavori = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setEstFavori((prev) => !prev); // mise à jour optimiste

    if (estFavori) {
      await supabase.from('favoris').delete().eq('client_id', user.id).eq('salon_id', salonId);
    } else {
      await supabase.from('favoris').insert({ client_id: user.id, salon_id: salonId });
    }
  };

  const toggleService = (service) => {
    setSelection((prev) =>
      prev.find((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    );
  };

  const dureeTotale = selection.reduce((acc, s) => acc + s.duree_min, 0);
  const prixTotal = selection.reduce((acc, s) => acc + Number(s.prix), 0);

  if (!salon) return null;

  return (
    <View style={styles.container}>
      <ScrollView>
        <View>
          <Image source={salon.photos?.[0] ? { uri: salon.photos[0] } : undefined} style={styles.image} />
          <Pressable onPress={basculerFavori} style={styles.favoriBtn} hitSlop={8}>
            <Text style={[styles.favoriIcone, estFavori && styles.favoriActif]}>
              {estFavori ? '♥' : '♡'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.body}>
          <Text style={styles.nom}>{salon.nom}</Text>
          <RatingStars note={salon.note_moyenne} nbAvis={salon.nb_avis} size={16} />
          <Text style={styles.adresse}>{salon.adresse}, {salon.ville}</Text>

          <Text style={styles.sectionTitre}>{t('salon.prestations')}</Text>
          {services.map((service) => (
            <ServiceListItem
              key={service.id}
              service={service}
              selected={!!selection.find((s) => s.id === service.id)}
              onToggle={toggleService}
            />
          ))}

          {reviews.length > 0 && (
            <>
              <Text style={styles.sectionTitre}>{t('salon.avisClients')}</Text>
              {reviews.map((avis) => (
                <View key={avis.id} style={styles.avis}>
                  <View style={styles.avisHeader}>
                    <Text style={styles.avisAuteur}>{avis.profiles?.prenom ?? t('salon.client')}</Text>
                    <Text style={styles.avisNote}>{'★'.repeat(avis.note)}</Text>
                  </View>
                  {avis.commentaire && <Text style={styles.avisTexte}>{avis.commentaire}</Text>}
                  {avis.reponse_pro && (
                    <Text style={styles.avisReponse}>{t('salon.reponseSalon')} {avis.reponse_pro}</Text>
                  )}
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {selection.length > 0 && (
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerPrix}>{t('commun.devise', { n: prixTotal })}</Text>
            <Text style={styles.footerDuree}>
              {t('commun.minutes', { n: dureeTotale })} · {t('salon.recapPrestations', { n: selection.length })}
            </Text>
          </View>
          <Button
            title={t('salon.choisirCreneau')}
            onPress={() => navigation.navigate('StaffSelect', { salonId, services: selection })}
            style={{ flex: 1, marginStart: spacing.md }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  image: { width: '100%', height: 220, backgroundColor: colors.surfaceAlt },
  body: { padding: spacing.md, gap: spacing.xs },
  nom: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.secondary },
  adresse: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.md },
  sectionTitre: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerPrix: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary },
  footerDuree: { fontSize: typography.size.xs, color: colors.textSecondary },
  favoriBtn: {
    position: 'absolute',
    top: spacing.md,
    end: spacing.md,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriIcone: { fontSize: 22, color: colors.textSecondary },
  favoriActif: { color: colors.primary },
  avis: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.xs },
  avisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avisAuteur: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  avisNote: { fontSize: typography.size.sm, color: colors.accent },
  avisTexte: { fontSize: typography.size.sm, color: colors.textSecondary },
  avisReponse: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    paddingStart: spacing.sm,
    borderStartWidth: 2,
    borderStartColor: colors.border,
  },
});
