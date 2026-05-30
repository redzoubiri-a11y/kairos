import { useState } from "react";

const c = {
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
  purple: "#9B7FE8",
  purpleSoft: "#9B7FE820",
  orange: "#E8A045",
};

const screenLabels = {
  // Recherche avancée
  search_map: "Recherche · Vue carte",
  search_filters: "Filtres avancés",
  search_results: "Résultats filtrés",
  search_suggest: "Suggestions intelligentes",
  // États système
  err_404: "404 · Page introuvable",
  err_network: "Erreur réseau",
  err_server: "Erreur serveur",
  err_maintenance: "Maintenance",
  loading: "Chargement",
  // Paramètres & légal
  settings: "Paramètres généraux",
  settings_langue: "Langue & région",
  settings_notifs: "Notifications globales",
  cgu: "CGU & Confidentialité",
  aide: "Aide & Support",
  aide_faq: "FAQ",
  aide_chat: "Chat support",
  // Design system
  ds_colors: "Design System · Couleurs",
  ds_typo: "Design System · Typo",
  ds_components: "Design System · Composants",
};

// ── COMPOSANTS ────────────────────────────────────────────────────────────

const Phone = ({ children, label }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
    {label && <div style={{ color: c.text, fontWeight: 700, fontSize: 13, textAlign: "center", maxWidth: 200 }}>{label}</div>}
    <div style={{
      width: 280, background: "#111", borderRadius: 36,
      boxShadow: "0 24px 64px #000c, 0 0 0 2px #2a2a2a", overflow: "hidden",
    }}>
      <div style={{ background: "#111", padding: "10px 0 4px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: 80, height: 5, borderRadius: 3, background: "#2a2a2a" }} />
      </div>
      <div style={{ background: c.bg, minHeight: 560, overflowY: "auto", maxHeight: 600 }}>
        {children}
      </div>
      <div style={{ background: "#111", padding: "8px 0 12px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "#333" }} />
      </div>
    </div>
  </div>
);

const Tag = ({ children, color = c.accentSoft, textColor = c.accent, size = "md" }) => (
  <span style={{
    background: color, color: textColor, borderRadius: 20,
    padding: size === "sm" ? "2px 7px" : "3px 10px",
    fontSize: size === "sm" ? 10 : 11, fontWeight: 600
  }}>{children}</span>
);

const Btn = ({ children, variant = "primary", onClick, disabled, small }) => {
  const styles = {
    primary: { background: c.accent, color: "#000", border: "none" },
    secondary: { background: "transparent", color: c.accent, border: `1.5px solid ${c.accent}` },
    ghost: { background: c.card, color: c.textMuted, border: `1px solid ${c.cardBorder}` },
    danger: { background: c.redSoft, color: c.red, border: `1px solid ${c.red}40` },
    blue: { background: c.blueSoft, color: c.blue, border: `1px solid ${c.blue}40` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", borderRadius: small ? 10 : 14,
      padding: small ? "8px" : "14px",
      fontSize: small ? 12 : 14, fontWeight: 800,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, ...styles[variant]
    }}>{children}</button>
  );
};

const Header = ({ title, sub, back, onBack, right }) => (
  <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${c.cardBorder}`, display: "flex", alignItems: "center", gap: 10 }}>
    {back && <span onClick={onBack} style={{ fontSize: 20, color: c.textMuted, cursor: "pointer", flexShrink: 0 }}>←</span>}
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>{title}</div>
      {sub && <div style={{ fontSize: 10, color: c.textMuted }}>{sub}</div>}
    </div>
    {right}
  </div>
);

const Toggle = ({ label, on, sub }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${c.cardBorder}` }}>
    <div>
      <div style={{ fontSize: 12, color: c.text }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: c.textDim }}>{sub}</div>}
    </div>
    <div style={{ width: 38, height: 22, borderRadius: 11, background: on ? c.accent : "#2a2520", position: "relative", cursor: "pointer", border: `1px solid ${on ? c.accentDim : c.cardBorder}` }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: on ? "#000" : c.textDim, position: "absolute", top: 2, left: on ? 18 : 2 }} />
    </div>
  </div>
);

