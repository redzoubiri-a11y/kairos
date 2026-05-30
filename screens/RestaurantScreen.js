import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Platform, StatusBar as RNStatusBar, Dimensions,
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Animated,
} from 'react-native';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';

const SW   = Dimensions.get('window').width;
const HERO = 310;
const TOP  = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 10 : 16;

const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️',
};

const CUISINE_DESC = {
  algerien:     "Une cuisine généreuse ancrée dans la tradition berbère et arabe — couscous, tajines, bourek et pâtisseries au miel qui racontent l'histoire d'un pays.",
  mediterraneen:"Des saveurs fraîches de la mer, de l'huile d'olive et des herbes aromatiques. Chaque plat évoque les rivages ensoleillés de la Méditerranée.",
  italien:      "Pasta al dente, pizzas sorties du four à bois, burrata crémeuse... une invitation à la dolce vita dans le respect des recettes d'antan.",
  fast_casual:  "Rapide, savoureux et accessible. Une cuisine du quotidien sans compromis sur la qualité des ingrédients.",
  japonais:     "Précision et élégance dans chaque bouchée. Sushis, ramen et yakitori préparés dans le respect de la tradition nippone.",
  turc:         "Kebabs au charbon, mezzés colorés et thé à la tulipe — la chaleur de l'hospitalité ottomane dans votre assiette.",
  libanais:     "Un festin de mezzés, de grillades et de pains croustillants. La générosité du Liban à chaque table.",
  francais:     "La grande tradition gastronomique française revisitée avec subtilité — sauces, terrines et desserts à la française.",
  autre:        "Une cuisine éclectique et créative, portée par la passion du chef et la qualité des produits locaux.",
};

