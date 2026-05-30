import { useState } from "react";

const screens = [
  "splash", "home", "search", "restaurant", "reservation", "confirmation",
  "avis", "profil", "dashboard", "dashboard-reservations", "dashboard-avis", "dashboard-stats"
];

const screenLabels = {
  splash: "Splash",
  home: "Accueil",
  search: "Recherche",
  restaurant: "Fiche Restaurant",
  reservation: "Réservation",
  confirmation: "Confirmation",
  avis: "Avis certifiés",
  profil: "Mon Profil",
  dashboard: "Dashboard Resto",
  "dashboard-reservations": "Dash · Réservations",
  "dashboard-avis": "Dash · Avis",
  "dashboard-stats": "Dash · Stats",
};

const colors = {
  bg: "#0F0D0B",
  card: "#1A1714",
  cardBorder: "#2A2520",
  accent: "#E8A045",
  accentSoft: "#E8A04520",
  accentDim: "#C4863A",
  text: "#F0EBE3",
  textMuted: "#8A7F74",
  textDim: "#5A5148",
  green: "#4CAF82",
  greenSoft: "#4CAF8220",
  red: "#E05A5A",
  redSoft: "#E05A5A20",
  blue: "#5A9BE0",
  blueSoft: "#5A9BE020",
};

const Tag = ({ children, color = colors.accentSoft, textColor = colors.accent }) => (
  <span style={{
    background: color, color: textColor, borderRadius: 20,
    padding: "3px 10px", fontSize: 11, fontWeight: 600, letterSpacing: 0.3
  }}>{children}</span>
);

const Star = ({ filled }) => (
  <span style={{ color: filled ? colors.accent : colors.textDim, fontSize: 13 }}>★</span>
);

const Stars = ({ n, max = 5 }) => (
  <span>{Array.from({ length: max }, (_, i) => <Star key={i} filled={i < n} />)}</span>
);