const NavBar = ({ active, onNavigate, pro }) => {
  const clientItems = [
    { id: "home", icon: "⊞", label: "Accueil" },
    { id: "search_map", icon: "⊙", label: "Chercher" },
    { id: "favoris", icon: "♡", label: "Favoris" },
    { id: "notifs", icon: "🔔", label: "Alertes" },
    { id: "settings", icon: "◉", label: "Profil" },
  ];
  const proItems = [
    { id: "dashboard", icon: "⊞", label: "Board" },
    { id: "menu", icon: "🍽", label: "Menu" },
    { id: "promo", icon: "🎁", label: "Promos" },
    { id: "profil_public", icon: "🏪", label: "Profil" },
    { id: "settings", icon: "⚙️", label: "Réglages" },
  ];
  const items = pro ? proItems : clientItems;
  return (
    <div style={{ display: "flex", justifyContent: "space-around", background: c.card, borderTop: `1px solid ${c.cardBorder}`, padding: "10px 0 6px" }}>
      {items.map(item => (
        <div key={item.id} onClick={() => onNavigate && onNavigate(item.id)}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" }}>
          <span style={{ fontSize: 16, color: active === item.id ? c.accent : c.textMuted }}>{item.icon}</span>
          <span style={{ fontSize: 9, color: active === item.id ? c.accent : c.textMuted, fontWeight: active === item.id ? 700 : 400 }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// SECTION 1 — RECHERCHE AVANCÉE
// ══════════════════════════════════════════════════════════════════════════

const SearchMapScreen = ({ onNavigate }) => {
  const [view, setView] = useState("map");
  return (
    <div>
      {/* Header sticky */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: c.bg, padding: "10px 12px 8px", borderBottom: `1px solid ${c.cardBorder}` }}>
        <div style={{ background: c.card, border: `1.5px solid ${c.accent}60`, borderRadius: 14, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ color: c.accent }}>🔍</span>
          <span style={{ fontSize: 13, color: c.text, flex: 1 }}>Grillades · Hydra</span>
          <span onClick={() => onNavigate("search_filters")} style={{ fontSize: 11, background: c.accentSoft, color: c.accent, borderRadius: 8, padding: "3px 8px", fontWeight: 700, cursor: "pointer" }}>⚙️ Filtres</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["📍 Près de moi", "⭐ 4.5+", "💰 −1500 DA", "✓ Dispo"].map((f, i) => (
            <div key={i} style={{
              padding: "4px 9px", borderRadius: 20, fontSize: 10,
              background: i < 2 ? c.accentSoft : c.card,
              color: i < 2 ? c.accent : c.textMuted,
              border: `1px solid ${i < 2 ? c.accent + "40" : c.cardBorder}`,
              fontWeight: i < 2 ? 700 : 400, whiteSpace: "nowrap", cursor: "pointer"
            }}>{f}</div>
          ))}
        </div>
      </div>

      {/* Toggle carte/liste */}
      <div style={{ display: "flex", margin: "8px 12px", background: c.card, borderRadius: 12, padding: "3px", border: `1px solid ${c.cardBorder}` }}>
        {["🗺️ Carte", "☰ Liste"].map((v, i) => (
          <div key={i} onClick={() => setView(i === 0 ? "map" : "list")} style={{
            flex: 1, textAlign: "center", padding: "7px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
            background: (i === 0 && view === "map") || (i === 1 && view === "list") ? c.accent : "transparent",
            color: (i === 0 && view === "map") || (i === 1 && view === "list") ? "#000" : c.textMuted,
          }}>{v}</div>
        ))}
      </div>

      {view === "map" ? (
        <>
          {/* Carte */}
          <div style={{ margin: "0 12px", borderRadius: 16, overflow: "hidden", border: `1px solid ${c.cardBorder}`, position: "relative" }}>
            <div style={{ height: 280, background: "linear-gradient(160deg, #121a0f 0%, #0a0f08 100%)", position: "relative", overflow: "hidden" }}>
              {/* Grille */}
              <div style={{ position: "absolute", inset: 0, opacity: 0.1 }}>
                {[...Array(7)].map((_, i) => <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${i * 16}%`, height: 1, background: c.green }} />)}
                {[...Array(6)].map((_, i) => <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: `${i * 18}%`, width: 1, background: c.green }} />)}
              </div>
              {/* Route simulée */}
              <div style={{ position: "absolute", top: "40%", left: "10%", right: "15%", height: 3, background: "#2a3020", borderRadius: 2 }} />
              <div style={{ position: "absolute", top: "20%", bottom: "15%", left: "45%", width: 3, background: "#2a3020", borderRadius: 2 }} />

              {/* Markers */}
              {[
                { x: "28%", y: "38%", name: "Le Tantra", note: 4.7, hot: true, dispo: true },
                { x: "58%", y: "52%", name: "Dar El Kef", note: 4.5, hot: false, dispo: true },
                { x: "72%", y: "28%", name: "Le Béarnais", note: 4.6, hot: false, dispo: false },
                { x: "18%", y: "68%", name: "Grill Palace", note: 4.3, hot: false, dispo: true },
                { x: "82%", y: "62%", name: "Casbah Istanbul", note: 4.4, hot: false, dispo: true },
              ].map((m, i) => (
                <div key={i} onClick={() => onNavigate("search_results")} style={{ position: "absolute", left: m.x, top: m.y, transform: "translate(-50%,-100%)", cursor: "pointer" }}>
                  <div style={{
                    background: m.hot ? c.accent : m.dispo ? c.card : "#1a1a1a",
                    border: `2px solid ${m.hot ? c.accentDim : m.dispo ? c.accent + "60" : c.textDim}`,
                    borderRadius: m.hot ? 22 : 12, padding: m.hot ? "5px 10px" : "4px 8px",
                    fontSize: m.hot ? 12 : 10, color: m.hot ? "#000" : m.dispo ? c.text : c.textDim,
                    fontWeight: 700, whiteSpace: "nowrap",
                    boxShadow: m.hot ? `0 4px 20px ${c.accent}50` : "0 2px 10px #000a",
                    opacity: m.dispo ? 1 : 0.5
                  }}>
                    {m.hot ? `★ ${m.note}` : `★${m.note}`}
                  </div>
                  <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `6px solid ${m.hot ? c.accent : m.dispo ? c.cardBorder : "#333"}`, margin: "0 auto" }} />
                </div>
              ))}

              {/* Position utilisateur */}
              <div style={{ position: "absolute", left: "48%", top: "50%", transform: "translate(-50%,-50%)" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: c.blue, border: "3px solid #fff", boxShadow: `0 0 0 6px ${c.blue}30` }} />
              </div>

              {/* Contrôles */}
              <div style={{ position: "absolute", bottom: 10, right: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                {["⊕", "⊖", "📍"].map((btn, i) => (
                  <div key={i} style={{ width: 32, height: 32, background: c.card, border: `1px solid ${c.cardBorder}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer", boxShadow: "0 2px 8px #0008" }}>{btn}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom sheet */}
          <div style={{ padding: "10px 12px 4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.text }}>5 restaurants · zone visible</span>
              <span style={{ fontSize: 11, color: c.accent, cursor: "pointer" }}>Trier ▾</span>
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {[
                { name: "Le Tantra", note: 4.7, emoji: "🎋", prix: "1200 DA+", dispo: true },
                { name: "Grill Palace", note: 4.3, emoji: "🔥", prix: "800 DA+", dispo: true },
                { name: "Dar El Kef", note: 4.5, emoji: "🏺", prix: "900 DA+", dispo: true },
              ].map((r, i) => (
                <div key={i} onClick={() => onNavigate("search_results")} style={{
                  minWidth: 120, background: c.card, borderRadius: 14, overflow: "hidden",
                  border: `1px solid ${i === 0 ? c.accent + "60" : c.cardBorder}`,
                  cursor: "pointer", flexShrink: 0,
                  boxShadow: i === 0 ? `0 4px 16px ${c.accent}20` : "none"
                }}>
                  <div style={{ height: 56, background: "linear-gradient(135deg,#2a1f14,#1a1209)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{r.emoji}</div>
                  <div style={{ padding: "7px 8px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.text }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: c.accent }}>★ {r.note}</div>
                    <div style={{ fontSize: 10, color: c.textDim }}>{r.prix}</div>
                    <div style={{ marginTop: 4 }}>
                      <Tag color={c.greenSoft} textColor={c.green} size="sm">✓ Dispo</Tag>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: "6px 12px 12px" }}>
          <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 8 }}>24 résultats · triés par distance</div>
          {[
            { name: "Le Tantra", q: "Hydra · 0.8 km", note: 4.7, avis: 312, emoji: "🎋", prix: "1200–2500 DA", dispo: true },
            { name: "Grill Palace", q: "Ben Aknoun · 1.2 km", note: 4.3, avis: 87, emoji: "🔥", prix: "800–1800 DA", dispo: true },
            { name: "Dar El Kef", q: "El Biar · 1.8 km", note: 4.5, avis: 198, emoji: "🏺", prix: "900–1600 DA", dispo: true },
            { name: "Le Béarnais", q: "Centre · 2.4 km", note: 4.6, avis: 241, emoji: "🍷", prix: "1500–3000 DA", dispo: false },
          ].map((r, i) => (
            <div key={i} onClick={() => onNavigate("search_results")} style={{ background: c.card, borderRadius: 14, padding: "10px 12px", marginBottom: 8, border: `1px solid ${c.cardBorder}`, cursor: "pointer", display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: "linear-gradient(135deg,#2a1f14,#1a1209)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{r.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: c.accent, fontWeight: 700 }}>★ {r.note}</div>
                </div>
                <div style={{ fontSize: 10, color: c.textMuted }}>{r.q}</div>
                <div style={{ fontSize: 10, color: c.textDim }}>{r.prix}</div>
                <div style={{ marginTop: 4 }}>
                  <Tag color={r.dispo ? c.greenSoft : c.redSoft} textColor={r.dispo ? c.green : c.red} size="sm">
                    {r.dispo ? "✓ Dispo ce soir" : "✗ Complet"}
                  </Tag>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <NavBar active="search_map" onNavigate={onNavigate} />
    </div>
  );
};

const SearchFiltersScreen = ({ onNavigate }) => {
  const [budget, setBudget] = useState(2000);
  return (
    <div>
      <Header title="Filtres avancés" back onBack={() => onNavigate("search_map")}
        right={<span onClick={() => onNavigate("search_map")} style={{ fontSize: 11, color: c.red, fontWeight: 700, cursor: "pointer" }}>Réinitialiser</span>}
      />
      <div style={{ padding: "14px 16px" }}>

        <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8 }}>📍 Rayon de recherche</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {["500m", "1 km", "3 km", "5 km", "10 km"].map((r, i) => (
            <div key={i} style={{
              flex: 1, padding: "7px 0", borderRadius: 10, textAlign: "center", cursor: "pointer",
              background: i === 2 ? c.accent : c.card,
              color: i === 2 ? "#000" : c.textMuted,
              fontSize: 10, fontWeight: i === 2 ? 800 : 400,
              border: `1px solid ${i === 2 ? "transparent" : c.cardBorder}`
            }}>{r}</div>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8 }}>💰 Budget max par personne</div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: c.textDim }}>500 DA</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: c.accent }}>{budget.toLocaleString()} DA</span>
            <span style={{ fontSize: 11, color: c.textDim }}>5 000 DA</span>
          </div>
          <div style={{ height: 6, background: c.cardBorder, borderRadius: 3, position: "relative", cursor: "pointer" }} onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const pct = (e.clientX - rect.left) / rect.width; setBudget(Math.round(500 + pct * 4500)); }}>
            <div style={{ width: `${((budget - 500) / 4500) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${c.accentDim}, ${c.accent})`, borderRadius: 3 }} />
            <div style={{ position: "absolute", top: "50%", left: `${((budget - 500) / 4500) * 100}%`, transform: "translate(-50%,-50%)", width: 16, height: 16, borderRadius: "50%", background: c.accent, border: "2px solid #000", boxShadow: "0 2px 8px #000a" }} />
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8 }}>⭐ Note minimum</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {["Toutes", "3+", "4+", "4.5+"].map((v, i) => (
            <div key={i} style={{
              flex: 1, padding: "7px 0", borderRadius: 10, textAlign: "center", cursor: "pointer",
              background: i === 2 ? c.accentSoft : c.card,
              color: i === 2 ? c.accent : c.textMuted,
              fontSize: 11, fontWeight: i === 2 ? 800 : 400,
              border: `1px solid ${i === 2 ? c.accent + "50" : c.cardBorder}`
            }}>{v}</div>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8 }}>🍽️ Type de cuisine</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {["🍖 Grillades", "🥘 Traditionnel", "🍕 Pizza", "🍣 Sushi", "🥗 Végétarien", "🍔 Burger", "🕌 Turc", "🌊 Poisson"].map((t, i) => (
            <div key={i} style={{
              padding: "5px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer",
              background: [0, 1].includes(i) ? c.accentSoft : c.card,
              color: [0, 1].includes(i) ? c.accent : c.textMuted,
              border: `1px solid ${[0, 1].includes(i) ? c.accent + "50" : c.cardBorder}`,
              fontWeight: [0, 1].includes(i) ? 700 : 400
            }}>{t}</div>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8 }}>🕐 Disponibilité</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {["Ce soir", "Demain", "Ce weekend", "Choisir"].map((v, i) => (
            <div key={i} style={{
              flex: 1, padding: "7px 0", borderRadius: 10, textAlign: "center", cursor: "pointer",
              background: i === 0 ? c.accentSoft : c.card,
              color: i === 0 ? c.accent : c.textMuted,
              fontSize: 10, fontWeight: i === 0 ? 800 : 400,
              border: `1px solid ${i === 0 ? c.accent + "50" : c.cardBorder}`
            }}>{v}</div>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8 }}>✨ Équipements</div>
        <div style={{ background: c.card, borderRadius: 12, padding: "0 12px", border: `1px solid ${c.cardBorder}`, marginBottom: 16 }}>
          {[
            { label: "🅿️ Parking disponible", on: true },
            { label: "❄️ Climatisation", on: true },
            { label: "🌿 Terrasse", on: false },
            { label: "♿ Accessible PMR", on: false },
            { label: "📶 Wi-Fi gratuit", on: false },
          ].map((item, i) => <Toggle key={i} label={item.label} on={item.on} />)}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" onClick={() => onNavigate("search_map")} small>Annuler</Btn>
          <Btn onClick={() => onNavigate("search_results")}>Voir les résultats →</Btn>
        </div>
      </div>
    </div>
  );
};

const SearchResultsScreen = ({ onNavigate }) => (
  <div>
    <div style={{ padding: "12px 16px 8px" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <span onClick={() => onNavigate("search_map")} style={{ fontSize: 20, color: c.textMuted, cursor: "pointer" }}>←</span>
        <div style={{ flex: 1, background: c.card, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: c.textMuted, fontSize: 12 }}>🔍</span>
          <span style={{ fontSize: 12, color: c.text }}>Grillades · Hydra · ≤2000 DA</span>
        </div>
        <span onClick={() => onNavigate("search_filters")} style={{ fontSize: 18, cursor: "pointer" }}>⚙️</span>
      </div>
      <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4, marginBottom: 6 }}>
        {["Pertinence", "Note ↓", "Distance ↑", "Prix ↑"].map((s, i) => (
          <div key={i} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 10, whiteSpace: "nowrap", cursor: "pointer", background: i === 0 ? c.accentSoft : c.card, color: i === 0 ? c.accent : c.textMuted, border: `1px solid ${i === 0 ? c.accent + "40" : c.cardBorder}`, fontWeight: i === 0 ? 700 : 400 }}>{s}</div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: c.textMuted }}>12 résultats · Grillades · Hydra · ≤2000 DA/pers</div>
    </div>
    <div style={{ padding: "4px 16px 12px" }}>
      {[
        { name: "Le Tantra", q: "Hydra · 0.8 km", note: 4.7, avis: 312, emoji: "🎋", prix: "1400 DA", dispo: true, promo: "-20%" },
        { name: "Grill Palace", q: "Ben Aknoun · 1.2 km", note: 4.3, avis: 87, emoji: "🔥", prix: "900 DA", dispo: true, promo: null },
        { name: "Brasa Alger", q: "Hydra · 1.5 km", note: 4.1, avis: 54, emoji: "🥩", prix: "1200 DA", dispo: true, promo: null },
        { name: "Le Méchoui d'Or", q: "El Biar · 2.1 km", note: 4.4, avis: 178, emoji: "🍖", prix: "1600 DA", dispo: false, promo: null },
      ].map((r, i) => (
        <div key={i} style={{ background: c.card, borderRadius: 14, marginBottom: 10, overflow: "hidden", border: `1px solid ${c.cardBorder}`, cursor: "pointer", opacity: r.dispo ? 1 : 0.6 }}>
          <div style={{ height: 80, background: "linear-gradient(135deg,#2a1f14,#1a1209)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, position: "relative" }}>
            {r.emoji}
            {r.promo && <div style={{ position: "absolute", top: 8, right: 8, background: c.accent, color: "#000", borderRadius: 8, padding: "3px 8px", fontSize: 10, fontWeight: 800 }}>{r.promo}</div>}
          </div>
          <div style={{ padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{r.name}</div>
                <div style={{ fontSize: 11, color: c.textMuted }}>{r.q}</div>
                <div style={{ fontSize: 11, color: c.textDim, marginTop: 1 }}>Grillades · {r.prix} / pers.</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: c.accent, fontWeight: 800 }}>★ {r.note}</div>
                <div style={{ fontSize: 10, color: c.textDim }}>{r.avis} avis</div>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <Tag color={r.dispo ? c.greenSoft : c.redSoft} textColor={r.dispo ? c.green : c.red} size="sm">
                {r.dispo ? "✓ Dispo ce soir" : "✗ Complet"}
              </Tag>
            </div>
          </div>
        </div>
      ))}
    </div>
    <NavBar active="search_map" onNavigate={onNavigate} />
  </div>
);

const SearchSuggestScreen = ({ onNavigate }) => (
  <div>
    <div style={{ padding: "14px 16px 10px" }}>
      <div style={{ background: c.card, border: `1.5px solid ${c.accent}`, borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ color: c.accent }}>🔍</span>
        <span style={{ fontSize: 13, color: c.text, flex: 1 }}>tajin</span>
        <span style={{ color: c.textDim, fontSize: 11, cursor: "pointer" }}>✕</span>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: c.accent, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>✨ Suggestions</div>
      {["Tajine de poulet", "Tajine de poisson", "Tajine aux légumes", "Restaurant tajine Alger"].map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${c.cardBorder}`, cursor: "pointer", alignItems: "center" }}>
          <span style={{ fontSize: 14, color: c.textDim }}>{i < 3 ? "🍽️" : "🔍"}</span>
          <span style={{ fontSize: 13, color: c.text, flex: 1 }}>{s}</span>
          <span style={{ color: c.textDim, fontSize: 11 }}>↗</span>
        </div>
      ))}

      <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8, marginTop: 14 }}>🕐 Recherches récentes</div>
      {["Grillades Hydra", "Sushi Alger", "Restaurant romantique"].map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: `1px solid ${c.cardBorder}`, cursor: "pointer", alignItems: "center" }}>
          <span style={{ fontSize: 14, color: c.textDim }}>🕐</span>
          <span style={{ fontSize: 12, color: c.textMuted, flex: 1 }}>{s}</span>
          <span style={{ color: c.textDim, fontSize: 12, cursor: "pointer" }}>✕</span>
        </div>
      ))}

      <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 10, marginTop: 14 }}>🔥 Tendances à Alger</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {["🍖 Grillades", "🥘 Couscous", "🍕 Pizza", "🍣 Sushi", "🔥 Fusion", "🌊 Poisson"].map((t, i) => (
          <div key={i} style={{ padding: "5px 10px", borderRadius: 20, fontSize: 11, background: c.card, color: c.textMuted, border: `1px solid ${c.cardBorder}`, cursor: "pointer" }}>{t}</div>
        ))}
      </div>
    </div>
    <NavBar active="search_map" onNavigate={onNavigate} />
  </div>
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 2 — ÉTATS SYSTÈME
// ══════════════════════════════════════════════════════════════════════════

const StateScreen = ({ icon, title, sub, detail, actions, children }) => (
  <div style={{ minHeight: 560, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center", gap: 0 }}>
    <div style={{ fontSize: 56, marginBottom: 18 }}>{icon}</div>
    <div style={{ fontSize: 20, fontWeight: 900, color: c.text, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.7, marginBottom: 20, maxWidth: 210 }}>{sub}</div>
    {detail && (
      <div style={{ background: c.card, borderRadius: 12, padding: "10px 14px", border: `1px solid ${c.cardBorder}`, width: "100%", marginBottom: 18, textAlign: "left" }}>
        {detail}
      </div>
    )}
    {children}
    {actions && (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
        {actions}
      </div>
    )}
  </div>
);

const Err404Screen = ({ onNavigate }) => (
  <StateScreen
    icon="🍽️"
    title="Page introuvable"
    sub="Cette page n'existe pas ou a été déplacée. Retourne à l'accueil pour continuer."
    detail={
      <div>
        <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 6 }}>Code erreur : 404</div>
        <div style={{ fontSize: 11, color: c.textDim }}>URL : /restaurant/id-inconnu</div>
      </div>
    }
    actions={[
      <Btn key="1" onClick={() => onNavigate("home")}>Retour à l'accueil</Btn>,
      <Btn key="2" variant="ghost" onClick={() => onNavigate("search_map")}>Chercher un restaurant</Btn>
    ]}
  />
);

const ErrNetworkScreen = ({ onNavigate }) => (
  <StateScreen
    icon="📡"
    title="Pas de connexion"
    sub="Vérifie ta connexion internet et réessaie. Tes données sont sauvegardées localement."
    detail={
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 6 }}>✅ Disponible hors ligne</div>
        {["Réservations à venir", "Favoris sauvegardés", "Profil & points"].map((s, i) => (
          <div key={i} style={{ fontSize: 11, color: c.textMuted, marginBottom: 3 }}>• {s}</div>
        ))}
      </div>
    }
    actions={[
      <Btn key="1" onClick={() => onNavigate("home")}>🔄 Réessayer</Btn>,
      <Btn key="2" variant="ghost">Mode hors ligne</Btn>
    ]}
  />
);

const ErrServerScreen = ({ onNavigate }) => (
  <StateScreen
    icon="⚙️"
    title="Erreur serveur"
    sub="Une erreur inattendue s'est produite de notre côté. Notre équipe a été notifiée."
    detail={
      <div>
        <div style={{ fontSize: 11, color: c.textDim }}>Code : 500 · Réf. #MDA-ERR-8821</div>
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>Si le problème persiste, contacte le support.</div>
      </div>
    }
    actions={[
      <Btn key="1" onClick={() => onNavigate("home")}>🔄 Réessayer</Btn>,
      <Btn key="2" variant="ghost" onClick={() => onNavigate("aide_chat")}>Contacter le support</Btn>
    ]}
  />
);

const ErrMaintenanceScreen = ({ onNavigate }) => (
  <StateScreen
    icon="🔧"
    title="Maintenance en cours"
    sub="Mida est temporairement indisponible pour une mise à jour. On revient très vite !"
    detail={
      <div>
        <div style={{ fontSize: 11, color: c.accent, fontWeight: 700, marginBottom: 6 }}>⏱ Durée estimée : 30 min</div>
        <div style={{ fontSize: 11, color: c.textMuted }}>Début : 02h00 · Fin estimée : 02h30</div>
        <div style={{ height: 4, background: c.cardBorder, borderRadius: 2, marginTop: 8 }}>
          <div style={{ width: "65%", height: "100%", background: c.accent, borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 10, color: c.textDim, marginTop: 4 }}>65% complété</div>
      </div>
    }
    actions={[
      <Btn key="1" variant="ghost">🔔 Me notifier au retour</Btn>
    ]}
  />
);

const LoadingScreen = ({ onNavigate }) => (
  <div style={{ minHeight: 560, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 40, fontWeight: 900, color: c.accent, fontFamily: "Georgia, serif", marginBottom: 24 }}>mida</div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === 1 ? c.accent : c.accentSoft, border: `1px solid ${c.accent}` }} />
        ))}
      </div>
    </div>
    <div style={{ width: "60%", height: 3, background: c.cardBorder, borderRadius: 2 }}>
      <div style={{ width: "70%", height: "100%", background: `linear-gradient(90deg, ${c.accentDim}, ${c.accent})`, borderRadius: 2 }} />
    </div>
    <div style={{ fontSize: 12, color: c.textMuted }}>Chargement des restaurants…</div>
    <div style={{ position: "absolute", bottom: 40, display: "flex", flexDirection: "column", gap: 10, width: "80%" }}>
      {[1, 2].map(i => (
        <div key={i} style={{ background: c.card, borderRadius: 14, padding: 12, border: `1px solid ${c.cardBorder}`, display: "flex", gap: 10 }}>
          <div style={{ width: 50, height: 50, borderRadius: 10, background: c.cardBorder }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
            <div style={{ height: 10, background: c.cardBorder, borderRadius: 4, width: "70%" }} />
            <div style={{ height: 8, background: c.cardBorder, borderRadius: 4, width: "50%" }} />
            <div style={{ height: 8, background: c.cardBorder, borderRadius: 4, width: "40%" }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════
// SECTION 3 — PARAMÈTRES & LÉGAL
// ══════════════════════════════════════════════════════════════════════════

const SettingsScreen = ({ onNavigate }) => (
  <div>
    <Header title="Paramètres" />
    <div style={{ padding: "12px 16px" }}>
      {[
        {
          section: "🔔 Notifications",
          items: [{ label: "Paramètres notifications", screen: "settings_notifs", sub: "Promos, réservations, rappels" }]
        },
        {
          section: "🌐 Langue & région",
          items: [{ label: "Langue de l'app", screen: "settings_langue", sub: "Français" }]
        },
        {
          section: "🔒 Compte & sécurité",
          items: [
            { label: "Changer le mot de passe", screen: null, sub: null },
            { label: "Authentification 2 facteurs", screen: null, sub: "Désactivée" },
            { label: "Sessions actives", screen: null, sub: "2 appareils" },
          ]
        },
        {
          section: "📄 Légal",
          items: [
            { label: "Conditions d'utilisation", screen: "cgu", sub: null },
            { label: "Politique de confidentialité", screen: "cgu", sub: null },
            { label: "Gestion des cookies", screen: null, sub: null },
          ]
        },
        {
          section: "❓ Aide",
          items: [
            { label: "Centre d'aide & FAQ", screen: "aide", sub: null },
            { label: "Contacter le support", screen: "aide_chat", sub: null },
            { label: "Signaler un problème", screen: null, sub: null },
          ]
        },
        {
          section: "ℹ️ À propos",
          items: [
            { label: "Version de l'app", screen: null, sub: "Mida v1.0.0" },
            { label: "Mentions légales", screen: null, sub: null },
          ]
        },
      ].map((group, gi) => (
        <div key={gi} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: c.accent, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{group.section}</div>
          <div style={{ background: c.card, borderRadius: 14, overflow: "hidden", border: `1px solid ${c.cardBorder}` }}>
            {group.items.map((item, i) => (
              <div key={i} onClick={() => item.screen && onNavigate(item.screen)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: i < group.items.length - 1 ? `1px solid ${c.cardBorder}` : "none", cursor: item.screen ? "pointer" : "default" }}>
                <div>
                  <div style={{ fontSize: 13, color: c.text }}>{item.label}</div>
                  {item.sub && <div style={{ fontSize: 10, color: c.textDim, marginTop: 2 }}>{item.sub}</div>}
                </div>
                {item.screen && <span style={{ color: c.textDim }}>›</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
    <NavBar active="settings" onNavigate={onNavigate} />
  </div>
);

const SettingsLangueScreen = ({ onNavigate }) => (
  <div>
    <Header title="Langue & région" back onBack={() => onNavigate("settings")} />
    <div style={{ padding: "14px 16px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 10 }}>🌐 Langue de l'application</div>
      <div style={{ background: c.card, borderRadius: 14, overflow: "hidden", border: `1px solid ${c.cardBorder}`, marginBottom: 16 }}>
        {[
          { code: "🇫🇷", label: "Français", active: true },
          { code: "🇩🇿", label: "العربية (Arabe)", active: false },
          { code: "🇬🇧", label: "English", active: false },
          { code: "🇲🇦", label: "Amazigh (Tamazight)", active: false },
        ].map((lang, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 14px", borderBottom: i < 3 ? `1px solid ${c.cardBorder}` : "none", cursor: "pointer", background: lang.active ? c.accentSoft : "transparent" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 20 }}>{lang.code}</span>
              <span style={{ fontSize: 13, color: lang.active ? c.accent : c.text, fontWeight: lang.active ? 700 : 400 }}>{lang.label}</span>
            </div>
            {lang.active && <span style={{ color: c.accent, fontSize: 14 }}>✓</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 10 }}>📍 Devise</div>
      <div style={{ background: c.card, borderRadius: 14, overflow: "hidden", border: `1px solid ${c.cardBorder}` }}>
        {[["DZD · Dinar algérien", true], ["EUR · Euro", false], ["USD · Dollar", false]].map(([label, active], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: i < 2 ? `1px solid ${c.cardBorder}` : "none", cursor: "pointer", background: active ? c.accentSoft : "transparent" }}>
            <span style={{ fontSize: 12, color: active ? c.accent : c.text, fontWeight: active ? 700 : 400 }}>{label}</span>
            {active && <span style={{ color: c.accent }}>✓</span>}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SettingsNotifsScreen = ({ onNavigate }) => (
  <div>
    <Header title="Notifications" back onBack={() => onNavigate("settings")} />
    <div style={{ padding: "14px 16px" }}>
      {[
        { section: "📅 Réservations", items: [
          { label: "Confirmation de réservation", on: true },
          { label: "Rappel 2h avant", on: true },
          { label: "Modification / annulation", on: true },
        ]},
        { section: "⭐ Avis", items: [
          { label: "Réponse du restaurateur", on: true },
          { label: "Rappel laisser un avis", on: false },
        ]},
        { section: "🎁 Promos & offres", items: [
          { label: "Nouvelles promos · restaurants favoris", on: true },
          { label: "Promos · restaurants proches", on: false },
          { label: "Offres spéciales Mida", on: true },
        ]},
        { section: "🏅 Points", items: [
          { label: "Nouveaux points gagnés", on: true },
          { label: "Bon disponible à utiliser", on: true },
        ]},
        { section: "📧 Canal", items: [
          { label: "Notifications push", on: true },
          { label: "SMS", on: true },
          { label: "Email", on: false },
        ]},
      ].map((group, gi) => (
        <div key={gi} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: c.accent, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{group.section}</div>
          <div style={{ background: c.card, borderRadius: 14, padding: "0 12px", border: `1px solid ${c.cardBorder}` }}>
            {group.items.map((item, i) => <Toggle key={i} label={item.label} on={item.on} />)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CguScreen = ({ onNavigate }) => (
  <div>
    <Header title="CGU & Confidentialité" back onBack={() => onNavigate("settings")} />
    <div style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {["CGU", "Confidentialité", "Cookies"].map((t, i) => (
          <div key={i} style={{ flex: 1, padding: "7px", borderRadius: 10, textAlign: "center", fontSize: 11, cursor: "pointer", background: i === 0 ? c.accentSoft : c.card, color: i === 0 ? c.accent : c.textMuted, border: `1px solid ${i === 0 ? c.accent + "40" : c.cardBorder}`, fontWeight: i === 0 ? 700 : 400 }}>{t}</div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: c.textDim, marginBottom: 12 }}>Dernière mise à jour : 1er Mai 2025</div>
      {[
        { titre: "1. Objet", texte: "Mida est une plateforme de mise en relation entre clients et restaurants en Algérie. Les présentes CGU régissent l'utilisation de l'application mobile Mida." },
        { titre: "2. Compte utilisateur", texte: "L'inscription est gratuite. Tu es responsable de la confidentialité de tes identifiants. Mida se réserve le droit de suspendre tout compte en cas d'utilisation abusive." },
        { titre: "3. Réservations", texte: "Les réservations effectuées via Mida sont contraignantes. Toute annulation après le délai imparti peut entraîner des pénalités selon la politique du restaurant." },
        { titre: "4. Avis certifiés", texte: "Seuls les clients ayant honoré une réservation peuvent publier un avis. Mida se réserve le droit de modérer les avis non conformes." },
      ].map((art, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 5 }}>{art.titre}</div>
          <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.7 }}>{art.texte}</div>
        </div>
      ))}
      <div style={{ background: c.accentSoft, borderRadius: 12, padding: "10px 12px", border: `1px solid ${c.accent}30`, marginTop: 8 }}>
        <div style={{ fontSize: 11, color: c.accent, fontWeight: 700 }}>📧 Contact légal</div>
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3 }}>legal@mida.dz · Alger, Algérie</div>
      </div>
    </div>
  </div>
);

const AideScreen = ({ onNavigate }) => (
  <div>
    <Header title="Aide & Support" back onBack={() => onNavigate("settings")} />
    <div style={{ padding: "14px 16px" }}>
      <div style={{ background: c.card, borderRadius: 12, padding: "10px 14px", border: `1px solid ${c.cardBorder}`, marginBottom: 14, display: "flex", gap: 8 }}>
        <span style={{ color: c.textMuted }}>🔍</span>
        <span style={{ fontSize: 12, color: c.textDim }}>Rechercher dans l'aide…</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div onClick={() => onNavigate("aide_chat")} style={{ flex: 1, background: c.accentSoft, borderRadius: 14, padding: "14px", textAlign: "center", border: `1px solid ${c.accent}40`, cursor: "pointer" }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>💬</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.accent }}>Chat en direct</div>
          <div style={{ fontSize: 10, color: c.textMuted, marginTop: 2 }}>Réponse en &lt;5 min</div>
        </div>
        <div style={{ flex: 1, background: c.card, borderRadius: 14, padding: "14px", textAlign: "center", border: `1px solid ${c.cardBorder}`, cursor: "pointer" }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>📧</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.text }}>Email</div>
          <div style={{ fontSize: 10, color: c.textMuted, marginTop: 2 }}>support@mida.dz</div>
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 10 }}>❓ Questions fréquentes</div>
      {[
        { q: "Comment annuler une réservation ?", section: "Réservations" },
        { q: "Comment gagner des points Mida ?", section: "Points & Récompenses" },
        { q: "Mon avis n'est pas publié ?", section: "Avis" },
        { q: "Comment modifier mes coordonnées ?", section: "Compte" },
        { q: "Le restaurant n'était pas disponible", section: "Réclamations" },
      ].map((faq, i) => (
        <div key={i} onClick={() => onNavigate("aide_faq")} style={{ background: c.card, borderRadius: 12, padding: "10px 14px", marginBottom: 6, border: `1px solid ${c.cardBorder}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: c.text }}>{faq.q}</div>
            <div style={{ fontSize: 10, color: c.textDim, marginTop: 2 }}>{faq.section}</div>
          </div>
          <span style={{ color: c.textDim }}>›</span>
        </div>
      ))}
    </div>
  </div>
);

const AideFaqScreen = ({ onNavigate }) => (
  <div>
    <Header title="Annuler une réservation" back onBack={() => onNavigate("aide")} />
    <div style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <Tag color={c.blueSoft} textColor={c.blue}>Réservations</Tag>
        <Tag color={c.greenSoft} textColor={c.green}>Résolu ✓</Tag>
      </div>
      {[
        { titre: "Avant le délai (gratuit)", texte: "Pour annuler sans frais, rends-toi dans Profil → Mes réservations → sélectionne la réservation → Annuler. L'annulation est gratuite jusqu'à 2h avant l'heure de réservation." },
        { titre: "Après le délai (pénalité)", texte: "Si tu annules moins de 2h avant, une pénalité de 500 DA sera prélevée. Tu peux aussi appeler directement le restaurant pour tenter une annulation amiable." },
        { titre: "No-show (non-présentation)", texte: "Si tu ne te présentes pas sans annuler, la pénalité complète sera appliquée et ta note de fiabilité sera affectée." },
      ].map((s, i) => (
        <div key={i} style={{ marginBottom: 14, background: c.card, borderRadius: 12, padding: "12px", border: `1px solid ${c.cardBorder}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.accent, marginBottom: 6 }}>{s.titre}</div>
          <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.7 }}>{s.texte}</div>
        </div>
      ))}
      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <div style={{ flex: 1, background: c.greenSoft, borderRadius: 10, padding: "10px", textAlign: "center", fontSize: 12, color: c.green, fontWeight: 700, cursor: "pointer" }}>👍 Utile</div>
        <div style={{ flex: 1, background: c.redSoft, borderRadius: 10, padding: "10px", textAlign: "center", fontSize: 12, color: c.red, fontWeight: 700, cursor: "pointer" }}>👎 Pas utile</div>
      </div>
      <div style={{ marginTop: 10 }}>
        <Btn variant="ghost" onClick={() => onNavigate("aide_chat")}>💬 Parler à un agent</Btn>
      </div>
    </div>
  </div>
);

const AideChatScreen = ({ onNavigate }) => {
  const messages = [
    { from: "bot", text: "Bonjour ! Je suis l'assistant Mida 👋 Comment puis-je t'aider ?", time: "10:00" },
    { from: "user", text: "J'ai un problème avec ma réservation chez Le Tantra", time: "10:01" },
    { from: "bot", text: "Je comprends. Peux-tu me donner le numéro de ta réservation ? (format #MDA-XXXX)", time: "10:01" },
    { from: "user", text: "#MDA-4872", time: "10:02" },
    { from: "bot", text: "J'ai trouvé ta réservation : Le Tantra · 26 Mai · 20h00 · 2 personnes. Quel est le problème ?", time: "10:02" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: 560 }}>
      <Header title="Support Mida" sub="En ligne · Réponse en &lt;5 min" back onBack={() => onNavigate("aide")}
        right={<div style={{ width: 8, height: 8, borderRadius: "50%", background: c.green, boxShadow: `0 0 6px ${c.green}` }} />}
      />
      <div style={{ flex: 1, padding: "12px 14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start", gap: 6, alignItems: "flex-end" }}>
            {msg.from === "bot" && (
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: c.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>M</div>
            )}
            <div style={{ maxWidth: "75%" }}>
              <div style={{
                background: msg.from === "user" ? c.accent : c.card,
                color: msg.from === "user" ? "#000" : c.text,
                borderRadius: msg.from === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                padding: "9px 12px", fontSize: 12, lineHeight: 1.5,
                border: msg.from === "bot" ? `1px solid ${c.cardBorder}` : "none"
              }}>{msg.text}</div>
              <div style={{ fontSize: 9, color: c.textDim, marginTop: 3, textAlign: msg.from === "user" ? "right" : "left" }}>{msg.time}</div>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: c.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>M</div>
          <div style={{ background: c.card, borderRadius: 14, padding: "9px 14px", border: `1px solid ${c.cardBorder}` }}>
            <div style={{ display: "flex", gap: 3 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: c.textDim }} />)}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: "8px 12px", borderTop: `1px solid ${c.cardBorder}`, background: c.card, display: "flex", gap: 8 }}>
        <div style={{ flex: 1, background: c.bg, borderRadius: 12, padding: "9px 12px", fontSize: 12, color: c.textDim, border: `1px solid ${c.cardBorder}` }}>Tape ton message…</div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: c.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer" }}>→</div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// SECTION 4 — DESIGN SYSTEM
// ══════════════════════════════════════════════════════════════════════════

const DsColorsScreen = () => (
  <div style={{ padding: "14px 16px" }}>
    <div style={{ fontSize: 15, fontWeight: 800, color: c.text, marginBottom: 4 }}>Design System</div>
    <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 14 }}>Palette de couleurs officielle Mida</div>
    {[
      { label: "Accent principal", hex: "#E8A045", token: "--accent" },
      { label: "Accent dim", hex: "#C4863A", token: "--accent-dim" },
      { label: "Background", hex: "#0F0D0B", token: "--bg" },
      { label: "Card", hex: "#1A1714", token: "--card" },
      { label: "Card border", hex: "#2A2520", token: "--card-border" },
      { label: "Text", hex: "#F0EBE3", token: "--text" },
      { label: "Text muted", hex: "#8A7F74", token: "--text-muted" },
      { label: "Text dim", hex: "#5A5148", token: "--text-dim" },
      { label: "Success", hex: "#4CAF82", token: "--green" },
      { label: "Error", hex: "#E05A5A", token: "--red" },
      { label: "Info", hex: "#5A9BE0", token: "--blue" },
      { label: "Purple", hex: "#9B7FE8", token: "--purple" },
    ].map((col, i) => (
      <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: col.hex, border: "1px solid #ffffff20", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{col.label}</div>
          <div style={{ fontSize: 10, color: c.textDim }}>{col.hex} · {col.token}</div>
        </div>
      </div>
    ))}
  </div>
);

const DsTypoScreen = () => (
  <div style={{ padding: "14px 16px" }}>
    <div style={{ fontSize: 15, fontWeight: 800, color: c.text, marginBottom: 4 }}>Design System</div>
    <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 16 }}>Typographie</div>
    {[
      { label: "Display · 36px · 900", sample: "mida", style: { fontSize: 36, fontWeight: 900, color: c.accent, fontFamily: "Georgia, serif" } },
      { label: "H1 · 20px · 800", sample: "Le Tantra", style: { fontSize: 20, fontWeight: 800, color: c.text } },
      { label: "H2 · 16px · 700", sample: "Mes réservations", style: { fontSize: 16, fontWeight: 700, color: c.text } },
      { label: "H3 · 14px · 700", sample: "Grillades · Hydra", style: { fontSize: 14, fontWeight: 700, color: c.text } },
      { label: "Body · 13px · 400", sample: "Cuisine fusion au cœur de Hydra. Spécialités de grillades, ambiance chaleureuse.", style: { fontSize: 13, fontWeight: 400, color: c.textMuted, lineHeight: 1.6 } },
      { label: "Caption · 11px · 400", sample: "il y a 2 heures · Hydra · 312 avis", style: { fontSize: 11, fontWeight: 400, color: c.textDim } },
      { label: "Badge · 11px · 700", sample: "✓ Avis vérifié via Mida", style: { fontSize: 11, fontWeight: 700, color: c.accent, background: c.accentSoft, padding: "3px 10px", borderRadius: 20, display: "inline-block" } },
    ].map((item, i) => (
      <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${c.cardBorder}` }}>
        <div style={{ fontSize: 10, color: c.textDim, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</div>
        <div style={item.style}>{item.sample}</div>
      </div>
    ))}
  </div>
);

const DsComponentsScreen = ({ onNavigate }) => (
  <div style={{ padding: "14px 16px" }}>
    <div style={{ fontSize: 15, fontWeight: 800, color: c.text, marginBottom: 4 }}>Design System</div>
    <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 14 }}>Composants UI</div>

    <div style={{ fontSize: 12, fontWeight: 700, color: c.accent, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Boutons</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
      {[
        { label: "Primary", bg: c.accent, col: "#000" },
        { label: "Secondary", bg: "transparent", col: c.accent, border: `1.5px solid ${c.accent}` },
        { label: "Ghost", bg: c.card, col: c.textMuted, border: `1px solid ${c.cardBorder}` },
        { label: "Danger", bg: c.redSoft, col: c.red, border: `1px solid ${c.red}40` },
      ].map((btn, i) => (
        <div key={i} style={{ background: btn.bg, color: btn.col, border: btn.border || "none", borderRadius: 14, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 800 }}>{btn.label}</div>
      ))}
    </div>

    <div style={{ fontSize: 12, fontWeight: 700, color: c.accent, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Tags</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
      {[
        { label: "✓ Dispo", bg: c.greenSoft, col: c.green },
        { label: "✗ Complet", bg: c.redSoft, col: c.red },
        { label: "★ 4.7", bg: c.accentSoft, col: c.accent },
        { label: "−20%", bg: c.accentSoft, col: c.accent },
        { label: "Avis vérifié", bg: c.greenSoft, col: c.green },
        { label: "🕐 12h–23h", bg: c.accentSoft, col: c.accent },
      ].map((tag, i) => (
        <div key={i} style={{ background: tag.bg, color: tag.col, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 600 }}>{tag.label}</div>
      ))}
    </div>

    <div style={{ fontSize: 12, fontWeight: 700, color: c.accent, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Input</div>
    <div style={{ background: c.card, border: `1.5px solid ${c.accent}60`, borderRadius: 12, padding: "10px 12px", display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
      <span style={{ fontSize: 14 }}>🔍</span>
      <span style={{ fontSize: 13, color: c.text }}>Restaurant, quartier…</span>
    </div>
    <div style={{ background: c.card, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: "10px 12px", display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
      <span style={{ fontSize: 14 }}>✉️</span>
      <span style={{ fontSize: 13, color: c.textDim }}>ton@email.com</span>
    </div>

    <div style={{ fontSize: 12, fontWeight: 700, color: c.accent, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Toggle</div>
    <div style={{ background: c.card, borderRadius: 14, padding: "0 12px", border: `1px solid ${c.cardBorder}`, marginBottom: 16 }}>
      <Toggle label="Notifications activées" on={true} />
      <Toggle label="Mode sombre" on={false} />
    </div>

    <div style={{ fontSize: 12, fontWeight: 700, color: c.accent, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Carte restaurant</div>
    <div style={{ background: c.card, borderRadius: 14, overflow: "hidden", border: `1px solid ${c.cardBorder}` }}>
      <div style={{ height: 70, background: "linear-gradient(135deg,#2a1f14,#1a1209)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>🎋</div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>Le Tantra</div>
          <div style={{ fontSize: 13, color: c.accent, fontWeight: 800 }}>★ 4.7</div>
        </div>
        <div style={{ fontSize: 11, color: c.textMuted }}>Hydra · Fusion · 1200 DA+</div>
        <div style={{ marginTop: 6 }}><Tag color={c.greenSoft} textColor={c.green} size="sm">✓ Dispo ce soir</Tag></div>
      </div>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════

const screenGroups = [
  { title: "🔍 Recherche avancée", screens: ["search_map", "search_filters", "search_results", "search_suggest"] },
  { title: "⚠️ États système", screens: ["err_404", "err_network", "err_server", "err_maintenance", "loading"] },
  { title: "⚙️ Paramètres & légal", screens: ["settings", "settings_langue", "settings_notifs", "cgu"] },
  { title: "❓ Aide & Support", screens: ["aide", "aide_faq", "aide_chat"] },
  { title: "🎨 Design System", screens: ["ds_colors", "ds_typo", "ds_components"] },
];

export default function MidaTransversalWireframes() {
  const [active, setActive] = useState("search_map");

  const renderScreen = (screen) => {
    const p = { onNavigate: setActive };
    switch (screen) {
      case "search_map": return <SearchMapScreen {...p} />;
      case "search_filters": return <SearchFiltersScreen {...p} />;
      case "search_results": return <SearchResultsScreen {...p} />;
      case "search_suggest": return <SearchSuggestScreen {...p} />;
      case "err_404": return <Err404Screen {...p} />;
      case "err_network": return <ErrNetworkScreen {...p} />;
      case "err_server": return <ErrServerScreen {...p} />;
      case "err_maintenance": return <ErrMaintenanceScreen {...p} />;
      case "loading": return <LoadingScreen {...p} />;
      case "settings": return <SettingsScreen {...p} />;
      case "settings_langue": return <SettingsLangueScreen {...p} />;
      case "settings_notifs": return <SettingsNotifsScreen {...p} />;
      case "cgu": return <CguScreen {...p} />;
      case "aide": return <AideScreen {...p} />;
      case "aide_faq": return <AideFaqScreen {...p} />;
      case "aide_chat": return <AideChatScreen {...p} />;
      case "ds_colors": return <DsColorsScreen />;
      case "ds_typo": return <DsTypoScreen />;
      case "ds_components": return <DsComponentsScreen {...p} />;
      default: return <div style={{ padding: 20, color: c.text }}>{screen}</div>;
    }
  };

  const total = Object.keys(screenLabels).length;

  return (
    <div style={{ background: "#080706", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", color: c.text }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: c.accent, letterSpacing: -1, fontFamily: "Georgia, serif" }}>mida</div>
          <div style={{ fontSize: 13, color: c.textMuted, letterSpacing: 2, textTransform: "uppercase" }}>Transversal · Wireframes v1.0</div>
          <div style={{ fontSize: 11, color: c.textDim, marginTop: 4 }}>{total} écrans · Cliquez pour naviguer</div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
          {screenGroups.map(group => (
            <div key={group.title} style={{ background: c.card, borderRadius: 14, padding: "10px 12px", border: `1px solid ${c.cardBorder}` }}>
              <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 7, fontWeight: 600 }}>{group.title}</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {group.screens.map(s => (
                  <div key={s} onClick={() => setActive(s)} style={{
                    padding: "4px 9px", borderRadius: 8, fontSize: 10, cursor: "pointer",
                    background: active === s ? c.accent : "#2a2520",
                    color: active === s ? "#000" : c.textMuted,
                    fontWeight: active === s ? 700 : 400,
                    border: `1px solid ${active === s ? "transparent" : c.cardBorder}`
                  }}>{screenLabels[s]}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <Phone label={screenLabels[active]}>
            {renderScreen(active)}
          </Phone>
        </div>

        {/* Récap global */}
        <div style={{ marginTop: 28, maxWidth: 700, margin: "28px auto 0" }}>
          <div style={{ background: c.card, borderRadius: 16, padding: "16px 20px", border: `1px solid ${c.cardBorder}`, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 12 }}>🗂️ Récap complet · Tous wireframes Mida</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["Wireframe principal", "12 écrans"],
                ["Auth & Accès", "15 écrans"],
                ["Côté Client", "16 écrans"],
                ["Côté Restaurateur", "17 écrans"],
                ["Transversal", `${total} écrans`],
              ].map(([label, count], i) => (
                <div key={i} style={{ background: c.bg, borderRadius: 10, padding: "10px 12px", border: `1px solid ${c.cardBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: c.textMuted }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: c.accent }}>{count}</span>
                </div>
              ))}
              <div style={{ background: c.accentSoft, borderRadius: 10, padding: "10px 12px", border: `1px solid ${c.accent}40`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: c.accent }}>TOTAL</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: c.accent }}>{12+15+16+17+total} écrans</span>
              </div>
            </div>
          </div>

          <div style={{ background: c.card, borderRadius: 16, padding: "16px 20px", border: `1px solid ${c.cardBorder}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>✅ Écrans transversaux couverts</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              {Object.values(screenLabels).map((label, i) => (
                <div key={i} style={{ fontSize: 11, color: c.textMuted }}>✅ {label}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
