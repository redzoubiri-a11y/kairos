import { useState, useEffect, useCallback, useMemo } from 'react';
import * as Print from 'expo-print';
import { supabase } from '../../supabase';

// QR = deep link mida://restaurant/<id>?table=<n>, rendu via une API publique de QR
// (image distante, aucune lib caméra/QR ajoutée) — cf. useDeepLink.js pour le scan.
function qrImageUrl(deepLink) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(deepLink)}`;
}

export default function useProTableQr() {
  const [restaurantId, setRestaurantId] = useState(null);
  const [tableCount, setTableCount] = useState('10');
  const [loading,   setLoading]   = useState(true);
  const [printing,  setPrinting]  = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data } = await supabase
        .from('restaurant_owners').select('restaurant_id')
        .eq('auth_id', session.user.id).limit(1);
      setRestaurantId(data?.[0]?.restaurant_id ?? null);
      setLoading(false);
    })();
  }, []);

  const tables = useMemo(() => {
    const n = Math.max(0, Math.min(200, parseInt(tableCount, 10) || 0));
    return Array.from({ length: n }, (_, i) => i + 1);
  }, [tableCount]);

  const tableQrList = useMemo(() => {
    if (!restaurantId) return [];
    return tables.map(n => ({
      table: n,
      deepLink: `mida://restaurant/${restaurantId}?table=${n}`,
      imageUrl: qrImageUrl(`mida://restaurant/${restaurantId}?table=${n}`),
    }));
  }, [restaurantId, tables]);

  const printAll = useCallback(async () => {
    if (tableQrList.length === 0) return;
    setPrinting(true);
    try {
      const cards = tableQrList.map(t => `
        <div style="width:33%;box-sizing:border-box;padding:12px;text-align:center;page-break-inside:avoid;">
          <img src="${t.imageUrl}" style="width:100%;max-width:200px;" />
          <div style="font-family:sans-serif;font-size:18px;font-weight:bold;margin-top:8px;">Table n°${t.table}</div>
        </div>
      `).join('');
      const html = `
        <html><body style="margin:0;">
          <div style="display:flex;flex-wrap:wrap;">${cards}</div>
        </body></html>
      `;
      await Print.printAsync({ html });
    } finally {
      setPrinting(false);
    }
  }, [tableQrList]);

  return {
    restaurantId, loading,
    tableCount, setTableCount,
    tableQrList, printing, printAll,
  };
}
