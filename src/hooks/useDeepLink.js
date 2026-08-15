import { useEffect } from 'react';
import { Linking } from 'react-native';
import { supabase } from '../../supabase';

async function handleUrl(url, navigation) {
  if (!url || !navigation) return;

  // mida://restaurant/<id>[?table=<n>] — le paramètre table vient des QR imprimés
  // par le pro (Lot 3, ProTableQrScreen) : ouvre directement Click & Collect en mode table.
  const restaurantMatch = url.match(/mida:\/\/restaurant\/([^?/\s]+)/);
  if (restaurantMatch) {
    const id = restaurantMatch[1];
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!data) return;

    const tableMatch = url.match(/[?&]table=(\d+)/);
    if (tableMatch) {
      navigation.navigate('ClickCollect', { restaurant: data, initialMode: 'table', initialTable: tableMatch[1] });
    } else {
      navigation.navigate('Restaurant', { restaurant: data });
    }
    return;
  }

  // mida://notifications
  if (url.includes('mida://notifications')) {
    navigation.navigate('Notifications');
    return;
  }

  // mida://reservations
  if (url.includes('mida://reservations')) {
    navigation.navigate('Main', { screen: 'Resa' });
  }
}

export default function useDeepLink(navigation) {
  useEffect(() => {
    // App ouverte depuis une URL (cold start)
    Linking.getInitialURL().then(url => { if (url) handleUrl(url, navigation); });

    // App déjà ouverte, URL reçue
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url, navigation));
    return () => sub.remove();
  }, [navigation]);
}