const MENUS = {
  algerien: [
    { cat:'Entrées', items:[
      { nom:'Chorba frik',      prix:450,  desc:'Soupe traditionnelle au blé vert', popular:true },
      { nom:'Bourek au thon',   prix:380,  desc:'Feuilles de brick croustillantes' },
      { nom:'Salade méchouia',  prix:320,  desc:'Tomates grillées, poivrons, ail' },
    ]},
    { cat:'Plats', items:[
      { nom:'Couscous royal',   prix:1800, desc:'Semoule, légumes, merguez et poulet', popular:true },
      { nom:"Mechoui d'agneau", prix:2200, desc:'Agneau rôti aux herbes et épices' },
      { nom:'Chakhchoukha',     prix:1600, desc:'Pain maison, sauce tomate et poulet' },
      { nom:'Tajine zitoune',   prix:1900, desc:'Poulet aux olives et citron confit', popular:true },
    ]},
    { cat:'Desserts', items:[
      { nom:'Baklawa',      prix:350, desc:'Pâtisserie orientale au miel et amandes', popular:true },
      { nom:'Zalabia',      prix:280, desc:"Beignets au sirop de fleur d'oranger" },
      { nom:'Kalb el louz', prix:300, desc:"Gâteau de semoule à la fleur d'oranger" },
    ]},
    { cat:'Boissons', items:[
      { nom:'Thé à la menthe', prix:150, desc:'Thé vert, menthe fraîche, pignons' },
      { nom:'Jus de grenade',  prix:250, desc:'Pressé frais de saison' },
    ]},
  ],
  mediterraneen: [
    { cat:'Entrées', items:[
      { nom:'Houmous maison', prix:480, desc:"Pois chiches, tahini, citron, huile d'olive", popular:true },
      { nom:'Salade grecque', prix:420, desc:'Tomates, concombre, feta, olives' },
      { nom:'Calamars frits', prix:650, desc:'Friture légère, aïoli citronné' },
    ]},
    { cat:'Plats', items:[
      { nom:'Loup de mer grillé',        prix:2800, desc:'Poisson entier, herbes, citron', popular:true },
      { nom:"Crevettes à l'ail",         prix:2400, desc:'Gambas, beurre, persil, ail' },
      { nom:'Risotto aux fruits de mer', prix:2200, desc:'Crevettes, moules, calmar' },
    ]},
    { cat:'Desserts', items:[
      { nom:'Tiramisu',        prix:480, desc:'Mascarpone, café, cacao', popular:true },
      { nom:'Baklava au miel', prix:380, desc:'Feuilletage, noix, sirop de miel' },
    ]},
  ],
  italien: [
    { cat:'Antipasti', items:[
      { nom:'Bruschetta al pomodoro', prix:420, desc:'Pain grillé, tomates fraîches, basilic' },
      { nom:'Burrata',                prix:680, desc:'Burrata crémeuse, tomates cerises, roquette', popular:true },
    ]},
    { cat:'Pasta', items:[
      { nom:'Spaghetti carbonara',  prix:1600, desc:'Guanciale, œuf, pecorino, poivre noir', popular:true },
      { nom:'Tagliatelle al ragù',  prix:1700, desc:"Pâtes fraîches, ragù de bœuf à l'ancienne" },
      { nom:"Penne all'arrabbiata", prix:1400, desc:'Tomates, piment, ail, basilic' },
    ]},
    { cat:'Pizza', items:[
      { nom:'Margherita',       prix:1400, desc:'Tomate, mozzarella fior di latte, basilic', popular:true },
      { nom:'Quattro stagioni', prix:1700, desc:'Jambon, champignons, artichaut, olives' },
      { nom:'Diavola',          prix:1600, desc:'Tomate, mozzarella, salami piquant' },
    ]},
    { cat:'Dolci', items:[
      { nom:'Tiramisù classico', prix:500, desc:'Mascarpone, café, savoiardi, cacao', popular:true },
      { nom:'Panna cotta',       prix:420, desc:'Crème vanille, coulis de fruits rouges' },
    ]},
  ],
  default: [
    { cat:'Entrées', items:[
      { nom:'Soupe du jour', prix:380, desc:'Selon la saison et le marché' },
      { nom:'Salade maison', prix:420, desc:'Fraîche et colorée' },
    ]},
    { cat:'Plats', items:[
      { nom:'Plat du chef',     prix:1800, desc:'Suggestion du chef, faite maison', popular:true },
      { nom:'Grillades mixtes', prix:2200, desc:'Viandes grillées, légumes de saison' },
    ]},
    { cat:'Desserts', items:[
      { nom:'Dessert maison', prix:400, desc:'Selon inspiration du pâtissier' },
    ]},
    { cat:'Boissons', items:[
      { nom:'Eau minérale', prix:100, desc:'50cl ou 1L' },
      { nom:'Jus de fruits', prix:250, desc:'Frais du jour' },
    ]},
  ],
};

const MOCK_AVIS = [
  { id:'m1', nom:'Karim B.',   note:5, date:'12 mai 2026', txt:'Excellent ! Service impeccable, on reviendra sans hésiter.' },
  { id:'m2', nom:'Amira M.',   note:4, date:'8 mai 2026',  txt:'Très bonne cuisine, ambiance chaleureuse. Je recommande.' },
  { id:'m3', nom:'Sofiane A.', note:5, date:'2 mai 2026',  txt:"L'un des meilleurs de la ville. Qualité constante." },
  { id:'m4', nom:'Nadia K.',   note:4, date:'28 avr 2026', txt:'Service attentionné, plats généreux. Le couscous était parfait.' },
];

const AVATAR_COLORS = ['#E8A045','#5A9BE0','#4CAF82','#9b6cc8','#E05A5A','#5ab4c8'];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name||'').length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}

/* ─── Helpers ─── */
function Stars({ value, size = 12 }) {
  const full = Math.round(value || 0);
  return (
    <Text style={{ fontSize: size, color: colors.accent, letterSpacing: 1 }}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </Text>
  );
}

/* ─── Gradient hero (multi-layer fade) ─── */
function HeroGradient() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={{ flex: 1 }} />
      <View style={{ height: HERO * 0.08, backgroundColor: 'rgba(15,13,11,0.1)'  }} />
      <View style={{ height: HERO * 0.10, backgroundColor: 'rgba(15,13,11,0.25)' }} />
      <View style={{ height: HERO * 0.12, backgroundColor: 'rgba(15,13,11,0.45)' }} />
      <View style={{ height: HERO * 0.14, backgroundColor: 'rgba(15,13,11,0.65)' }} />
      <View style={{ height: HERO * 0.16, backgroundColor: 'rgba(15,13,11,0.85)' }} />
    </View>
  );
}

