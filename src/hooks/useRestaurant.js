import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Animated } from 'react-native';
import { supabase } from '../../supabase';

export const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️',
};

export const CUISINE_DESC = {
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

export const MENUS = {
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

export default function useRestaurant(restaurant) {
  const [tab,            setTab]            = useState('Menu');
  const [photoIndex,     setPhotoIndex]     = useState(0);
  const [isFav,          setIsFav]          = useState(false);
  const [favId,          setFavId]          = useState(null);
  const [favLoading,     setFavLoading]     = useState(false);
  const [userId,         setUserId]         = useState(null);
  const [reviews,        setReviews]        = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [dbDishes,       setDbDishes]       = useState([]);
  const tabAnim = useRef(new Animated.Value(1)).current;

  const photos = useMemo(
    () => restaurant.photos?.length > 0 ? restaurant.photos
      : restaurant.photo_url ? [restaurant.photo_url] : null,
    [restaurant.photos, restaurant.photo_url],
  );
  const menu = useMemo(() => {
    if (dbDishes.length > 0) {
      const cats = [...new Set(dbDishes.map(d => d.category).filter(Boolean))];
      return cats.map(cat => ({
        cat,
        items: dbDishes
          .filter(d => d.category === cat)
          .map(d => ({
            nom:     d.name,
            desc:    d.description || '',
            prix:    Number(d.price),
            popular: d.is_dish_of_day,
            photo:   d.photo || null,
          })),
      }));
    }
    return [];
  }, [dbDishes]);
  const rating       = useMemo(() => restaurant.avg_rating > 0 ? Number(restaurant.avg_rating).toFixed(1) : null, [restaurant.avg_rating]);
  const cuisineEmoji = useMemo(() => CUISINE_EMOJI[restaurant.cuisine_type] || '🍽️', [restaurant.cuisine_type]);
  const desc         = useMemo(() => restaurant.description || null, [restaurant.description]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) return;
      const { data: row } = await supabase.from('users').select('id').eq('auth_id', u.id).maybeSingle();
      if (!row) return;
      setUserId(row.id);
      if (!restaurant.id) return;
      const { data: fav } = await supabase.from('favorites')
        .select('id').eq('user_id', row.id).eq('restaurant_id', restaurant.id).maybeSingle();
      if (fav) { setIsFav(true); setFavId(fav.id); }
    })();

    if (restaurant.id) {
      (async () => {
        const { data } = await supabase.from('dishes')
          .select('id, name, description, price, category, is_dish_of_day, photo')
          .eq('restaurant_id', restaurant.id)
          .eq('is_available', true)
          .order('created_at', { ascending: true });
        if (data?.length > 0) setDbDishes(data);
      })();

      setLoadingReviews(true);
      (async () => {
        try {
          const { data } = await supabase.from('reviews')
            .select('id, rating, comment, created_at, users(first_name, last_name)')
            .eq('restaurant_id', restaurant.id)
            .eq('moderation_status', 'approved')
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
  }, [restaurant.id]);

  const toggleFav = useCallback(async () => {
    if (!userId || !restaurant.id || favLoading) return;
    setFavLoading(true);
    try {
      if (isFav) {
        const { error } = await supabase.from('favorites').delete().eq('id', favId);
        if (!error) { setIsFav(false); setFavId(null); }
      } else {
        const { data, error } = await supabase.from('favorites')
          .upsert({ user_id: userId, restaurant_id: restaurant.id }, { onConflict: 'user_id,restaurant_id' })
          .select('id');
        if (error) {
          console.error('Fav upsert:', error.message, error.code);
        } else {
          const id = data?.[0]?.id;
          if (id) {
            setIsFav(true); setFavId(id);
          } else {
            const { data: f } = await supabase.from('favorites')
              .select('id').eq('user_id', userId).eq('restaurant_id', restaurant.id).maybeSingle();
            if (f) { setIsFav(true); setFavId(f.id); }
          }
        }
      }
    } finally {
      setFavLoading(false);
    }
  }, [userId, favLoading, isFav, favId, restaurant.id]);

  const switchTab = useCallback((t) => {
    Animated.timing(tabAnim, { toValue: 0, duration: 80, useNativeDriver: true }).start(() => {
      setTab(t);
      Animated.timing(tabAnim, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    });
  }, [tabAnim]);

  return {
    tab, photoIndex, setPhotoIndex,
    isFav, favLoading, reviews, loadingReviews,
    tabAnim, photos, menu, rating, cuisineEmoji, desc,
    toggleFav, switchTab,
  };
}