const Phone = ({ children, title, subtitle }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6
  }}>
    {(title || subtitle) && (
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        {title && <div style={{ color: colors.text, fontWeight: 700, fontSize: 13 }}>{title}</div>}
        {subtitle && <div style={{ color: colors.textMuted, fontSize: 11 }}>{subtitle}</div>}
      </div>
    )}
    <div style={{
      width: 280, background: "#111", borderRadius: 36,
      boxShadow: "0 20px 60px #000a, 0 0 0 2px #333",
      overflow: "hidden", position: "relative",
    }}>
      <div style={{ background: "#111", padding: "10px 0 4px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: 80, height: 5, borderRadius: 3, background: "#333" }} />
      </div>
      <div style={{ background: colors.bg, minHeight: 560, overflowY: "auto" }}>
        {children}
      </div>
      <div style={{ background: "#111", padding: "8px 0 12px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "#444" }} />
      </div>
    </div>
  </div>
);

const NavBar = ({ active, onNavigate }) => {
  const items = [
    { id: "home", icon: "⊞", label: "Accueil" },
    { id: "search", icon: "⊙", label: "Chercher" },
    { id: "reservation", icon: "◫", label: "Réservations" },
    { id: "profil", icon: "◉", label: "Profil" },
  ];
  return (
    <div style={{
      display: "flex", justifyContent: "space-around",
      background: colors.card, borderTop: `1px solid ${colors.cardBorder}`,
      padding: "10px 0 6px"
    }}>
      {items.map(item => (
        <div key={item.id} onClick={() => onNavigate(item.id)}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" }}>
          <span style={{ fontSize: 18, color: active === item.id ? colors.accent : colors.textMuted }}>{item.icon}</span>
          <span style={{ fontSize: 9, color: active === item.id ? colors.accent : colors.textMuted, fontWeight: active === item.id ? 700 : 400 }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

// ── SCREENS ──────────────────────────────────────────────────────────────────

const SplashScreen = ({ onNavigate }) => (
  <div style={{ minHeight: 560, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, gap: 20 }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 54, marginBottom: 8 }}>🍽️</div>
      <div style={{ fontSize: 38, fontWeight: 900, color: colors.accent, letterSpacing: -1, fontFamily: "Georgia, serif" }}>mida</div>
      <div style={{ fontSize: 12, color: colors.textMuted, letterSpacing: 3, marginTop: 4, textTransform: "uppercase" }}>Alger · Resto · Réservation</div>
    </div>
    <div style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 1.6, maxWidth: 200 }}>
      Découvre, réserve et note les meilleurs restaurants d'Alger
    </div>
    <button onClick={() => onNavigate("home")} style={{
      background: colors.accent, color: "#000", border: "none", borderRadius: 14,
      padding: "14px 40px", fontSize: 14, fontWeight: 800, cursor: "pointer",
      letterSpacing: 0.5, marginTop: 8
    }}>Commencer</button>
    <div style={{ fontSize: 11, color: colors.textDim }}>Réserver en 30 secondes</div>
  </div>
);

const HomeScreen = ({ onNavigate }) => (
  <div>
    <div style={{ padding: "18px 16px 10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>Bonjour 👋</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: colors.text }}>Où manger ce soir ?</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: colors.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer" }} onClick={() => onNavigate("profil")}>👤</div>
      </div>
      <div onClick={() => onNavigate("search")} style={{
        marginTop: 12, background: colors.card, border: `1px solid ${colors.cardBorder}`,
        borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer"
      }}>
        <span style={{ color: colors.textMuted }}>🔍</span>
        <span style={{ color: colors.textDim, fontSize: 13 }}>Restaurant, quartier, cuisine…</span>
      </div>
    </div>

    <div style={{ padding: "6px 16px 6px" }}>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {["🍖 Grillades", "🥘 Traditionnel", "🍕 Pizza", "🍣 Sushi", "🥗 Végétarien"].map((f, i) => (
          <div key={i} style={{
            background: i === 0 ? colors.accent : colors.card,
            color: i === 0 ? "#000" : colors.textMuted,
            borderRadius: 20, padding: "6px 12px", fontSize: 11, fontWeight: 600,
            whiteSpace: "nowrap", cursor: "pointer", border: `1px solid ${i === 0 ? "transparent" : colors.cardBorder}`
          }}>{f}</div>
        ))}
      </div>
    </div>

    <div style={{ padding: "8px 16px 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>⚡ Disponible ce soir</div>
        <span style={{ fontSize: 11, color: colors.accent, cursor: "pointer" }} onClick={() => onNavigate("search")}>Voir tout →</span>
      </div>
      {[
        { name: "Le Tantra", quartier: "Hydra", cuisine: "Fusion", note: 4.7, avis: 312, promo: "-20%", temps: "5 min", emoji: "🎋" },
        { name: "Dar El Kef", quartier: "El Biar", cuisine: "Algérien", note: 4.5, avis: 198, promo: null, temps: "12 min", emoji: "🏺" },
      ].map((r, i) => (
        <div key={i} onClick={() => onNavigate("restaurant")} style={{
          background: colors.card, border: `1px solid ${colors.cardBorder}`,
          borderRadius: 14, marginBottom: 10, overflow: "hidden", cursor: "pointer"
        }}>
          <div style={{ height: 100, background: `linear-gradient(135deg, #2a1f14, #1a1209)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, position: "relative" }}>
            {r.emoji}
            {r.promo && (
              <div style={{ position: "absolute", top: 8, right: 8, background: colors.accent, color: "#000", borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 800 }}>{r.promo}</div>
            )}
          </div>
          <div style={{ padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{r.name}</div>
                <div style={{ fontSize: 11, color: colors.textMuted }}>{r.quartier} · {r.cuisine}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: colors.accent, fontWeight: 700 }}>★ {r.note}</div>
                <div style={{ fontSize: 10, color: colors.textDim }}>{r.avis} avis</div>
              </div>
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
              <Tag>🕐 {r.temps}</Tag>
              <Tag color={colors.greenSoft} textColor={colors.green}>✓ Table dispo</Tag>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div style={{ padding: "4px 16px 12px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 10 }}>🔥 Tendance à Alger</div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto" }}>
        {[
          { name: "Amazonia", note: 4.2, emoji: "🌿" },
          { name: "Casbah Istanbul", note: 4.4, emoji: "🕌" },
          { name: "Le Béarnais", note: 4.6, emoji: "🍷" },
        ].map((r, i) => (
          <div key={i} onClick={() => onNavigate("restaurant")} style={{
            minWidth: 110, background: colors.card, borderRadius: 12, overflow: "hidden",
            border: `1px solid ${colors.cardBorder}`, cursor: "pointer"
          }}>
            <div style={{ height: 70, background: `linear-gradient(135deg, #1f1a12, #2a2015)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{r.emoji}</div>
            <div style={{ padding: "8px 8px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.text }}>{r.name}</div>
              <div style={{ fontSize: 11, color: colors.accent }}>★ {r.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <NavBar active="home" onNavigate={onNavigate} />
  </div>
);

const SearchScreen = ({ onNavigate }) => (
  <div>
    <div style={{ padding: "18px 16px 10px" }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: colors.text, marginBottom: 12 }}>🔍 Rechercher</div>
      <div style={{ background: colors.card, border: `1px solid ${colors.accent}`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: colors.accent }}>🔍</span>
        <span style={{ color: colors.text, fontSize: 13 }}>Grillades Hydra</span>
        <span style={{ marginLeft: "auto", color: colors.textDim, fontSize: 11, cursor: "pointer" }}>✕</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto" }}>
        {["📍 Près de moi", "💰 Budget", "⭐ Note", "🕐 Dispo", "🍽️ Cuisine"].map((f, i) => (
          <div key={i} style={{
            background: i === 0 ? colors.accentSoft : colors.card,
            border: `1px solid ${i === 0 ? colors.accent : colors.cardBorder}`,
            color: i === 0 ? colors.accent : colors.textMuted,
            borderRadius: 20, padding: "5px 10px", fontSize: 11,
            whiteSpace: "nowrap", cursor: "pointer", fontWeight: i === 0 ? 700 : 400
          }}>{f}</div>
        ))}
      </div>
    </div>

    <div style={{ padding: "4px 16px" }}>
      <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>24 résultats · Alger & environs</div>
      {[
        { name: "Le Tantra", quartier: "Hydra", cuisine: "Fusion · Grillades", note: 4.7, avis: 312, prix: "1200–2500 DA", dispo: true, emoji: "🎋" },
        { name: "Grill Palace", quartier: "Ben Aknoun", cuisine: "Grillades", note: 4.3, avis: 87, prix: "800–1800 DA", dispo: true, emoji: "🔥" },
        { name: "Dar Zitoun", quartier: "Bouzaréah", cuisine: "Traditionnel", note: 4.5, avis: 143, prix: "900–1600 DA", dispo: false, emoji: "🫒" },
      ].map((r, i) => (
        <div key={i} onClick={() => onNavigate("restaurant")} style={{
          background: colors.card, border: `1px solid ${colors.cardBorder}`,
          borderRadius: 14, marginBottom: 10, padding: "12px", cursor: "pointer",
          display: "flex", gap: 12, alignItems: "center",
          opacity: r.dispo ? 1 : 0.6
        }}>
          <div style={{ width: 60, height: 60, borderRadius: 12, background: `linear-gradient(135deg, #2a1f14, #1a1209)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{r.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{r.name}</div>
              <div style={{ fontSize: 12, color: colors.accent, fontWeight: 700 }}>★ {r.note}</div>
            </div>
            <div style={{ fontSize: 11, color: colors.textMuted }}>{r.quartier} · {r.cuisine}</div>
            <div style={{ fontSize: 11, color: colors.textDim, marginTop: 2 }}>{r.prix} / pers.</div>
            <div style={{ marginTop: 6 }}>
              {r.dispo
                ? <Tag color={colors.greenSoft} textColor={colors.green}>✓ Tables disponibles</Tag>
                : <Tag color={colors.redSoft} textColor={colors.red}>✗ Complet ce soir</Tag>}
            </div>
          </div>
        </div>
      ))}
    </div>
    <NavBar active="search" onNavigate={onNavigate} />
  </div>
);

const RestaurantScreen = ({ onNavigate }) => (
  <div>
    <div style={{ height: 160, background: "linear-gradient(135deg, #2a1f10, #1a1208)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", fontSize: 60 }}>
      🎋
      <div style={{ position: "absolute", top: 12, left: 12, background: "#0008", borderRadius: 8, padding: "4px 8px", fontSize: 18, cursor: "pointer" }} onClick={() => onNavigate("home")}>←</div>
      <div style={{ position: "absolute", top: 12, right: 12, background: "#0008", borderRadius: 8, padding: "4px 8px", fontSize: 16 }}>♡</div>
      <div style={{ position: "absolute", bottom: 10, left: 12 }}>
        <Tag color={colors.accentSoft} textColor={colors.accent}>-20% ce soir</Tag>
      </div>
    </div>

    <div style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>Le Tantra</div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Fusion · Grillades · Hydra, Alger</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 16, color: colors.accent, fontWeight: 800 }}>★ 4.7</div>
          <div style={{ fontSize: 11, color: colors.textDim }}>312 avis certifiés</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        <Tag>🕐 12h–23h</Tag>
        <Tag>💰 1200–2500 DA</Tag>
        <Tag>👥 2–12 pers.</Tag>
        <Tag color={colors.greenSoft} textColor={colors.green}>✓ Parking</Tag>
      </div>

      <div style={{ marginTop: 14, padding: "12px", background: colors.card, borderRadius: 12, border: `1px solid ${colors.cardBorder}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.text, marginBottom: 6 }}>📍 Localisation</div>
        <div style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.5 }}>12 Rue Hassiba Ben Bouali, Hydra</div>
        <div style={{ height: 60, background: "#1a1a1a", borderRadius: 8, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 11, color: colors.textDim }}>[ Vue carte Google Maps ]</div>
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          <div style={{ flex: 1, background: colors.accentSoft, borderRadius: 8, padding: "7px", textAlign: "center", fontSize: 11, color: colors.accent, fontWeight: 600, cursor: "pointer" }}>📍 Itinéraire</div>
          <div style={{ flex: 1, background: colors.accentSoft, borderRadius: 8, padding: "7px", textAlign: "center", fontSize: 11, color: colors.accent, fontWeight: 600, cursor: "pointer" }}>📞 Appeler</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 8 }}>🍽️ Menu populaire</div>
        {[
          { nom: "Brochettes mixtes", desc: "Agneau, poulet, kefta", prix: "1400 DA" },
          { nom: "Salade orientale", desc: "Tomates, oignons, herbes", prix: "600 DA" },
          { nom: "Couscous royal", desc: "7 légumes, merguez", prix: "1800 DA" },
        ].map((p, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${colors.cardBorder}` }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{p.nom}</div>
              <div style={{ fontSize: 11, color: colors.textDim }}>{p.desc}</div>
            </div>
            <div style={{ fontSize: 12, color: colors.accent, fontWeight: 700, whiteSpace: "nowrap" }}>{p.prix}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>⭐ Derniers avis certifiés</div>
          <span style={{ fontSize: 11, color: colors.accent, cursor: "pointer" }} onClick={() => onNavigate("avis")}>Voir tout →</span>
        </div>
        {[
          { user: "Amira B.", note: 5, text: "Incroyable ambiance, les brochettes étaient parfaites !", date: "il y a 2j" },
          { user: "Karim D.", note: 4, text: "Service rapide, bonne cuisine. Le parking est un vrai plus.", date: "il y a 5j" },
        ].map((a, i) => (
          <div key={i} style={{ background: colors.card, borderRadius: 10, padding: "10px", marginBottom: 8, border: `1px solid ${colors.cardBorder}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{a.user}</div>
              <div style={{ fontSize: 10, color: colors.textDim }}>{a.date}</div>
            </div>
            <Stars n={a.note} />
            <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, lineHeight: 1.4 }}>{a.text}</div>
            <div style={{ marginTop: 4 }}><Tag color={colors.greenSoft} textColor={colors.green}>✓ Avis vérifié via Mida</Tag></div>
          </div>
        ))}
      </div>

      <button onClick={() => onNavigate("reservation")} style={{
        width: "100%", background: colors.accent, color: "#000", border: "none",
        borderRadius: 14, padding: "15px", fontSize: 15, fontWeight: 800,
        cursor: "pointer", marginTop: 12, letterSpacing: 0.3
      }}>Réserver une table →</button>
    </div>
  </div>
);

const ReservationScreen = ({ onNavigate }) => {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("Auj. 26 Mai");
  const [heure, setHeure] = useState("20h00");
  const [couverts, setCouverts] = useState(2);

  return (
    <div>
      <div style={{ padding: "16px", borderBottom: `1px solid ${colors.cardBorder}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ cursor: "pointer", fontSize: 18, color: colors.textMuted }} onClick={() => onNavigate("restaurant")}>←</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: colors.text }}>Réserver · Le Tantra</div>
            <div style={{ fontSize: 11, color: colors.textMuted }}>Étape {step}/3</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? colors.accent : colors.cardBorder }} />
          ))}
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        {step === 1 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 12 }}>📅 Choisir la date</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {["Auj. 26 Mai", "Dem. 27 Mai", "28 Mai", "29 Mai", "30 Mai"].map(d => (
                <div key={d} onClick={() => setDate(d)} style={{
                  padding: "8px 12px", borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: date === d ? colors.accent : colors.card,
                  color: date === d ? "#000" : colors.textMuted,
                  border: `1px solid ${date === d ? "transparent" : colors.cardBorder}`
                }}>{d}</div>
              ))}
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 12 }}>🕐 Choisir l'heure</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {["19h00", "19h30", "20h00", "20h30", "21h00", "21h30"].map(h => (
                <div key={h} onClick={() => setHeure(h)} style={{
                  padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: heure === h ? colors.accent : colors.card,
                  color: heure === h ? "#000" : colors.textMuted,
                  border: `1px solid ${heure === h ? "transparent" : colors.cardBorder}`
                }}>{h}</div>
              ))}
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 12 }}>👥 Nombre de couverts</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div onClick={() => setCouverts(Math.max(1, couverts - 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: colors.card, border: `1px solid ${colors.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", color: colors.text }}>−</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: colors.text, minWidth: 30, textAlign: "center" }}>{couverts}</div>
              <div onClick={() => setCouverts(Math.min(12, couverts + 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: colors.card, border: `1px solid ${colors.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", color: colors.text }}>+</div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>personnes</div>
            </div>

            <div style={{ background: colors.accentSoft, borderRadius: 12, padding: "12px", border: `1px solid ${colors.accent}30`, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: colors.accent, fontWeight: 700, marginBottom: 4 }}>🎁 Promo disponible</div>
              <div style={{ fontSize: 11, color: colors.textMuted }}>-20% sur l'addition ce soir (avant 21h)</div>
            </div>

            <button onClick={() => setStep(2)} style={{ width: "100%", background: colors.accent, color: "#000", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
              Continuer →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 12 }}>👤 Vos coordonnées</div>
            {[["Prénom", "Amira"], ["Nom", "Benali"], ["Téléphone", "0661 23 45 67"], ["Email", "amira@email.com"]].map(([label, val], i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>{label}</div>
                <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, color: colors.text }}>{val}</div>
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>Demandes spéciales (optionnel)</div>
              <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 10, padding: "10px 12px", fontSize: 12, color: colors.textDim, minHeight: 60 }}>Table en terrasse si possible…</div>
            </div>

            <div style={{ background: colors.card, borderRadius: 12, padding: "12px", border: `1px solid ${colors.cardBorder}`, marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Récapitulatif</div>
              {[["Restaurant", "Le Tantra · Hydra"], ["Date", date], ["Heure", heure], ["Couverts", `${couverts} personnes`], ["Promo", "-20% avant 21h"]].map(([k, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>{k}</span>
                  <span style={{ fontSize: 12, color: i === 4 ? colors.accent : colors.text, fontWeight: i === 4 ? 700 : 500 }}>{v}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setStep(3)} style={{ width: "100%", background: colors.accent, color: "#000", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
              Confirmer la réservation →
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
              <div style={{ fontSize: 50, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: colors.text }}>Réservation confirmée !</div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 6, lineHeight: 1.6 }}>Un SMS de confirmation a été envoyé au 0661 23 45 67</div>
            </div>
            <div style={{ background: colors.card, borderRadius: 14, padding: "14px", border: `1px solid ${colors.accent}40`, marginBottom: 14 }}>
              {[["Restaurant", "Le Tantra"], ["Date", date], ["Heure", heure], ["Couverts", `${couverts} personnes`], ["Code de résa", "#MDA-4872"]].map(([k, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, paddingBottom: 8, borderBottom: i < 4 ? `1px solid ${colors.cardBorder}` : "none" }}>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>{k}</span>
                  <span style={{ fontSize: 12, color: i === 4 ? colors.accent : colors.text, fontWeight: i === 4 ? 800 : 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: colors.redSoft, borderRadius: 12, padding: "10px 12px", marginBottom: 14, border: `1px solid ${colors.red}30` }}>
              <div style={{ fontSize: 11, color: colors.red, fontWeight: 700 }}>⚠️ Annulation gratuite jusqu'à 2h avant</div>
              <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }}>Passé ce délai, une pénalité de 500 DA sera appliquée.</div>
            </div>
            <button onClick={() => onNavigate("home")} style={{ width: "100%", background: colors.accent, color: "#000", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Retour à l'accueil</button>
          </>
        )}
      </div>
    </div>
  );
};

const AvisScreen = ({ onNavigate }) => (
  <div>
    <div style={{ padding: "16px", borderBottom: `1px solid ${colors.cardBorder}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ cursor: "pointer", fontSize: 18, color: colors.textMuted }} onClick={() => onNavigate("restaurant")}>←</span>
        <div style={{ fontSize: 15, fontWeight: 800, color: colors.text }}>Avis certifiés · Le Tantra</div>
      </div>
    </div>
    <div style={{ padding: "14px 16px" }}>
      <div style={{ background: colors.card, borderRadius: 14, padding: "14px", border: `1px solid ${colors.cardBorder}`, marginBottom: 14, display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: colors.accent }}>4.7</div>
          <Stars n={5} />
          <div style={{ fontSize: 10, color: colors.textDim, marginTop: 3 }}>312 avis</div>
        </div>
        <div style={{ flex: 1 }}>
          {[["Cuisine", 4.8], ["Service", 4.6], ["Ambiance", 4.7], ["Prix/qualité", 4.5]].map(([label, val], i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: colors.textMuted }}>{label}</span>
                <span style={{ fontSize: 10, color: colors.accent, fontWeight: 700 }}>{val}</span>
              </div>
              <div style={{ height: 4, background: colors.cardBorder, borderRadius: 2 }}>
                <div style={{ width: `${(val / 5) * 100}%`, height: "100%", background: colors.accent, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <Tag color={colors.greenSoft} textColor={colors.green}>✓ 100% avis vérifiés · Réservation Mida requise</Tag>
      </div>

      {[
        { user: "Amira B.", note: 5, date: "il y a 2j", text: "Ambiance incroyable, brochettes parfaites. On reviendra forcément !", tags: ["Cuisine ⭐", "Ambiance 🎉"] },
        { user: "Karim D.", note: 4, date: "il y a 5j", text: "Service rapide et efficace. Le parking est un vrai atout à Hydra.", tags: ["Service 👍", "Parking ✓"] },
        { user: "Nadia K.", note: 5, date: "il y a 1 sem.", text: "Le couscous royal est divin. Prix très raisonnables pour la qualité.", tags: ["Prix 💰", "Cuisine ⭐"] },
        { user: "Sofiane M.", note: 3, date: "il y a 2 sem.", text: "Bonne cuisine mais un peu long pour être servi le vendredi soir.", tags: ["Attente ⏱"] },
      ].map((a, i) => (
        <div key={i} style={{ background: colors.card, borderRadius: 12, padding: "12px", marginBottom: 10, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: colors.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: colors.accent, fontWeight: 700 }}>{a.user[0]}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{a.user}</div>
                <div style={{ fontSize: 10, color: colors.textDim }}>{a.date}</div>
              </div>
            </div>
            <Stars n={a.note} />
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 8, lineHeight: 1.5 }}>{a.text}</div>
          <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
            {a.tags.map((t, j) => <Tag key={j}>{t}</Tag>)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ProfilScreen = ({ onNavigate }) => (
  <div>
    <div style={{ padding: "18px 16px 10px" }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: colors.text, marginBottom: 14 }}>Mon Profil</div>
      <div style={{ background: colors.card, borderRadius: 16, padding: "16px", border: `1px solid ${colors.cardBorder}`, display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: colors.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: colors.accent, fontWeight: 800 }}>A</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: colors.text }}>Amira Benali</div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>amira@email.com</div>
          <div style={{ marginTop: 4 }}><Tag>🏅 Membre Gold · 1240 pts</Tag></div>
        </div>
      </div>

      <div style={{ background: colors.accentSoft, borderRadius: 14, padding: "12px", border: `1px solid ${colors.accent}30`, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.accent, marginBottom: 6 }}>🎁 Mes points Mida</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: colors.accent }}>1 240</div>
            <div style={{ fontSize: 11, color: colors.textMuted }}>points cumulés</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>−500 DA</div>
            <div style={{ fontSize: 11, color: colors.textMuted }}>prochain bon</div>
          </div>
        </div>
        <div style={{ height: 6, background: colors.cardBorder, borderRadius: 3, marginTop: 8 }}>
          <div style={{ width: "62%", height: "100%", background: colors.accent, borderRadius: 3 }} />
        </div>
        <div style={{ fontSize: 10, color: colors.textDim, marginTop: 4 }}>760 pts avant un bon de 500 DA</div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 10 }}>📋 Mes réservations</div>
      {[
        { resto: "Le Tantra", date: "26 Mai · 20h00", statut: "À venir", emoji: "🎋" },
        { resto: "Dar El Kef", date: "18 Mai · 19h30", statut: "Passée", emoji: "🏺" },
      ].map((r, i) => (
        <div key={i} style={{ background: colors.card, borderRadius: 12, padding: "10px 12px", marginBottom: 8, border: `1px solid ${colors.cardBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 22 }}>{r.emoji}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{r.resto}</div>
              <div style={{ fontSize: 11, color: colors.textMuted }}>{r.date}</div>
            </div>
          </div>
          <Tag color={i === 0 ? colors.greenSoft : colors.accentSoft} textColor={i === 0 ? colors.green : colors.accent}>{r.statut}</Tag>
        </div>
      ))}

      <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginTop: 12, marginBottom: 10 }}>⚙️ Paramètres</div>
      {["🔔 Notifications", "📍 Ma localisation", "🌙 Mode sombre", "🚪 Se déconnecter"].map((item, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${colors.cardBorder}`, cursor: "pointer" }}>
          <span style={{ fontSize: 13, color: colors.text }}>{item}</span>
          <span style={{ color: colors.textDim }}>›</span>
        </div>
      ))}
    </div>
    <NavBar active="profil" onNavigate={onNavigate} />
  </div>
);

// ── DASHBOARD RESTAURATEUR ─────────────────────────────────────────────────

const DashboardHome = ({ onNavigate }) => (
  <div>
    <div style={{ padding: "16px 16px 10px", background: `linear-gradient(180deg, #1a1208, ${colors.bg})` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 10, color: colors.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Dashboard Restaurateur</div>
        <Tag color={colors.greenSoft} textColor={colors.green}>● En ligne</Tag>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: colors.text }}>Le Tantra · Hydra 🎋</div>
      <div style={{ fontSize: 11, color: colors.textMuted }}>Bonjour, Mohamed · Lundi 26 Mai 2025</div>
    </div>

    <div style={{ padding: "10px 16px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Ce soir", val: "14", sub: "réservations", icon: "📅" },
          { label: "Couverts", val: "38", sub: "attendus", icon: "👥" },
        ].map((stat, i) => (
          <div key={i} style={{ flex: 1, background: colors.card, borderRadius: 14, padding: "12px", border: `1px solid ${colors.cardBorder}` }}>
            <div style={{ fontSize: 18 }}>{stat.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: colors.accent, lineHeight: 1.1, marginTop: 4 }}>{stat.val}</div>
            <div style={{ fontSize: 10, color: colors.textMuted }}>{stat.label}</div>
            <div style={{ fontSize: 10, color: colors.textDim }}>{stat.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Note Mida", val: "4.7", sub: "★ certifiée", icon: "⭐" },
          { label: "CA estimé", val: "52k", sub: "DA ce soir", icon: "💰" },
        ].map((stat, i) => (
          <div key={i} style={{ flex: 1, background: colors.card, borderRadius: 14, padding: "12px", border: `1px solid ${colors.cardBorder}` }}>
            <div style={{ fontSize: 18 }}>{stat.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: i === 0 ? colors.accent : colors.green, lineHeight: 1.1, marginTop: 4 }}>{stat.val}</div>
            <div style={{ fontSize: 10, color: colors.textMuted }}>{stat.label}</div>
            <div style={{ fontSize: 10, color: colors.textDim }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 10 }}>🗂️ Navigation</div>
      {[
        { label: "📅 Réservations du jour", sub: "14 réservations · 3 en attente", screen: "dashboard-reservations" },
        { label: "⭐ Gérer les avis", sub: "2 nouveaux avis à répondre", screen: "dashboard-avis" },
        { label: "📊 Statistiques", sub: "Analyse de fréquentation", screen: "dashboard-stats" },
      ].map((item, i) => (
        <div key={i} onClick={() => onNavigate(item.screen)} style={{
          background: colors.card, borderRadius: 12, padding: "12px", marginBottom: 8,
          border: `1px solid ${colors.cardBorder}`, cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{item.label}</div>
            <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{item.sub}</div>
          </div>
          <span style={{ color: colors.accent, fontSize: 16 }}>›</span>
        </div>
      ))}

      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 10 }}>⚡ Plan de salle – Ce soir</div>
        <div style={{ background: colors.card, borderRadius: 14, padding: "12px", border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              { num: 1, status: "reserved" }, { num: 2, status: "free" }, { num: 3, status: "reserved" }, { num: 4, status: "reserved" },
              { num: 5, status: "free" }, { num: 6, status: "reserved" }, { num: 7, status: "occupied" }, { num: 8, status: "free" },
            ].map(t => (
              <div key={t.num} style={{
                height: 44, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
                background: t.status === "reserved" ? colors.accentSoft : t.status === "occupied" ? colors.redSoft : colors.greenSoft,
                border: `1px solid ${t.status === "reserved" ? colors.accent + "40" : t.status === "occupied" ? colors.red + "40" : colors.green + "40"}`,
              }}>
                <span style={{ fontSize: 10, color: t.status === "reserved" ? colors.accent : t.status === "occupied" ? colors.red : colors.green, fontWeight: 700 }}>T{t.num}</span>
                <span style={{ fontSize: 8, color: colors.textDim }}>{t.status === "reserved" ? "Réservée" : t.status === "occupied" ? "Occupée" : "Libre"}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center" }}>
            <Tag color={colors.accentSoft} textColor={colors.accent}>■ Réservée</Tag>
            <Tag color={colors.redSoft} textColor={colors.red}>■ Occupée</Tag>
            <Tag color={colors.greenSoft} textColor={colors.green}>■ Libre</Tag>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DashboardReservations = ({ onNavigate }) => (
  <div>
    <div style={{ padding: "16px 16px 10px", borderBottom: `1px solid ${colors.cardBorder}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ cursor: "pointer", fontSize: 18, color: colors.textMuted }} onClick={() => onNavigate("dashboard")}>←</span>
        <div style={{ fontSize: 15, fontWeight: 800, color: colors.text }}>Réservations · 26 Mai</div>
      </div>
    </div>
    <div style={{ padding: "12px 16px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["Toutes (14)", "À venir (8)", "En attente (3)", "Passées (3)"].map((t, i) => (
          <div key={i} style={{
            padding: "5px 10px", borderRadius: 20, fontSize: 11, whiteSpace: "nowrap",
            background: i === 0 ? colors.accent : colors.card,
            color: i === 0 ? "#000" : colors.textMuted,
            border: `1px solid ${i === 0 ? "transparent" : colors.cardBorder}`,
            cursor: "pointer", fontWeight: i === 0 ? 700 : 400
          }}>{t}</div>
        ))}
      </div>
      {[
        { nom: "Amira B.", couverts: 2, heure: "19h00", table: "T2", statut: "confirmed", phone: "0661 23 45 67" },
        { nom: "Karim D.", couverts: 4, heure: "19h30", table: "T5", statut: "pending", phone: "0770 98 12 34" },
        { nom: "Nadia K.", couverts: 6, heure: "20h00", table: "T1+T3", statut: "confirmed", phone: "0555 67 89 01" },
        { nom: "Sofiane M.", couverts: 2, heure: "20h30", table: "T8", statut: "pending", phone: "0661 45 67 89" },
        { nom: "Yasmine A.", couverts: 3, heure: "21h00", table: "T4", statut: "confirmed", phone: "0770 34 56 78" },
      ].map((r, i) => (
        <div key={i} style={{ background: colors.card, borderRadius: 12, padding: "12px", marginBottom: 8, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: colors.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: colors.accent, fontWeight: 800, flexShrink: 0 }}>{r.nom[0]}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{r.nom}</div>
                <div style={{ fontSize: 11, color: colors.textMuted }}>{r.phone}</div>
              </div>
            </div>
            <Tag
              color={r.statut === "confirmed" ? colors.greenSoft : colors.accentSoft}
              textColor={r.statut === "confirmed" ? colors.green : colors.accent}
            >{r.statut === "confirmed" ? "✓ Confirmée" : "⏳ En attente"}</Tag>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <Tag>🕐 {r.heure}</Tag>
            <Tag>👥 {r.couverts} pers.</Tag>
            <Tag>🪑 {r.table}</Tag>
          </div>
          {r.statut === "pending" && (
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <div style={{ flex: 1, background: colors.greenSoft, borderRadius: 8, padding: "7px", textAlign: "center", fontSize: 11, color: colors.green, fontWeight: 700, cursor: "pointer" }}>✓ Confirmer</div>
              <div style={{ flex: 1, background: colors.redSoft, borderRadius: 8, padding: "7px", textAlign: "center", fontSize: 11, color: colors.red, fontWeight: 700, cursor: "pointer" }}>✗ Refuser</div>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

const DashboardAvis = ({ onNavigate }) => (
  <div>
    <div style={{ padding: "16px 16px 10px", borderBottom: `1px solid ${colors.cardBorder}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ cursor: "pointer", fontSize: 18, color: colors.textMuted }} onClick={() => onNavigate("dashboard")}>←</span>
        <div style={{ fontSize: 15, fontWeight: 800, color: colors.text }}>Gérer les avis certifiés</div>
      </div>
    </div>
    <div style={{ padding: "12px 16px" }}>
      <div style={{ background: colors.card, borderRadius: 12, padding: "12px", border: `1px solid ${colors.cardBorder}`, marginBottom: 14, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: colors.accent }}>4.7</div>
          <Stars n={5} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
            <Tag color={colors.greenSoft} textColor={colors.green}>2 nouveaux</Tag>
            <Tag color={colors.accentSoft} textColor={colors.accent}>312 total</Tag>
          </div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>Note Mida certifiée · Uniquement clients vérifiés</div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: colors.accent, marginBottom: 8 }}>⚡ À répondre en priorité</div>
      {[
        { user: "Amira B.", note: 5, text: "Incroyable ambiance, brochettes parfaites. On reviendra !", answered: false },
        { user: "Sofiane M.", note: 3, text: "Bonne cuisine mais un peu long pour être servi le vendredi soir.", answered: false },
      ].map((a, i) => (
        <div key={i} style={{ background: colors.card, borderRadius: 12, padding: "12px", marginBottom: 10, border: `1px solid ${i === 1 ? colors.accent + "40" : colors.cardBorder}` }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{a.user}</div>
            <Stars n={a.note} />
          </div>
          <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 6, lineHeight: 1.4 }}>{a.text}</div>
          <div style={{ marginTop: 8, background: i === 1 ? colors.redSoft : colors.accentSoft, borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: i === 1 ? colors.red : colors.accent, fontWeight: 700, marginBottom: 4 }}>
              {i === 1 ? "⚠️ Avis négatif · Répondre rapidement recommandé" : "💬 Votre réponse publique"}
            </div>
            <div style={{ fontSize: 11, color: colors.textDim }}>
              {i === 1 ? "Merci pour votre retour. Nous travaillons à améliorer…" : "Merci Amira ! Votre fidélité nous touche…"}
            </div>
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
            <div style={{ flex: 1, background: colors.accentSoft, borderRadius: 8, padding: "7px", textAlign: "center", fontSize: 11, color: colors.accent, fontWeight: 700, cursor: "pointer" }}>✏️ Répondre</div>
            <div style={{ flex: 1, background: "#2a2520", borderRadius: 8, padding: "7px", textAlign: "center", fontSize: 11, color: colors.textMuted, fontWeight: 600, cursor: "pointer" }}>📲 Partager</div>
          </div>
        </div>
      ))}

      <div style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted, marginBottom: 8, marginTop: 4 }}>Avis récents répondus</div>
      {[
        { user: "Karim D.", note: 4, answered: true },
        { user: "Nadia K.", note: 5, answered: true },
      ].map((a, i) => (
        <div key={i} style={{ background: colors.card, borderRadius: 10, padding: "10px 12px", marginBottom: 6, border: `1px solid ${colors.cardBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.7 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{a.user}</div>
            <Stars n={a.note} />
          </div>
          <Tag color={colors.greenSoft} textColor={colors.green}>✓ Répondu</Tag>
        </div>
      ))}
    </div>
  </div>
);

const DashboardStats = ({ onNavigate }) => (
  <div>
    <div style={{ padding: "16px 16px 10px", borderBottom: `1px solid ${colors.cardBorder}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ cursor: "pointer", fontSize: 18, color: colors.textMuted }} onClick={() => onNavigate("dashboard")}>←</span>
        <div style={{ fontSize: 15, fontWeight: 800, color: colors.text }}>Statistiques · Mai 2025</div>
      </div>
    </div>
    <div style={{ padding: "12px 16px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["7j", "30j", "3m", "1an"].map((p, i) => (
          <div key={i} style={{ padding: "5px 14px", borderRadius: 20, fontSize: 11, background: i === 1 ? colors.accent : colors.card, color: i === 1 ? "#000" : colors.textMuted, fontWeight: i === 1 ? 700 : 400, border: `1px solid ${i === 1 ? "transparent" : colors.cardBorder}`, cursor: "pointer" }}>{p}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Réservations", val: "187", delta: "+23%", up: true, icon: "📅" },
          { label: "Couverts", val: "524", delta: "+18%", up: true, icon: "👥" },
          { label: "No-shows", val: "4", delta: "-60%", up: false, icon: "⚠️" },
          { label: "Note moy.", val: "4.7", delta: "+0.2", up: true, icon: "⭐" },
        ].map((s, i) => (
          <div key={i} style={{ background: colors.card, borderRadius: 12, padding: "12px", border: `1px solid ${colors.cardBorder}` }}>
            <div style={{ fontSize: 16 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: colors.text, marginTop: 4 }}>{s.val}</div>
            <div style={{ fontSize: 10, color: colors.textMuted }}>{s.label}</div>
            <div style={{ fontSize: 11, color: s.up ? colors.green : colors.red, fontWeight: 700, marginTop: 2 }}>{s.delta} vs mois dernier</div>
          </div>
        ))}
      </div>

      <div style={{ background: colors.card, borderRadius: 14, padding: "12px", border: `1px solid ${colors.cardBorder}`, marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.text, marginBottom: 10 }}>📈 Réservations par soir (Mai)</div>
        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 70 }}>
          {[4, 7, 5, 9, 6, 12, 8, 14, 10, 7, 11, 9, 13, 14].map((v, i) => (
            <div key={i} style={{ flex: 1, background: i === 13 ? colors.accent : colors.accentSoft, borderRadius: "3px 3px 0 0", height: `${(v / 14) * 100}%`, minHeight: 4 }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 9, color: colors.textDim }}>1 Mai</span>
          <span style={{ fontSize: 9, color: colors.accent, fontWeight: 700 }}>Aujourd'hui</span>
        </div>
      </div>

      <div style={{ background: colors.card, borderRadius: 14, padding: "12px", border: `1px solid ${colors.cardBorder}`, marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.text, marginBottom: 8 }}>⏰ Créneaux les plus demandés</div>
        {[["20h00", 92], ["19h30", 78], ["20h30", 65], ["21h00", 43]].map(([h, pct], i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 11, color: colors.text }}>{h}</span>
              <span style={{ fontSize: 11, color: colors.accent, fontWeight: 700 }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: colors.cardBorder, borderRadius: 3 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: i === 0 ? colors.accent : colors.accentSoft, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: colors.accentSoft, borderRadius: 12, padding: "12px", border: `1px solid ${colors.accent}30` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.accent, marginBottom: 4 }}>💡 Conseil Mida</div>
        <div style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.5 }}>Votre créneau 19h30 est sous-utilisé. Proposer une promo -15% pourrait augmenter votre taux de remplissage de 30%.</div>
      </div>
    </div>
  </div>
);

// ── MAIN ──────────────────────────────────────────────────────────────────────

export default function MidaWireframes() {
  const [activeScreen, setActiveScreen] = useState("splash");

  const screenGroups = [
    { title: "📱 App Client", screens: ["splash", "home", "search", "restaurant", "reservation", "avis", "profil"] },
    { title: "🏪 Dashboard Restaurateur", screens: ["dashboard", "dashboard-reservations", "dashboard-avis", "dashboard-stats"] },
  ];

  const renderScreen = (screen) => {
    const props = { onNavigate: setActiveScreen };
    switch (screen) {
      case "splash": return <SplashScreen {...props} />;
      case "home": return <HomeScreen {...props} />;
      case "search": return <SearchScreen {...props} />;
      case "restaurant": return <RestaurantScreen {...props} />;
      case "reservation": return <ReservationScreen {...props} />;
      case "confirmation": return <div style={{ padding: 20, color: colors.text }}>Confirmation</div>;
      case "avis": return <AvisScreen {...props} />;
      case "profil": return <ProfilScreen {...props} />;
      case "dashboard": return <DashboardHome {...props} />;
      case "dashboard-reservations": return <DashboardReservations {...props} />;
      case "dashboard-avis": return <DashboardAvis {...props} />;
      case "dashboard-stats": return <DashboardStats {...props} />;
      default: return <div style={{ padding: 20, color: colors.text }}>Écran : {screen}</div>;
    }
  };

  return (
    <div style={{ background: "#080706", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", color: colors.text }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: colors.accent, letterSpacing: -1, fontFamily: "Georgia, serif" }}>mida</div>
          <div style={{ fontSize: 13, color: colors.textMuted, letterSpacing: 2, textTransform: "uppercase" }}>Wireframes Interactifs · v1.0</div>
          <div style={{ fontSize: 11, color: colors.textDim, marginTop: 4 }}>Cliquez sur les éléments pour naviguer entre les écrans</div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
          {screenGroups.map(group => (
            <div key={group.title} style={{ background: colors.card, borderRadius: 14, padding: "12px 14px", border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8, fontWeight: 600 }}>{group.title}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {group.screens.map(s => (
                  <div key={s} onClick={() => setActiveScreen(s)} style={{
                    padding: "5px 10px", borderRadius: 8, fontSize: 11, cursor: "pointer",
                    background: activeScreen === s ? colors.accent : "#2a2520",
                    color: activeScreen === s ? "#000" : colors.textMuted,
                    fontWeight: activeScreen === s ? 700 : 400,
                    border: `1px solid ${activeScreen === s ? "transparent" : colors.cardBorder}`
                  }}>{screenLabels[s]}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <Phone title={screenLabels[activeScreen]} subtitle={activeScreen.startsWith("dashboard") ? "Vue Restaurateur" : "Vue Client"}>
            {renderScreen(activeScreen)}
          </Phone>
        </div>

        <div style={{ marginTop: 28, background: colors.card, borderRadius: 16, padding: "16px 20px", border: `1px solid ${colors.cardBorder}`, maxWidth: 560, margin: "28px auto 0" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 12 }}>📋 Fonctionnalités couvertes</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              "✅ Découverte & filtres", "✅ Fiche restaurant enrichie",
              "✅ Réservation 3 étapes", "✅ Gestion couverts/créneaux",
              "✅ Promo & réductions", "✅ Avis certifiés vérifiés",
              "✅ Système de points", "✅ Annulation flexible",
              "✅ Plan de salle interactif", "✅ Dashboard restaurateur",
              "✅ Anti no-show", "✅ Stats & conseils IA",
              "✅ Gestion avis (B2B)", "✅ Partage réseaux sociaux",
            ].map((f, i) => (
              <div key={i} style={{ fontSize: 11, color: colors.textMuted }}>{f}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