/* ─── Menu tab ─── */
function MenuTab({ menu }) {
  const cats    = useMemo(() => menu.map(c => c.cat), [menu]);
  const [active, setActive] = useState(cats[0]);
  const catData = useMemo(() => menu.find(c => c.cat === active), [menu, active]);

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={mt.pillRow}>
        {cats.map(cat => (
          <TouchableOpacity key={cat} style={[mt.pill, active === cat && mt.pillOn]} onPress={() => setActive(cat)}>
            <Text style={[mt.pillTxt, active === cat && mt.pillTxtOn]}>{cat}</Text>
            {active === cat && <View style={mt.pillDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={mt.items}>
        {catData?.items.map((item, i) => (
          <View key={i} style={[mt.row, i < catData.items.length - 1 && mt.rowBorder]}>
            <View style={mt.rowLeft}>
              <View style={mt.nomRow}>
                <Text style={mt.nom}>{item.nom}</Text>
                {item.popular && (
                  <View style={mt.popularBadge}>
                    <Text style={mt.popularTxt}>★ Populaire</Text>
                  </View>
                )}
              </View>
              <Text style={mt.desc}>{item.desc}</Text>
            </View>
            <View style={mt.priceBox}>
              <Text style={mt.price}>{item.prix.toLocaleString('fr-FR')}</Text>
              <Text style={mt.priceUnit}>DA</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </>
  );
}

const mt = StyleSheet.create({
  pillRow:     { paddingHorizontal: spacing.xl, paddingVertical: spacing.xl, gap: spacing.md },
  pill:        { paddingHorizontal: spacing.xl + 2, paddingVertical: spacing.md + 1, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, position: 'relative' },
  pillOn:      { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  pillTxt:     { color: colors.textMuted, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  pillTxtOn:   { color: colors.accent, fontWeight: typography.weight.regular },
  pillDot:     { position: 'absolute', bottom: -1, left: '50%', width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginLeft: -2 },
  items:       { marginHorizontal: spacing.xl, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  row:         { flexDirection: 'row', alignItems: 'center', gap: spacing.xl - 2, paddingHorizontal: spacing.xl + 2, paddingVertical: spacing.xl },
  rowBorder:   { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  rowLeft:     { flex: 1, gap: spacing.xs + 1 },
  nomRow:      { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm + 1 },
  nom:         { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.regular },
  popularBadge:{ backgroundColor: colors.accentSoft, borderRadius: radius.sm, paddingHorizontal: spacing.md - 2, paddingVertical: spacing.xxs, borderWidth: 1, borderColor: 'rgba(232,160,69,0.25)' },
  popularTxt:  { color: colors.accent, fontSize: typography.size.xs, fontWeight: typography.weight.medium },
  desc:        { color: colors.textMuted, fontSize: typography.size.caption, lineHeight: 16 },
  priceBox:    { alignItems: 'flex-end', minWidth: 55 },
  price:       { color: colors.accent, fontSize: typography.size.heading3, fontWeight: typography.weight.regular },
  priceUnit:   { color: colors.textDim, fontSize: typography.size.xs, marginTop: 1 },
});

/* ─── Avis tab ─── */
function AvisTab({ restaurant, reviews, loadingReviews }) {
  const rating = Number(restaurant.avg_rating || 0);

  const { list, dist } = useMemo(() => {
    const list = reviews.length > 0 ? reviews : MOCK_AVIS;
    const dist = [5, 4, 3, 2, 1].map(n => ({
      n,
      pct: list.length > 0
        ? Math.round((list.filter(r => Math.round(r.note || r.rating) === n).length / list.length) * 100)
        : (n === 5 ? 60 : n === 4 ? 30 : 10),
    }));
    return { list, dist };
  }, [reviews]);

  if (loadingReviews) return (
    <View style={{ padding: spacing.xxl }}>
      {[1, 2, 3].map(i => (
        <MLoader key={i} width="100%" height={90} borderRadius={radius.xl} style={{ marginBottom: spacing.lg }} />
      ))}
    </View>
  );

  return (
    <>
      {/* Résumé */}
      <View style={av.summary}>
        <View style={av.summaryLeft}>
          <Text style={av.bigRating}>{rating > 0 ? rating.toFixed(1) : '—'}</Text>
          <Stars value={rating} size={15} />
          <Text style={av.reviewCount}>
            {restaurant.review_count > 0 ? `${restaurant.review_count} avis` : `${list.length} avis`}
          </Text>
        </View>
        <View style={av.summaryRight}>
          {dist.map(d => (
            <View key={d.n} style={av.barRow}>
              <Text style={av.barLabel}>{d.n}</Text>
              <View style={av.barTrack}>
                <View style={[av.barFill, { width: `${d.pct}%` }]} />
              </View>
              <Text style={av.barPct}>{d.pct}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Séparateur */}
      <View style={av.divider} />

      {/* Avis */}
      {list.map((a, i) => {
        const displayName = a.nom || `${a.first_name || ''}${a.last_name ? ' ' + a.last_name[0] + '.' : ''}`.trim() || 'Anonyme';
        const note = a.note || a.rating || 0;
        const color = avatarColor(displayName);
        return (
          <View key={a.id || i} style={av.card}>
            <View style={av.cardTop}>
              <View style={[av.avatar, { backgroundColor: color + '22', borderColor: color + '44' }]}>
                <Text style={[av.avatarTxt, { color }]}>{displayName[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={av.nom}>{displayName}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xxs }}>
                  <Stars value={note} size={11} />
                  <Text style={av.date}>{a.date || (a.created_at || '').slice(0,10)}</Text>
                </View>
              </View>
              <View style={[av.noteBadge, note >= 4 && av.noteBadgeGood]}>
                <Text style={[av.noteBadgeTxt, note >= 4 && { color: colors.green }]}>{note}/5</Text>
              </View>
            </View>
            {(a.txt || a.comment) && (
              <Text style={av.txt}>{a.txt || a.comment}</Text>
            )}
          </View>
        );
      })}

      {/* CTA laisser un avis */}
      <View style={av.ctaWrap}>
        <View style={av.ctaDivider}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.cardBorder }} />
          <Text style={av.ctaDividerTxt}>Vous y étiez ?</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.cardBorder }} />
        </View>
        <TouchableOpacity style={av.ctaBtn}>
          <Text style={av.ctaIcon}>✏️</Text>
          <Text style={av.ctaTxt}>Laisser un avis</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </>
  );
}

const av = StyleSheet.create({
  summary:     { flexDirection: 'row', gap: spacing.xl + 2, margin: spacing.xl, marginBottom: 0, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl + 2 },
  summaryLeft: { alignItems: 'center', gap: spacing.md - 2, justifyContent: 'center' },
  bigRating:   { color: colors.accent, fontSize: 48, fontWeight: typography.weight.regular, lineHeight: 54 },
  reviewCount: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: spacing.xxs },
  summaryRight:{ flex: 1, gap: spacing.sm + 1, justifyContent: 'center' },
  barRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  barLabel:    { color: colors.textDim, fontSize: typography.size.caption, width: 10, textAlign: 'right' },
  barTrack:    { flex: 1, height: 5, backgroundColor: colors.cardHover, borderRadius: 3, overflow: 'hidden' },
  barFill:     { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  barPct:      { color: colors.textDim, fontSize: typography.size.sm, width: 28, textAlign: 'right' },
  divider:     { height: 1, backgroundColor: colors.cardBorder, marginHorizontal: spacing.xl, marginVertical: spacing.xl },
  card:        { marginHorizontal: spacing.xl, marginBottom: spacing.md + 2, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl },
  cardTop:     { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md + 2 },
  avatar:      { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarTxt:   { fontSize: typography.size.heading3, fontWeight: typography.weight.regular },
  nom:         { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  date:        { color: colors.textDim, fontSize: typography.size.sm },
  noteBadge:   { backgroundColor: colors.cardHover, borderRadius: radius.sm, paddingHorizontal: spacing.sm + 1, paddingVertical: spacing.xxs + 1, borderWidth: 1, borderColor: colors.cardBorder, alignSelf: 'flex-start' },
  noteBadgeGood:{ backgroundColor: colors.greenSoft, borderColor: 'rgba(76,175,130,0.25)' },
  noteBadgeTxt:{ color: colors.textMuted, fontSize: typography.size.sm },
  txt:         { color: colors.textMuted, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular, lineHeight: 20 },
  ctaWrap:     { margin: spacing.xl, gap: spacing.xl - 2 },
  ctaDivider:  { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ctaDividerTxt:{ color: colors.textDim, fontSize: typography.size.caption },
  ctaBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, paddingVertical: spacing.xl - 2 },
  ctaIcon:     { fontSize: typography.size.heading3 },
  ctaTxt:      { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.regular },
});

/* ─── Infos tab ─── */
function InfosTab({ restaurant }) {
  const rows = [
    { icon:'📍', label:'Adresse',    val: restaurant.address || restaurant.quartier || '—' },
    { icon:'🏙️', label:'Ville',      val: restaurant.city || '—' },
    { icon:'🍽️', label:'Cuisine',    val: (restaurant.cuisine_type || '—').replace(/_/g,' ') },
    { icon:'🕐', label:'Horaires',   val: restaurant.opening_hours || '12h00 – 14h30  ·  19h00 – 22h30' },
    { icon:'📞', label:'Téléphone',  val: restaurant.phone || 'Non renseigné' },
    { icon:'💰', label:'Prix moyen', val: restaurant.avg_ticket > 0 ? `${restaurant.avg_ticket.toLocaleString('fr-FR')} DA / pers.` : '—' },
    { icon:'🪑', label:'Capacité',   val: restaurant.capacity > 0 ? `${restaurant.capacity} couverts` : '—' },
    { icon:'🅿️', label:'Parking',    val: 'Disponible à proximité' },
    { icon:'♿', label:'Accessibilité', val: 'Accessible PMR' },
  ];

  return (
    <>
      <View style={inf.card}>
        {rows.map((row, i) => (
          <View key={i} style={[inf.row, i < rows.length - 1 && inf.rowBorder]}>
            <View style={inf.iconWrap}>
              <Text style={inf.icon}>{row.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={inf.label}>{row.label.toUpperCase()}</Text>
              <Text style={inf.val}>{row.val}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={inf.note}>
        Informations susceptibles de varier. Vérifiez directement auprès du restaurant pour confirmer les horaires et la disponibilité.
      </Text>

      <View style={{ height: 40 }} />
    </>
  );
}

const inf = StyleSheet.create({
  card:     { margin: spacing.xl, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  row:      { flexDirection: 'row', alignItems: 'center', gap: spacing.xl - 2, paddingHorizontal: spacing.xl + 2, paddingVertical: spacing.xl - 2 },
  rowBorder:{ borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  iconWrap: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center' },
  icon:     { fontSize: typography.size.heading2 },
  label:    { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 2, marginBottom: spacing.xxs },
  val:      { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  note:     { marginHorizontal: spacing.xl, color: colors.textDim, fontSize: typography.size.caption, lineHeight: 17, fontStyle: 'italic' },
});

/* ─── Écran principal ─── */
export default function RestaurantScreen({ route, navigation }) {
  const restaurant = route?.params?.restaurant || {
    name: 'Dar Zitoun', cuisine_type: 'algerien',
    address: 'Bab El Oued, Alger', quartier: 'Bab El Oued',
  };

  const [tab,            setTab]            = useState('Menu');
  const [photoIndex,     setPhotoIndex]     = useState(0);
  const [isFav,          setIsFav]          = useState(false);
  const [favId,          setFavId]          = useState(null);
  const [favLoading,     setFavLoading]     = useState(false);
  const [userId,         setUserId]         = useState(null);
  const [reviews,        setReviews]        = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const tabAnim = useRef(new Animated.Value(1)).current;

  const photos = useMemo(
    () => restaurant.photos?.length > 0 ? restaurant.photos
      : restaurant.photo_url ? [restaurant.photo_url] : null,
    [restaurant.photos, restaurant.photo_url],
  );
  const menu   = useMemo(() => MENUS[restaurant.cuisine_type] || MENUS.default, [restaurant.cuisine_type]);
  const rating = useMemo(
    () => restaurant.avg_rating > 0 ? Number(restaurant.avg_rating).toFixed(1) : null,
    [restaurant.avg_rating],
  );
  const cuisineEmoji = useMemo(() => CUISINE_EMOJI[restaurant.cuisine_type] || '🍽️', [restaurant.cuisine_type]);
  const desc         = useMemo(
    () => restaurant.description || CUISINE_DESC[restaurant.cuisine_type] || CUISINE_DESC.autre,
    [restaurant.description, restaurant.cuisine_type],
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) return;
      const { data: row } = await supabase.from('users').select('id').eq('auth_id', u.id).single();
      if (!row) return;
      setUserId(row.id);
      if (!restaurant.id) return;
      const { data: fav } = await supabase.from('favorites')
        .select('id').eq('user_id', row.id).eq('restaurant_id', restaurant.id).maybeSingle();
      if (fav) { setIsFav(true); setFavId(fav.id); }
    })();

    if (restaurant.id) {
      setLoadingReviews(true);
      (async () => {
        try {
          const { data } = await supabase.from('reviews')
            .select('id, rating, comment, created_at, users(first_name, last_name)')
            .eq('restaurant_id', restaurant.id)
            .order('created_at', { ascending: false })
            .limit(20);
          if (data?.length > 0) {
            setReviews(data.map(r => ({
              id:         r.id,
              note:       r.rating,
              first_name: r.users?.first_name,
              last_name:  r.users?.last_name,
              comment:    r.comment,
              created_at: r.created_at,
            })));
          }
        } finally {
          setLoadingReviews(false);
        }
      })();
    }
  }, []);

  const toggleFav = useCallback(async () => {
    if (!userId || favLoading) return;
    setFavLoading(true);
    try {
      if (isFav) {
        await supabase.from('favorites').delete().eq('id', favId);
        setIsFav(false);
        setFavId(null);
      } else {
        const { data } = await supabase.from('favorites')
          .insert({ user_id: userId, restaurant_id: restaurant.id }).select('id').single();
        if (data) { setIsFav(true); setFavId(data.id); }
      }
    } finally {
      setFavLoading(false);
    }
  }, [userId, favLoading, isFav, favId, restaurant.id]);

  const goBack    = useCallback(() => navigation?.goBack(), [navigation]);
  const goReserve = useCallback(() => navigation.navigate('ReservationForm', { restaurant }), [navigation, restaurant]);

  const switchTab = useCallback((t) => {
    Animated.timing(tabAnim, { toValue: 0, duration: 80, useNativeDriver: true }).start(() => {
      setTab(t);
      Animated.timing(tabAnim, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    });
  }, []);

  return (
    <SafeAreaView style={s.root}>

      {/* ── HERO ── */}
      <View style={s.hero}>
        {photos ? (
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
            onMomentumScrollEnd={e => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SW))}
          >
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={{ width: SW, height: HERO }} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 80, opacity: 0.5 }}>{cuisineEmoji}</Text>
          </View>
        )}

        <HeroGradient />

        {/* Bouton retour */}
        <TouchableOpacity style={[s.heroBtn, { left: spacing.xl }]} onPress={goBack}>
          <Text style={s.heroBtnTxt}>←</Text>
        </TouchableOpacity>

        {/* Bouton favori */}
        <TouchableOpacity style={[s.heroBtn, { right: spacing.xl }]} onPress={toggleFav} disabled={favLoading}>
          <Text style={favLoading ? s.heroBtnActing : s.heroBtnIcon}>
            {favLoading ? '···' : isFav ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>

        {/* Compteur photos */}
        {photos && photos.length > 1 && (
          <View style={s.photoCounter}>
            <Text style={s.photoCounterTxt}>{photoIndex + 1} / {photos.length}</Text>
          </View>
        )}

        {/* Info en bas du hero */}
        <View style={s.heroInfo}>
          <View style={s.heroTopRow}>
            <View style={s.heroCuisineBadge}>
              <Text style={s.heroCuisineEmoji}>{cuisineEmoji}</Text>
              <Text style={s.heroCuisineTxt}>{(restaurant.cuisine_type || '').replace(/_/g,' ').toUpperCase()}</Text>
            </View>
            <View style={s.openBadge}>
              <View style={s.openDot} />
              <Text style={s.openTxt}>Ouvert</Text>
            </View>
          </View>
          <Text style={s.heroName} numberOfLines={1}>{restaurant.name}</Text>
          <View style={s.heroMeta}>
            {rating && (
              <>
                <Text style={s.heroRatingTxt}>★ {rating}</Text>
                {restaurant.review_count > 0 && (
                  <Text style={s.heroReviewCount}>({restaurant.review_count} avis)</Text>
                )}
                <Text style={s.heroSep}>·</Text>
              </>
            )}
            <Text style={s.heroAddr} numberOfLines={1}>
              📍 {restaurant.quartier || restaurant.city || ''}
            </Text>
          </View>
        </View>
      </View>

      {/* ── STATS STRIP ── */}
      <View style={s.strip}>
        <View style={s.stripItem}>
          <Text style={s.stripIcon}>★</Text>
          <Text style={s.stripVal}>{rating || '—'}</Text>
          <Text style={s.stripLbl}>Note</Text>
        </View>
        <View style={s.stripDiv} />
        <View style={s.stripItem}>
          <Text style={s.stripIcon}>💰</Text>
          <Text style={s.stripVal}>
            {restaurant.avg_ticket > 0 ? (restaurant.avg_ticket / 1000).toFixed(1) + 'k' : '—'}
          </Text>
          <Text style={s.stripLbl}>DA / pers.</Text>
        </View>
        <View style={s.stripDiv} />
        <View style={s.stripItem}>
          <Text style={s.stripIcon}>🪑</Text>
          <Text style={s.stripVal}>{restaurant.capacity > 0 ? restaurant.capacity : '—'}</Text>
          <Text style={s.stripLbl}>Couverts</Text>
        </View>
        <View style={s.stripDiv} />
        <View style={s.stripItem}>
          <Text style={s.stripIcon}>💬</Text>
          <Text style={s.stripVal}>{reviews.length > 0 ? reviews.length : restaurant.review_count || '—'}</Text>
          <Text style={s.stripLbl}>Avis</Text>
        </View>
      </View>

      {/* ── DESCRIPTION ── */}
      <View style={s.descWrap}>
        <Text style={s.descTxt} numberOfLines={3}>{desc}</Text>
      </View>

      {/* ── TABS ── */}
      <View style={s.tabBar}>
        {['Menu','Avis','Infos'].map(t => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnOn]} onPress={() => switchTab(t)}>
            <Text style={[s.tabTxt, tab === t && s.tabTxtOn]}>{t}</Text>
            {tab === t && <View style={s.tabLine} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── CONTENU ── */}
      <Animated.ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, opacity: tabAnim }}>
        {tab === 'Menu' && <MenuTab menu={menu} />}
        {tab === 'Avis' && <AvisTab restaurant={restaurant} reviews={reviews} loadingReviews={loadingReviews} />}
        {tab === 'Infos' && <InfosTab restaurant={restaurant} />}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* ── FOOTER ── */}
      <View style={s.footer}>
        <View style={s.footerInner}>
          {restaurant.avg_ticket > 0 && (
            <View style={s.footerPrice}>
              <Text style={s.footerPriceLbl}>PRIX MOY.</Text>
              <Text style={s.footerPriceVal}>{restaurant.avg_ticket.toLocaleString('fr-FR')} DA</Text>
            </View>
          )}
          <TouchableOpacity
            style={[s.reserveBtn, !restaurant.avg_ticket && { flex: 1 }]}
            onPress={goReserve}
          >
            <Text style={s.reserveTxt}>RÉSERVER UNE TABLE</Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  /* Hero */
  hero:        { height: HERO, overflow: 'hidden' },
  heroBtn:     { position: 'absolute', top: TOP, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(15,13,11,0.76)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(240,235,227,0.12)' },
  heroBtnTxt:  { color: colors.text, fontSize: typography.size.heading1 },
  heroBtnIcon: { fontSize: typography.size.heading1 },
  heroBtnActing:{ color: colors.accent, fontSize: typography.size.bodyLg, fontWeight: typography.weight.bold },

  /* Photo counter */
  photoCounter:    { position: 'absolute', top: TOP + 5, alignSelf: 'center', backgroundColor: 'rgba(15,13,11,0.7)', borderRadius: radius.full, paddingHorizontal: spacing.md + 2, paddingVertical: spacing.xs },
  photoCounterTxt: { color: colors.text, fontSize: typography.size.caption, fontWeight: typography.weight.regular },

  /* Open badge */
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 1, backgroundColor: 'rgba(15,13,11,0.76)', borderRadius: radius.full, paddingHorizontal: spacing.md + 2, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(76,175,130,0.3)' },
  openDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  openTxt:   { color: colors.green, fontSize: typography.size.sm },

  /* Hero info overlay */
  heroInfo:        { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xl, paddingBottom: spacing.xl + 2 },
  heroTopRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  heroCuisineBadge:{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 1, backgroundColor: colors.accentSoft, borderRadius: radius.sm, borderWidth: 1, borderColor: 'rgba(232,160,69,0.4)', paddingHorizontal: spacing.md + 1, paddingVertical: spacing.xs },
  heroCuisineEmoji:{ fontSize: typography.size.body },
  heroCuisineTxt:  { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 2.5 },
  heroName:        { color: colors.text, fontSize: typography.size.title + 4, fontWeight: typography.weight.regular, letterSpacing: 0.3, marginBottom: spacing.sm + 1 },
  heroMeta:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 1, flexWrap: 'wrap' },
  heroRatingTxt:   { color: colors.accent, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium },
  heroReviewCount: { color: colors.textMuted, fontSize: typography.size.caption },
  heroSep:         { color: colors.textDim },
  heroAddr:        { color: colors.textMuted, fontSize: typography.size.body, flex: 1 },

  /* Stats strip */
  strip:     { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  stripItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg - 1, gap: spacing.xxs },
  stripIcon: { fontSize: typography.size.bodyLg, marginBottom: spacing.xxs },
  stripVal:  { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  stripLbl:  { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 0.3 },
  stripDiv:  { width: 1, backgroundColor: colors.cardBorder, marginVertical: spacing.md },

  /* Description */
  descWrap: { paddingHorizontal: spacing.xl, paddingVertical: spacing.xl - 2, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  descTxt:  { color: colors.textMuted, fontSize: typography.size.bodyLg, lineHeight: 20, fontWeight: typography.weight.regular },

  /* Tab bar */
  tabBar:  { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  tabBtn:  { flex: 1, alignItems: 'center', paddingVertical: spacing.lg + 1, position: 'relative' },
  tabBtnOn:{},
  tabTxt:  { color: colors.textDim, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  tabTxtOn:{ color: colors.text, fontWeight: typography.weight.medium },
  tabLine: { position: 'absolute', bottom: 0, left: '25%', right: '25%', height: 2, backgroundColor: colors.accent, borderRadius: 1 },

  /* Footer */
  footer:        { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: colors.cardBorder, backgroundColor: colors.bg },
  footerInner:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xl - 2 },
  footerPrice:   { gap: spacing.xxs },
  footerPriceLbl:{ color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 1.5 },
  footerPriceVal:{ color: colors.accent, fontSize: typography.size.heading2, fontWeight: typography.weight.regular },
  reserveBtn:    { flex: 1, backgroundColor: colors.accent, borderRadius: radius.xl, paddingVertical: spacing.xl - 1, alignItems: 'center' },
  reserveTxt:    { color: colors.bg, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, letterSpacing: 1.5 },
});
