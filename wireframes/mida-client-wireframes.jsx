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
};

const screenLabels = {
  notifs: "Notifications",
  notifs_empty: "Notifications · Vide",
  cancel1: "Annulation · Raison",
  cancel2: "Annulation · Confirmation",
  cancel3: "Annulation · Validée",
  cancel_late: "Annulation · Pénalité",
  avis1: "Laisser un avis · Note",
  avis2: "Laisser un avis · Détail",
  avis3: "Avis · Publié",
  favoris: "Mes favoris",
  favoris_empty: "Favoris · Vide",
  points: "Points & Récompenses",
  points_history: "Historique des points",
  carte: "Carte des restaurants",
  erreur: "Erreur réseau",
  vide: "État vide recherche",
};

// ── COMPOSANTS ────────────────────────────────────────────────────────────

const Phone = ({ children, label, sublabel }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
    {label && (
      <div style={{ textAlign: "center" }}>
        <div style={{ color: c.text, fontWeight: 700, fontSize: 13 }}>{label}</div>
        {sublabel && <div style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>{sublabel}</div>}
      </div>
    )}
    <div style={{
      width: 280, background: "#111", borderRadius: 36,
      boxShadow: "0 24px 64px #000c, 0 0 0 2px #2a2a2a",
      overflow: "hidden",
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

const Tag = ({ children, color = c.accentSoft, textColor = c.accent }) => (
  <span style={{ background: color, color: textColor, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{children}</span>
);

const Btn = ({ children, variant = "primary", onClick, disabled }) => {
  const styles = {
    primary: { background: c.accent, color: "#000", border: "none" },
    secondary: { background: "transparent", color: c.accent, border: `1.5px solid ${c.accent}` },
    ghost: { background: c.card, color: c.textMuted, border: `1px solid ${c.cardBorder}` },
    danger: { background: c.redSoft, color: c.red, border: `1px solid ${c.red}40` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", borderRadius: 14, padding: "14px",
      fontSize: 14, fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer",
      letterSpacing: 0.3, opacity: disabled ? 0.5 : 1, ...styles[variant]
    }}>{children}</button>
  );
};

const NavBar = ({ active, onNavigate }) => {
  const items = [
    { id: "home", icon: "⊞", label: "Accueil" },
    { id: "search", icon: "⊙", label: "Chercher" },
    { id: "favoris", icon: "♡", label: "Favoris" },
    { id: "notifs", icon: "🔔", label: "Alertes", badge: 3 },
    { id: "profil", icon: "◉", label: "Profil" },
  ];
  return (
    <div style={{ display: "flex", justifyContent: "space-around", background: c.card, borderTop: `1px solid ${c.cardBorder}`, padding: "10px 0 6px" }}>
      {items.map(item => (
        <div key={item.id} onClick={() => onNavigate && onNavigate(item.id)}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", position: "relative" }}>
          {item.badge && active !== item.id && (
            <div style={{ position: "absolute", top: -2, right: -4, background: c.red, color: "#fff", borderRadius: "50%", width: 14, height: 14, fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{item.badge}</div>
          )}
          <span style={{ fontSize: 18, color: active === item.id ? c.accent : c.textMuted }}>{item.icon}</span>
          <span style={{ fontSize: 9, color: active === item.id ? c.accent : c.textMuted, fontWeight: active === item.id ? 700 : 400 }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const Header = ({ title, back, onBack, right }) => (
  <div style={{ padding: "16px 16px 10px", borderBottom: `1px solid ${c.cardBorder}`, display: "flex", alignItems: "center", gap: 10 }}>
    {back && <span onClick={onBack} style={{ fontSize: 20, color: c.textMuted, cursor: "pointer", flexShrink: 0 }}>←</span>}
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>{title}</div>
    </div>
    {right}
  </div>
);

const Stars = ({ n, max = 5, size = 16 }) => (
  <span>{Array.from({ length: max }, (_, i) => (
    <span key={i} style={{ color: i < n ? c.accent : c.cardBorder, fontSize: size }}>★</span>
  ))}</span>
);

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────

const notifsData = [
  {
    id: 1, type: "confirm", icon: "✅", title: "Réservation confirmée",
    body: "Le Tantra · Ce soir 20h00 · 2 personnes",
    time: "il y a 5 min", unread: true, color: c.greenSoft, textColor: c.green,
  },
  {
    id: 2, type: "rappel", icon: "🔔", title: "Rappel · Dans 2h",
    body: "Dar El Kef · 19h30 · N'oublie pas ta réservation !",
    time: "il y a 1h", unread: true, color: c.accentSoft, textColor: c.accent,
  },
  {
    id: 3, type: "promo", icon: "🎁", title: "Promo exclusive ce soir",
    body: "Grill Palace · -25% sur toute la carte avant 21h",
    time: "il y a 2h", unread: true, color: c.purpleSoft, textColor: c.purple,
  },
  {
    id: 4, type: "avis", icon: "💬", title: "Le Tantra a répondu à ton avis",
    body: "\"Merci Amira, on t'attend avec plaisir !\"",
    time: "hier", unread: false, color: c.blueSoft, textColor: c.blue,
  },
  {
    id: 5, type: "points", icon: "🏅", title: "+50 points gagnés",
    body: "Suite à ta visite chez Dar El Kef · Total : 1 290 pts",
    time: "hier", unread: false, color: c.accentSoft, textColor: c.accent,
  },
  {
    id: 6, type: "cancel", icon: "❌", title: "Annulation confirmée",
    body: "Amazonia · 22 Mai · Remboursement en cours",
    time: "il y a 3j", unread: false, color: c.redSoft, textColor: c.red,
  },
];

const NotifsScreen = ({ onNavigate }) => {
  const [notifs, setNotifs] = useState(notifsData);
  const unread = notifs.filter(n => n.unread).length;

  return (
    <div>
      <div style={{ padding: "16px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: c.text }}>Notifications</div>
          {unread > 0 && <div style={{ fontSize: 11, color: c.textMuted }}>{unread} non lues</div>}
        </div>
        <span onClick={() => setNotifs(notifs.map(n => ({ ...n, unread: false })))}
          style={{ fontSize: 11, color: c.accent, cursor: "pointer", fontWeight: 700 }}>
          Tout lire
        </span>
      </div>

      <div style={{ padding: "0 16px 12px" }}>
        {["Aujourd'hui", "Hier", "Cette semaine"].map((groupe, gi) => {
          const items = notifs.filter((_, i) =>
            (gi === 0 && i < 3) || (gi === 1 && i >= 3 && i < 5) || (gi === 2 && i >= 5)
          );
          if (!items.length) return null;
          return (
            <div key={groupe}>
              <div style={{ fontSize: 11, color: c.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: gi > 0 ? 14 : 4 }}>{groupe}</div>
              {items.map(notif => (
                <div key={notif.id} style={{
                  background: notif.unread ? `${notif.color}` : c.card,
                  border: `1px solid ${notif.unread ? notif.textColor + "30" : c.cardBorder}`,
                  borderRadius: 14, padding: "12px", marginBottom: 8,
                  display: "flex", gap: 10, alignItems: "flex-start",
                  cursor: "pointer"
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                    background: notif.color, border: `1px solid ${notif.textColor}30`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
                  }}>{notif.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: notif.unread ? 700 : 500, color: c.text, lineHeight: 1.3 }}>{notif.title}</div>
                      {notif.unread && <div style={{ width: 8, height: 8, borderRadius: "50%", background: notif.textColor, flexShrink: 0, marginTop: 4 }} />}
                    </div>
                    <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3, lineHeight: 1.4 }}>{notif.body}</div>
                    <div style={{ fontSize: 10, color: c.textDim, marginTop: 4 }}>{notif.time}</div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <NavBar active="notifs" onNavigate={onNavigate} />
    </div>
  );
};

const NotifsEmptyScreen = ({ onNavigate }) => (
  <div>
    <Header title="Notifications" />
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 32px", textAlign: "center", gap: 14 }}>
      <div style={{ fontSize: 54 }}>🔔</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: c.text }}>Aucune notification</div>
      <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.7 }}>
        Tu seras notifié ici de tes confirmations, rappels et promos exclusives.
      </div>
      <div style={{ marginTop: 8, width: "100%" }}>
        <Btn onClick={() => onNavigate("home")}>Découvrir des restaurants →</Btn>
      </div>
    </div>
    <NavBar active="notifs" onNavigate={onNavigate} />
  </div>
);

// ── ANNULATION ────────────────────────────────────────────────────────────

const reasons = [
  "Je ne peux plus me déplacer",
  "J'ai changé de restaurant",
  "Problème de transport",
  "Empêchement personnel",
  "Erreur dans ma réservation",
  "Autre raison",
];

const Cancel1Screen = ({ onNavigate }) => {
  const [selected, setSelected] = useState(null);
  return (
    <div>
      <Header title="Annuler la réservation" back onBack={() => onNavigate("home")} />
      <div style={{ padding: "14px 16px" }}>
        <div style={{ background: c.card, borderRadius: 14, padding: "12px", border: `1px solid ${c.cardBorder}`, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 28 }}>🎋</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>Le Tantra · Hydra</div>
              <div style={{ fontSize: 11, color: c.textMuted }}>Lundi 26 Mai · 20h00 · 2 personnes</div>
              <div style={{ marginTop: 4 }}><Tag color={c.greenSoft} textColor={c.green}>✓ Annulation gratuite jusqu'à 18h00</Tag></div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 12 }}>Pourquoi tu annules ?</div>
        {reasons.map((r, i) => (
          <div key={i} onClick={() => setSelected(i)} style={{
            background: selected === i ? c.accentSoft : c.card,
            border: `1.5px solid ${selected === i ? c.accent : c.cardBorder}`,
            borderRadius: 12, padding: "12px 14px", marginBottom: 8, cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <span style={{ fontSize: 13, color: selected === i ? c.accent : c.text, fontWeight: selected === i ? 700 : 400 }}>{r}</span>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              border: `2px solid ${selected === i ? c.accent : c.cardBorder}`,
              background: selected === i ? c.accent : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {selected === i && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#000" }} />}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 16 }}>
          <Btn onClick={() => onNavigate("cancel2")} disabled={selected === null}>Continuer →</Btn>
        </div>
      </div>
    </div>
  );
};

const Cancel2Screen = ({ onNavigate }) => (
  <div>
    <Header title="Confirmer l'annulation" back onBack={() => onNavigate("cancel1")} />
    <div style={{ padding: "14px 16px" }}>
      <div style={{ background: c.greenSoft, borderRadius: 14, padding: "14px", border: `1px solid ${c.green}40`, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: c.green, marginBottom: 6 }}>✅ Annulation gratuite</div>
        <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6 }}>
          Tu es dans les délais. Aucune pénalité ne sera appliquée.
        </div>
      </div>

      <div style={{ background: c.card, borderRadius: 14, padding: "14px", border: `1px solid ${c.cardBorder}`, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Récapitulatif</div>
        {[["Restaurant", "Le Tantra · Hydra"], ["Date", "Lundi 26 Mai"], ["Heure", "20h00"], ["Couverts", "2 personnes"], ["Raison", "Empêchement personnel"], ["Pénalité", "Aucune"]].map(([k, v], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, paddingBottom: 8, borderBottom: i < 5 ? `1px solid ${c.cardBorder}` : "none" }}>
            <span style={{ fontSize: 12, color: c.textMuted }}>{k}</span>
            <span style={{ fontSize: 12, color: i === 5 ? c.green : c.text, fontWeight: i === 5 ? 700 : 500 }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ background: c.accentSoft, borderRadius: 12, padding: "10px 12px", border: `1px solid ${c.accent}30`, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: c.accent, fontWeight: 700 }}>💡 Tu peux aussi modifier plutôt qu'annuler</div>
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3 }}>Changer la date ou l'heure est gratuit jusqu'à 2h avant.</div>
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          <div style={{ flex: 1, background: c.accent, borderRadius: 8, padding: "7px", textAlign: "center", fontSize: 11, color: "#000", fontWeight: 700, cursor: "pointer" }}>Modifier la résa</div>
        </div>
      </div>

      <Btn variant="danger" onClick={() => onNavigate("cancel3")}>Confirmer l'annulation</Btn>
      <div style={{ marginTop: 10 }}>
        <Btn variant="ghost" onClick={() => onNavigate("home")}>Garder ma réservation</Btn>
      </div>
    </div>
  </div>
);

const Cancel3Screen = ({ onNavigate }) => (
  <div style={{ minHeight: 560, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center" }}>
    <div style={{ width: 70, height: 70, borderRadius: "50%", background: c.redSoft, border: `2px solid ${c.red}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, marginBottom: 16 }}>❌</div>
    <div style={{ fontSize: 18, fontWeight: 900, color: c.text, marginBottom: 6 }}>Réservation annulée</div>
    <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.7, marginBottom: 24, maxWidth: 200 }}>
      Ton annulation a bien été prise en compte. Aucune pénalité appliquée.
    </div>
    <div style={{ background: c.card, borderRadius: 14, padding: "14px", border: `1px solid ${c.cardBorder}`, width: "100%", marginBottom: 20, textAlign: "left" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: c.textMuted, marginBottom: 8 }}>Résumé</div>
      {[["Restaurant", "Le Tantra"], ["Date annulée", "26 Mai · 20h00"], ["Pénalité", "Aucune"], ["Points perdus", "0"]].map(([k, v], i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: c.textMuted }}>{k}</span>
          <span style={{ fontSize: 12, color: c.text }}>{v}</span>
        </div>
      ))}
    </div>
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      <Btn onClick={() => onNavigate("home")}>Trouver un autre restaurant →</Btn>
      <Btn variant="ghost" onClick={() => onNavigate("home")}>Retour à l'accueil</Btn>
    </div>
  </div>
);

const CancelLateScreen = ({ onNavigate }) => (
  <div>
    <Header title="Annuler la réservation" back onBack={() => onNavigate("home")} />
    <div style={{ padding: "14px 16px" }}>
      <div style={{ background: c.redSoft, borderRadius: 14, padding: "14px", border: `1px solid ${c.red}40`, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: c.red, marginBottom: 6 }}>⚠️ Annulation tardive</div>
        <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.6 }}>
          Il reste moins de 2h avant ta réservation. Une pénalité de <span style={{ color: c.red, fontWeight: 700 }}>500 DA</span> sera prélevée.
        </div>
      </div>

      <div style={{ background: c.card, borderRadius: 14, padding: "14px", border: `1px solid ${c.cardBorder}`, marginBottom: 16 }}>
        {[["Restaurant", "Le Tantra · Hydra"], ["Réservation", "Ce soir · 20h00"], ["Heure actuelle", "18h15"], ["Délai dépassé", "il y a 15 min"], ["Pénalité", "500 DA"]].map(([k, v], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, paddingBottom: 8, borderBottom: i < 4 ? `1px solid ${c.cardBorder}` : "none" }}>
            <span style={{ fontSize: 12, color: c.textMuted }}>{k}</span>
            <span style={{ fontSize: 12, color: i === 4 ? c.red : c.text, fontWeight: i === 4 ? 800 : 500 }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ background: c.accentSoft, borderRadius: 12, padding: "10px 12px", border: `1px solid ${c.accent}30`, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: c.accent, fontWeight: 700, marginBottom: 3 }}>💡 Appelle le restaurant directement</div>
        <div style={{ fontSize: 11, color: c.textMuted }}>Une entente directe peut éviter la pénalité.</div>
        <div style={{ marginTop: 8, background: c.accent, borderRadius: 8, padding: "7px", textAlign: "center", fontSize: 12, color: "#000", fontWeight: 700, cursor: "pointer" }}>📞 Appeler Le Tantra</div>
      </div>

      <Btn variant="danger" onClick={() => onNavigate("cancel3")}>Annuler quand même (−500 DA)</Btn>
      <div style={{ marginTop: 10 }}>
        <Btn variant="ghost" onClick={() => onNavigate("home")}>Garder ma réservation</Btn>
      </div>
    </div>
  </div>
);

// ── LAISSER UN AVIS ───────────────────────────────────────────────────────

const Avis1Screen = ({ onNavigate }) => {
  const [note, setNote] = useState(0);
  const [hovered, setHovered] = useState(0);
  const labels = ["", "Décevant", "Passable", "Bien", "Très bien", "Excellent !"];
  return (
    <div>
      <Header title="Ton avis" back onBack={() => onNavigate("home")} />
      <div style={{ padding: "14px 16px" }}>
        <div style={{ background: c.card, borderRadius: 14, padding: "12px", border: `1px solid ${c.cardBorder}`, marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontSize: 28 }}>🎋</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>Le Tantra · Hydra</div>
            <div style={{ fontSize: 11, color: c.textMuted }}>Visite du Lundi 26 Mai · 20h00</div>
            <div style={{ marginTop: 4 }}><Tag color={c.greenSoft} textColor={c.green}>✓ Avis certifié Mida</Tag></div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>Comment s'est passée ta soirée ?</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 10 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <span key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setNote(i)}
                style={{ fontSize: 36, cursor: "pointer", color: i <= (hovered || note) ? c.accent : c.cardBorder, transition: "color 0.15s, transform 0.1s", display: "inline-block", transform: i <= (hovered || note) ? "scale(1.1)" : "scale(1)" }}>★</span>
            ))}
          </div>
          {(note > 0 || hovered > 0) && (
            <div style={{ fontSize: 14, fontWeight: 700, color: c.accent }}>{labels[hovered || note]}</div>
          )}
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 12 }}>Notes détaillées</div>
        {[
          { label: "🍽️ Cuisine", desc: "Qualité et goût des plats" },
          { label: "👨‍🍳 Service", desc: "Accueil et rapidité" },
          { label: "✨ Ambiance", desc: "Décoration et atmosphère" },
          { label: "💰 Prix / qualité", desc: "Rapport qualité-prix" },
        ].map((cat, i) => (
          <div key={i} style={{ background: c.card, borderRadius: 12, padding: "10px 12px", marginBottom: 8, border: `1px solid ${c.cardBorder}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{cat.label}</div>
                <div style={{ fontSize: 10, color: c.textDim }}>{cat.desc}</div>
              </div>
              <div style={{ display: "flex", gap: 3 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s} style={{ fontSize: 18, color: s <= [5, 4, 5, 4][i] ? c.accent : c.cardBorder, cursor: "pointer" }}>★</span>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 16 }}>
          <Btn onClick={() => onNavigate("avis2")} disabled={note === 0}>Continuer →</Btn>
        </div>
      </div>
    </div>
  );
};

const Avis2Screen = ({ onNavigate }) => (
  <div>
    <Header title="Ton avis" back onBack={() => onNavigate("avis1")} />
    <div style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>Note globale :</span>
        <span style={{ display: "flex" }}>{[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= 5 ? c.accent : c.cardBorder, fontSize: 16 }}>★</span>)}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: c.accent }}>Excellent !</span>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 8 }}>Décris ton expérience</div>
      <div style={{ background: c.card, border: `1.5px solid ${c.accent}60`, borderRadius: 12, padding: "12px", marginBottom: 6, minHeight: 100 }}>
        <div style={{ fontSize: 12, color: c.text, lineHeight: 1.6 }}>
          Incroyable soirée au Tantra ! Les brochettes étaient parfaitement grillées, l'ambiance très chaleureuse. Le service était rapide malgré une salle pleine.
        </div>
      </div>
      <div style={{ fontSize: 11, color: c.textDim, textAlign: "right", marginBottom: 16 }}>142 / 500 caractères</div>

      <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>Tags rapides</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
        {["🍖 Excellente viande", "⚡ Service rapide", "🎶 Super ambiance", "💰 Bon rapport qualité-prix", "🅿️ Parking pratique", "👨‍👩‍👧 Idéal en famille"].map((t, i) => (
          <div key={i} style={{
            padding: "5px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer",
            background: [0, 1, 2].includes(i) ? c.accentSoft : c.card,
            color: [0, 1, 2].includes(i) ? c.accent : c.textMuted,
            border: `1px solid ${[0, 1, 2].includes(i) ? c.accent + "50" : c.cardBorder}`,
            fontWeight: [0, 1, 2].includes(i) ? 700 : 400
          }}>{t}</div>
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 8 }}>Ajouter des photos (optionnel)</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <div style={{ width: 70, height: 70, borderRadius: 12, background: c.card, border: `1px dashed ${c.accent}`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2, cursor: "pointer" }}>
          <span style={{ fontSize: 20 }}>📷</span>
          <span style={{ fontSize: 9, color: c.textDim }}>Ajouter</span>
        </div>
        {[1, 2].map(i => (
          <div key={i} style={{ width: 70, height: 70, borderRadius: 12, background: "#2a1f10", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🍖</div>
        ))}
      </div>

      <Btn onClick={() => onNavigate("avis3")}>Publier mon avis →</Btn>
      <div style={{ fontSize: 10, color: c.textDim, textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
        Ton avis sera visible publiquement. Il sera certifié "Réservation vérifiée via Mida".
      </div>
    </div>
  </div>
);

const Avis3Screen = ({ onNavigate }) => (
  <div style={{ minHeight: 560, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center" }}>
    <div style={{ width: 70, height: 70, borderRadius: "50%", background: c.accentSoft, border: `2px solid ${c.accent}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, marginBottom: 16 }}>⭐</div>
    <div style={{ fontSize: 20, fontWeight: 900, color: c.text, marginBottom: 6 }}>Avis publié !</div>
    <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.7, marginBottom: 10, maxWidth: 210 }}>
      Merci pour ton retour ! Ton avis aide toute la communauté Mida.
    </div>
    <div style={{ background: c.accentSoft, borderRadius: 14, padding: "12px 16px", border: `1px solid ${c.accent}40`, width: "100%", marginBottom: 20 }}>
      <div style={{ fontSize: 11, color: c.accent, fontWeight: 700, marginBottom: 4 }}>🏅 Points gagnés</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: c.text }}>+50 pts</div>
      <div style={{ fontSize: 11, color: c.textMuted }}>Total : 1 290 pts · Seuil prochain bon : 2 000 pts</div>
    </div>
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      <Btn onClick={() => onNavigate("home")}>Retour à l'accueil</Btn>
      <Btn variant="secondary" onClick={() => onNavigate("home")}>Partager mon avis 📲</Btn>
    </div>
  </div>
);

// ── FAVORIS ───────────────────────────────────────────────────────────────

const favorisData = [
  { name: "Le Tantra", quartier: "Hydra", cuisine: "Fusion · Grillades", note: 4.7, avis: 312, dispo: true, emoji: "🎋", prix: "1200–2500 DA" },
  { name: "Dar El Kef", quartier: "El Biar", cuisine: "Algérien traditionnel", note: 4.5, avis: 198, dispo: true, emoji: "🏺", prix: "900–1800 DA" },
  { name: "Casbah Istanbul", quartier: "Bab Ezzouar", cuisine: "Turc · Oriental", note: 4.4, avis: 156, dispo: false, emoji: "🕌", prix: "800–1600 DA" },
  { name: "Le Béarnais", quartier: "Alger Centre", cuisine: "Français · Bistrot", note: 4.6, avis: 241, dispo: true, emoji: "🍷", prix: "1500–3000 DA" },
];

const FavorisScreen = ({ onNavigate }) => {
  const [favs, setFavs] = useState(favorisData);
  return (
    <div>
      <div style={{ padding: "16px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: c.text }}>Mes favoris</div>
          <div style={{ fontSize: 11, color: c.textMuted }}>{favs.length} restaurants sauvegardés</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["Liste", "Carte"].map((v, i) => (
            <div key={i} onClick={() => i === 1 && onNavigate("carte")} style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 11,
              background: i === 0 ? c.accentSoft : c.card,
              color: i === 0 ? c.accent : c.textMuted,
              border: `1px solid ${i === 0 ? c.accent + "50" : c.cardBorder}`,
              cursor: "pointer", fontWeight: i === 0 ? 700 : 400
            }}>{v}</div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 16px 12px" }}>
        {favs.map((r, i) => (
          <div key={i} style={{ background: c.card, borderRadius: 14, marginBottom: 10, overflow: "hidden", border: `1px solid ${c.cardBorder}` }}>
            <div style={{ height: 80, background: "linear-gradient(135deg, #2a1f14, #1a1209)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, position: "relative" }}>
              {r.emoji}
              <div onClick={() => setFavs(favs.filter((_, j) => j !== i))}
                style={{ position: "absolute", top: 8, right: 8, background: c.redSoft, borderRadius: 8, padding: "3px 7px", fontSize: 13, cursor: "pointer", color: c.red }}>♥</div>
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: c.textMuted }}>{r.quartier} · {r.cuisine}</div>
                  <div style={{ fontSize: 11, color: c.textDim, marginTop: 2 }}>{r.prix} / pers.</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: c.accent, fontWeight: 700 }}>★ {r.note}</div>
                  <div style={{ fontSize: 10, color: c.textDim }}>{r.avis} avis</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <Tag color={r.dispo ? c.greenSoft : c.redSoft} textColor={r.dispo ? c.green : c.red}>
                  {r.dispo ? "✓ Dispo ce soir" : "✗ Complet"}
                </Tag>
                {r.dispo && (
                  <div onClick={() => onNavigate("reservation")} style={{ background: c.accent, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#000", fontWeight: 700, cursor: "pointer" }}>
                    Réserver →
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <NavBar active="favoris" onNavigate={onNavigate} />
    </div>
  );
};

const FavorisEmptyScreen = ({ onNavigate }) => (
  <div>
    <Header title="Mes favoris" />
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 32px", textAlign: "center", gap: 14 }}>
      <div style={{ fontSize: 54 }}>♡</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: c.text }}>Aucun favori pour l'instant</div>
      <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.7, maxWidth: 200 }}>
        Appuie sur ♡ dans une fiche restaurant pour le sauvegarder ici.
      </div>
      <div style={{ marginTop: 8, width: "100%" }}>
        <Btn onClick={() => onNavigate("search")}>Explorer les restaurants →</Btn>
      </div>
    </div>
    <NavBar active="favoris" onNavigate={onNavigate} />
  </div>
);

// ── POINTS & RÉCOMPENSES ──────────────────────────────────────────────────

const PointsScreen = ({ onNavigate }) => (
  <div>
    <Header title="Points & Récompenses" back onBack={() => onNavigate("profil")} />
    <div style={{ padding: "14px 16px" }}>
      <div style={{ background: "linear-gradient(135deg, #2a1a08, #1a1005)", borderRadius: 16, padding: "18px", border: `1px solid ${c.accent}30`, marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Tes points Mida</div>
        <div style={{ fontSize: 44, fontWeight: 900, color: c.accent, lineHeight: 1 }}>1 290</div>
        <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>pts cumulés</div>
        <div style={{ marginTop: 12 }}>
          <div style={{ height: 8, background: c.cardBorder, borderRadius: 4, marginBottom: 6 }}>
            <div style={{ width: "64.5%", height: "100%", background: `linear-gradient(90deg, ${c.accentDim}, ${c.accent})`, borderRadius: 4 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: c.textDim }}>
            <span>0</span>
            <span style={{ color: c.accent, fontWeight: 700 }}>1 290 / 2 000 pts → Bon 1000 DA</span>
            <span>2 000</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["🏅", "Gold", "actuel"], ["💎", "Platinum", "2 000 pts"]].map(([icon, tier, sub], i) => (
          <div key={i} style={{ flex: 1, background: c.card, borderRadius: 14, padding: "12px", border: `1.5px solid ${i === 0 ? c.accent : c.cardBorder}`, textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>{icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? c.accent : c.textMuted }}>{tier}</div>
            <div style={{ fontSize: 10, color: c.textDim }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>🎁 Bons disponibles</div>
      {[
        { label: "Bon de réduction −500 DA", pts: 1000, dispo: true },
        { label: "Bon de réduction −1000 DA", pts: 2000, dispo: false },
        { label: "Dessert offert", pts: 500, dispo: true },
      ].map((bon, i) => (
        <div key={i} style={{ background: c.card, borderRadius: 14, padding: "12px 14px", marginBottom: 8, border: `1px solid ${bon.dispo ? c.accent + "40" : c.cardBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: bon.dispo ? c.text : c.textMuted }}>{bon.label}</div>
            <div style={{ fontSize: 11, color: c.textDim }}>{bon.pts} pts requis</div>
          </div>
          <div style={{
            padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: bon.dispo ? c.accent : c.cardBorder,
            color: bon.dispo ? "#000" : c.textDim,
            cursor: bon.dispo ? "pointer" : "not-allowed"
          }}>{bon.dispo ? "Utiliser" : "Bientôt"}</div>
        </div>
      ))}

      <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>Comment gagner des points ?</div>
        <span onClick={() => onNavigate("points_history")} style={{ fontSize: 11, color: c.accent, cursor: "pointer" }}>Historique →</span>
      </div>
      {[
        ["📅", "Réservation honorée", "+50 pts"],
        ["⭐", "Laisser un avis", "+30 pts"],
        ["📲", "Parrainer un ami", "+200 pts"],
        ["🎂", "Anniversaire", "+100 pts"],
      ].map(([icon, label, pts], i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 3 ? `1px solid ${c.cardBorder}` : "none" }}>
          <span style={{ fontSize: 12, color: c.text }}>{icon} {label}</span>
          <span style={{ fontSize: 12, color: c.green, fontWeight: 700 }}>{pts}</span>
        </div>
      ))}
    </div>
  </div>
);

const PointsHistoryScreen = ({ onNavigate }) => (
  <div>
    <Header title="Historique des points" back onBack={() => onNavigate("points")} />
    <div style={{ padding: "12px 16px" }}>
      <div style={{ background: c.accentSoft, borderRadius: 12, padding: "10px 14px", border: `1px solid ${c.accent}30`, marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: c.textMuted }}>Total actuel</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: c.accent }}>1 290 pts</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: c.textMuted }}>Ce mois</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: c.green }}>+280 pts</div>
        </div>
      </div>

      {[
        { icon: "📅", label: "Réservation honorée · Le Tantra", date: "26 Mai", pts: "+50", pos: true },
        { icon: "⭐", label: "Avis publié · Le Tantra", date: "26 Mai", pts: "+30", pos: true },
        { icon: "📅", label: "Réservation honorée · Dar El Kef", date: "18 Mai", pts: "+50", pos: true },
        { icon: "⭐", label: "Avis publié · Dar El Kef", date: "18 Mai", pts: "+30", pos: true },
        { icon: "📲", label: "Parrainage · Karim D.", date: "12 Mai", pts: "+200", pos: true },
        { icon: "🎁", label: "Bon utilisé · −500 DA", date: "05 Mai", pts: "−1000", pos: false },
        { icon: "📅", label: "Réservation honorée · Amazonia", date: "02 Mai", pts: "+50", pos: true },
        { icon: "🎉", label: "Bonus inscription", date: "01 Mai", pts: "+100", pos: true },
      ].map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${c.cardBorder}` }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: item.pos ? c.greenSoft : c.redSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{item.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: c.text, fontWeight: 500 }}>{item.label}</div>
            <div style={{ fontSize: 10, color: c.textDim }}>{item.date}</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: item.pos ? c.green : c.red }}>{item.pts}</div>
        </div>
      ))}
    </div>
  </div>
);

// ── CARTE ─────────────────────────────────────────────────────────────────

const CarteScreen = ({ onNavigate }) => (
  <div>
    <div style={{ position: "relative" }}>
      <div style={{ height: 340, background: "linear-gradient(160deg, #1a2018 0%, #0f140d 50%, #0a0f09 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        {/* Grille stylisée */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${i * 14}%`, height: 1, background: c.green }} />
          ))}
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: `${i * 18}%`, width: 1, background: c.green }} />
          ))}
        </div>

        {/* Markers restaurants */}
        {[
          { x: "30%", y: "35%", name: "Le Tantra", note: 4.7, hot: true },
          { x: "55%", y: "55%", name: "Dar El Kef", note: 4.5, hot: false },
          { x: "70%", y: "30%", name: "Le Béarnais", note: 4.6, hot: false },
          { x: "20%", y: "65%", name: "Grill Palace", note: 4.3, hot: false },
          { x: "80%", y: "65%", name: "Casbah Istanbul", note: 4.4, hot: false },
        ].map((m, i) => (
          <div key={i} style={{ position: "absolute", left: m.x, top: m.y, transform: "translate(-50%, -50%)" }}>
            <div style={{
              background: m.hot ? c.accent : c.card,
              border: `2px solid ${m.hot ? c.accentDim : c.cardBorder}`,
              borderRadius: m.hot ? 20 : 10,
              padding: m.hot ? "5px 10px" : "4px 8px",
              fontSize: m.hot ? 12 : 10,
              color: m.hot ? "#000" : c.text,
              fontWeight: 700, whiteSpace: "nowrap",
              boxShadow: m.hot ? "0 4px 16px #E8A04550" : "0 2px 8px #0008"
            }}>
              {m.hot ? `★ ${m.note} · ${m.name}` : `★ ${m.note}`}
            </div>
            <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `6px solid ${m.hot ? c.accent : c.cardBorder}`, margin: "0 auto" }} />
          </div>
        ))}

        {/* Bouton ma position */}
        <div style={{ position: "absolute", bottom: 12, right: 12, background: c.card, border: `1px solid ${c.cardBorder}`, borderRadius: 10, padding: "8px 10px", fontSize: 16, cursor: "pointer", boxShadow: "0 2px 8px #0008" }}>📍</div>
        <div style={{ position: "absolute", bottom: 12, right: 56, background: c.card, border: `1px solid ${c.cardBorder}`, borderRadius: 10, padding: "8px 10px", fontSize: 16, cursor: "pointer", boxShadow: "0 2px 8px #0008" }}>⊕</div>

        {/* Barre de recherche */}
        <div style={{ position: "absolute", top: 12, left: 12, right: 12 }}>
          <div style={{ background: c.card, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px #000a" }}>
            <span onClick={() => onNavigate("favoris")} style={{ color: c.textMuted, cursor: "pointer" }}>←</span>
            <span style={{ color: c.textMuted }}>🔍</span>
            <span style={{ fontSize: 12, color: c.textDim }}>Grillades près de moi…</span>
            <span style={{ marginLeft: "auto", fontSize: 14, cursor: "pointer" }}>⚙️</span>
          </div>
        </div>
      </div>

      {/* Fiche bottom sheet */}
      <div style={{ background: c.bg, padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {["🔍 Tous", "⚡ Dispo", "💰 Budget", "⭐ Note"].map((f, i) => (
            <div key={i} style={{
              padding: "5px 10px", borderRadius: 20, fontSize: 11, whiteSpace: "nowrap",
              background: i === 0 ? c.accentSoft : c.card,
              color: i === 0 ? c.accent : c.textMuted,
              border: `1px solid ${i === 0 ? c.accent + "50" : c.cardBorder}`,
              fontWeight: i === 0 ? 700 : 400, cursor: "pointer"
            }}>{f}</div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 8 }}>5 restaurants dans cette zone</div>

        <div style={{ display: "flex", gap: 10, overflowX: "auto" }}>
          {[
            { name: "Le Tantra", note: 4.7, dispo: true, emoji: "🎋", prix: "1200 DA+" },
            { name: "Dar El Kef", note: 4.5, dispo: true, emoji: "🏺", prix: "900 DA+" },
            { name: "Le Béarnais", note: 4.6, dispo: false, emoji: "🍷", prix: "1500 DA+" },
          ].map((r, i) => (
            <div key={i} onClick={() => onNavigate("restaurant")} style={{ minWidth: 140, background: c.card, borderRadius: 14, overflow: "hidden", border: `1px solid ${i === 0 ? c.accent + "50" : c.cardBorder}`, cursor: "pointer", flexShrink: 0 }}>
              <div style={{ height: 60, background: "linear-gradient(135deg, #2a1f14, #1a1209)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{r.emoji}</div>
              <div style={{ padding: "8px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{r.name}</div>
                <div style={{ fontSize: 11, color: c.accent }}>★ {r.note}</div>
                <div style={{ fontSize: 10, color: c.textDim }}>{r.prix}</div>
                <div style={{ marginTop: 4 }}>
                  <Tag color={r.dispo ? c.greenSoft : c.redSoft} textColor={r.dispo ? c.green : c.red}>
                    {r.dispo ? "✓ Dispo" : "Complet"}
                  </Tag>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ── ÉTATS VIDES & ERREURS ─────────────────────────────────────────────────

const ErreurScreen = ({ onNavigate }) => (
  <div style={{ minHeight: 560, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center" }}>
    <div style={{ fontSize: 56, marginBottom: 16 }}>📡</div>
    <div style={{ fontSize: 18, fontWeight: 900, color: c.text, marginBottom: 8 }}>Pas de connexion</div>
    <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.7, marginBottom: 24, maxWidth: 200 }}>
      Vérifie ta connexion internet et réessaie. Tes réservations sont sauvegardées localement.
    </div>
    <div style={{ background: c.card, borderRadius: 14, padding: "12px 16px", border: `1px solid ${c.cardBorder}`, width: "100%", marginBottom: 20, textAlign: "left" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8 }}>✅ Disponible hors ligne</div>
      {["Mes réservations à venir", "Mes favoris sauvegardés", "Mon profil & mes points"].map((item, i) => (
        <div key={i} style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>• {item}</div>
      ))}
    </div>
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      <Btn onClick={() => onNavigate("home")}>🔄 Réessayer</Btn>
      <Btn variant="ghost" onClick={() => onNavigate("home")}>Mode hors ligne</Btn>
    </div>
  </div>
);

const VideScreen = ({ onNavigate }) => (
  <div>
    <Header title="Résultats" back onBack={() => onNavigate("search")} />
    <div style={{ padding: "12px 16px" }}>
      <div style={{ background: c.card, borderRadius: 12, padding: "10px 14px", border: `1px solid ${c.cardBorder}`, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: c.textMuted }}>🔍</span>
        <span style={{ fontSize: 13, color: c.text }}>Sushi · Kouba</span>
        <span style={{ marginLeft: "auto", color: c.textDim, fontSize: 11, cursor: "pointer" }}>✕</span>
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 32px", textAlign: "center", gap: 14 }}>
      <div style={{ fontSize: 52 }}>🍱</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: c.text }}>Aucun résultat</div>
      <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.7, maxWidth: 200 }}>
        Pas de restaurant Sushi disponible à Kouba pour l'instant.
      </div>
      <div style={{ width: "100%", marginTop: 4, display: "flex", flexDirection: "column", gap: 8 }}>
        <Btn onClick={() => onNavigate("search")}>Modifier la recherche</Btn>
        <Btn variant="ghost" onClick={() => onNavigate("search")}>Voir tous les restaurants</Btn>
      </div>
      <div style={{ width: "100%", background: c.card, borderRadius: 14, padding: "12px", border: `1px solid ${c.cardBorder}`, textAlign: "left" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8 }}>💡 Suggestions proches</div>
        {[
          { name: "Dar El Kef", quartier: "El Biar · 3 km", emoji: "🏺" },
          { name: "Le Tantra", quartier: "Hydra · 5 km", emoji: "🎋" },
        ].map((r, i) => (
          <div key={i} onClick={() => onNavigate("restaurant")} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: i === 0 ? `1px solid ${c.cardBorder}` : "none", cursor: "pointer" }}>
            <span style={{ fontSize: 22 }}>{r.emoji}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{r.name}</div>
              <div style={{ fontSize: 11, color: c.textMuted }}>{r.quartier}</div>
            </div>
            <span style={{ marginLeft: "auto", color: c.accent }}>›</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── MAIN ──────────────────────────────────────────────────────────────────

const screenGroups = [
  { title: "🔔 Notifications", screens: ["notifs", "notifs_empty"] },
  { title: "❌ Annulation", screens: ["cancel1", "cancel2", "cancel3", "cancel_late"] },
  { title: "⭐ Avis post-visite", screens: ["avis1", "avis2", "avis3"] },
  { title: "♡ Favoris", screens: ["favoris", "favoris_empty"] },
  { title: "🏅 Points", screens: ["points", "points_history"] },
  { title: "🗺️ Carte & États", screens: ["carte", "erreur", "vide"] },
];

export default function MidaClientWireframes() {
  const [active, setActive] = useState("notifs");

  const renderScreen = (screen) => {
    const p = { onNavigate: setActive };
    switch (screen) {
      case "notifs": return <NotifsScreen {...p} />;
      case "notifs_empty": return <NotifsEmptyScreen {...p} />;
      case "cancel1": return <Cancel1Screen {...p} />;
      case "cancel2": return <Cancel2Screen {...p} />;
      case "cancel3": return <Cancel3Screen {...p} />;
      case "cancel_late": return <CancelLateScreen {...p} />;
      case "avis1": return <Avis1Screen {...p} />;
      case "avis2": return <Avis2Screen {...p} />;
      case "avis3": return <Avis3Screen {...p} />;
      case "favoris": return <FavorisScreen {...p} />;
      case "favoris_empty": return <FavorisEmptyScreen {...p} />;
      case "points": return <PointsScreen {...p} />;
      case "points_history": return <PointsHistoryScreen {...p} />;
      case "carte": return <CarteScreen {...p} />;
      case "erreur": return <ErreurScreen {...p} />;
      case "vide": return <VideScreen {...p} />;
      default: return <div style={{ padding: 20, color: c.text }}>{screen}</div>;
    }
  };

  return (
    <div style={{ background: "#080706", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", color: c.text }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: c.accent, letterSpacing: -1, fontFamily: "Georgia, serif" }}>mida</div>
          <div style={{ fontSize: 13, color: c.textMuted, letterSpacing: 2, textTransform: "uppercase" }}>Côté Client · Wireframes v1.0</div>
          <div style={{ fontSize: 11, color: c.textDim, marginTop: 4 }}>{Object.keys(screenLabels).length} écrans · Cliquez pour naviguer</div>
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

        <div style={{ marginTop: 28, background: c.card, borderRadius: 16, padding: "16px 20px", border: `1px solid ${c.cardBorder}`, maxWidth: 560, margin: "28px auto 0" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>✅ Écrans couverts dans ce wireframe</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {Object.values(screenLabels).map((label, i) => (
              <div key={i} style={{ fontSize: 11, color: c.textMuted }}>✅ {label}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
