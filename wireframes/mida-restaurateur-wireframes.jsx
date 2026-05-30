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
  onb1: "Onboarding Pro · 1",
  onb2: "Onboarding Pro · 2",
  onb3: "Onboarding Pro · 3",
  onb4: "Onboarding Pro · Checklist",
  menu: "Gestion du menu",
  menu_add: "Ajouter un plat",
  menu_edit: "Modifier un plat",
  menu_categorie: "Gérer catégories",
  promo: "Mes promotions",
  promo_create: "Créer une promo",
  promo_active: "Promo active",
  profil_public: "Profil public",
  profil_edit: "Modifier le profil",
  profil_photos: "Gérer les photos",
  profil_horaires: "Horaires & infos",
  notifs_pro: "Notifications pro",
  notifs_pro_settings: "Préférences alertes",
};

// ── COMPOSANTS ────────────────────────────────────────────────────────────

const Phone = ({ children, label }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
    {label && <div style={{ color: c.text, fontWeight: 700, fontSize: 13, textAlign: "center" }}>{label}</div>}
    <div style={{ width: 280, background: "#111", borderRadius: 36, boxShadow: "0 24px 64px #000c, 0 0 0 2px #2a2a2a", overflow: "hidden" }}>
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

const Btn = ({ children, variant = "primary", onClick, disabled, small }) => {
  const styles = {
    primary: { background: c.accent, color: "#000", border: "none" },
    secondary: { background: "transparent", color: c.accent, border: `1.5px solid ${c.accent}` },
    ghost: { background: c.card, color: c.textMuted, border: `1px solid ${c.cardBorder}` },
    danger: { background: c.redSoft, color: c.red, border: `1px solid ${c.red}40` },
    green: { background: c.greenSoft, color: c.green, border: `1px solid ${c.green}40` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", borderRadius: small ? 10 : 14,
      padding: small ? "8px 12px" : "14px",
      fontSize: small ? 12 : 14, fontWeight: 800,
      cursor: disabled ? "not-allowed" : "pointer",
      letterSpacing: 0.3, opacity: disabled ? 0.5 : 1, ...styles[variant]
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

const Input = ({ label, value, placeholder, icon, type = "text", hint }) => (
  <div style={{ marginBottom: 13 }}>
    {label && <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 5, fontWeight: 600 }}>{label}</div>}
    <div style={{ background: c.card, border: `1.5px solid ${value ? c.accent + "60" : c.cardBorder}`, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
      {icon && <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>}
      <span style={{ fontSize: 12, color: value ? c.text : c.textDim, flex: 1 }}>{value || placeholder}</span>
      {type === "password" && <span style={{ fontSize: 12, color: c.textDim }}>🙈</span>}
    </div>
    {hint && <div style={{ fontSize: 10, color: c.textDim, marginTop: 3 }}>{hint}</div>}
  </div>
);

const Toggle = ({ label, on, sub }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${c.cardBorder}` }}>
    <div>
      <div style={{ fontSize: 12, color: c.text, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: c.textDim }}>{sub}</div>}
    </div>
    <div style={{ width: 38, height: 22, borderRadius: 11, background: on ? c.accent : "#2a2520", position: "relative", cursor: "pointer", border: `1px solid ${on ? c.accentDim : c.cardBorder}` }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: on ? "#000" : c.textDim, position: "absolute", top: 2, left: on ? 18 : 2, transition: "left 0.2s" }} />
    </div>
  </div>
);

const ProNavBar = ({ active, onNavigate }) => {
  const items = [
    { id: "dashboard", icon: "⊞", label: "Board" },
    { id: "menu", icon: "🍽", label: "Menu" },
    { id: "promo", icon: "🎁", label: "Promos" },
    { id: "profil_public", icon: "🏪", label: "Profil" },
    { id: "notifs_pro", icon: "🔔", label: "Alertes", badge: 4 },
  ];
  return (
    <div style={{ display: "flex", justifyContent: "space-around", background: c.card, borderTop: `1px solid ${c.cardBorder}`, padding: "10px 0 6px" }}>
      {items.map(item => (
        <div key={item.id} onClick={() => onNavigate && onNavigate(item.id)}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", position: "relative" }}>
          {item.badge && active !== item.id && (
            <div style={{ position: "absolute", top: -2, right: -4, background: c.red, color: "#fff", borderRadius: "50%", width: 14, height: 14, fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{item.badge}</div>
          )}
          <span style={{ fontSize: 16, color: active === item.id ? c.accent : c.textMuted }}>{item.icon}</span>
          <span style={{ fontSize: 9, color: active === item.id ? c.accent : c.textMuted, fontWeight: active === item.id ? 700 : 400 }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

// ── ONBOARDING PRO ────────────────────────────────────────────────────────

const onbSlides = [
  { emoji: "🏪", title: "Bienvenue sur Mida Pro", desc: "Ton restaurant est maintenant visible par des milliers de clients à Alger. Voyons comment tirer le meilleur de la plateforme.", step: "1 / 4" },
  { emoji: "📅", title: "Gère tes réservations en temps réel", desc: "Confirme, refuse ou modifie chaque réservation depuis le dashboard. Plan de salle interactif inclus.", step: "2 / 4" },
  { emoji: "⭐", title: "Réponds aux avis certifiés", desc: "Les avis Mida viennent uniquement de clients ayant réservé. Réponds rapidement pour booster ta note.", step: "3 / 4" },
];

const Onb1Screen = ({ onNavigate }) => (
  <div style={{ minHeight: 560, display: "flex", flexDirection: "column" }}>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 28px", textAlign: "center", gap: 16, background: "linear-gradient(160deg, #1a1208 0%, #0f0d0b 100%)" }}>
      <div style={{ fontSize: 60 }}>{onbSlides[0].emoji}</div>
      <div style={{ fontSize: 10, color: c.accent, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{onbSlides[0].step}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: c.text, lineHeight: 1.2 }}>{onbSlides[0].title}</div>
      <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.7 }}>{onbSlides[0].desc}</div>
      <div style={{ background: c.accentSoft, borderRadius: 12, padding: "10px 14px", border: `1px solid ${c.accent}30` }}>
        <div style={{ fontSize: 11, color: c.accent, fontWeight: 700 }}>🎁 Offre de lancement active</div>
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>3 mois gratuits · Activation sous 24h</div>
      </div>
    </div>
    <div style={{ padding: "0 24px 28px" }}>
      <Btn onClick={() => onNavigate("onb2")}>Commencer la configuration →</Btn>
      <div style={{ textAlign: "center", marginTop: 10 }}>
        <span onClick={() => onNavigate("menu")} style={{ fontSize: 11, color: c.textDim, cursor: "pointer" }}>Passer l'intro</span>
      </div>
    </div>
  </div>
);

const Onb2Screen = ({ onNavigate }) => (
  <div style={{ minHeight: 560, display: "flex", flexDirection: "column" }}>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 28px", textAlign: "center", gap: 16, background: "linear-gradient(160deg, #0d1a10 0%, #0f0d0b 100%)" }}>
      <div style={{ fontSize: 60 }}>{onbSlides[1].emoji}</div>
      <div style={{ fontSize: 10, color: c.accent, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{onbSlides[1].step}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: c.text, lineHeight: 1.2 }}>{onbSlides[1].title}</div>
      <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.7 }}>{onbSlides[1].desc}</div>
      <div style={{ background: c.greenSoft, borderRadius: 12, padding: "12px", border: `1px solid ${c.green}30`, width: "100%", textAlign: "left" }}>
        {["Réservations en temps réel", "Plan de salle interactif", "Anti no-show intégré", "SMS de confirmation auto"].map((f, i) => (
          <div key={i} style={{ fontSize: 11, color: c.green, marginBottom: i < 3 ? 4 : 0 }}>✅ {f}</div>
        ))}
      </div>
    </div>
    <div style={{ padding: "0 24px 28px", display: "flex", gap: 8 }}>
      <Btn variant="ghost" onClick={() => onNavigate("onb1")}>←</Btn>
      <Btn onClick={() => onNavigate("onb3")}>Suivant →</Btn>
    </div>
  </div>
);

const Onb3Screen = ({ onNavigate }) => (
  <div style={{ minHeight: 560, display: "flex", flexDirection: "column" }}>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 28px", textAlign: "center", gap: 16, background: "linear-gradient(160deg, #1a1408 0%, #0f0d0b 100%)" }}>
      <div style={{ fontSize: 60 }}>{onbSlides[2].emoji}</div>
      <div style={{ fontSize: 10, color: c.accent, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{onbSlides[2].step}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: c.text, lineHeight: 1.2 }}>{onbSlides[2].title}</div>
      <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.7 }}>{onbSlides[2].desc}</div>
    </div>
    <div style={{ padding: "0 24px 28px", display: "flex", gap: 8 }}>
      <Btn variant="ghost" onClick={() => onNavigate("onb2")}>←</Btn>
      <Btn onClick={() => onNavigate("onb4")}>Dernière étape →</Btn>
    </div>
  </div>
);

const Onb4Screen = ({ onNavigate }) => {
  const steps = [
    { label: "Profil du restaurant", done: true, icon: "🏪" },
    { label: "Menu & tarifs", done: true, icon: "🍽️" },
    { label: "Horaires d'ouverture", done: false, icon: "🕐" },
    { label: "Photos du restaurant", done: false, icon: "📸" },
    { label: "Coordonnées bancaires", done: false, icon: "💳" },
  ];
  const done = steps.filter(s => s.done).length;
  return (
    <div>
      <Header title="Configuration" sub="Étape 4 / 4 · Finalisation" back onBack={() => onNavigate("onb3")} />
      <div style={{ padding: "14px 16px" }}>
        <div style={{ background: c.accentSoft, borderRadius: 12, padding: "12px", border: `1px solid ${c.accent}30`, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: c.accent }}>Profil complété à</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: c.accent }}>{Math.round((done / steps.length) * 100)}%</div>
          </div>
          <div style={{ height: 6, background: c.cardBorder, borderRadius: 3 }}>
            <div style={{ width: `${(done / steps.length) * 100}%`, height: "100%", background: c.accent, borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 10, color: c.textDim, marginTop: 5 }}>Un profil complet augmente ta visibilité de +60%</div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>Liste de démarrage</div>
        {steps.map((s, i) => (
          <div key={i} style={{ background: c.card, borderRadius: 12, padding: "12px", marginBottom: 8, border: `1px solid ${s.done ? c.green + "40" : c.cardBorder}`, display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.done ? c.greenSoft : c.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{s.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{s.label}</div>
              <div style={{ fontSize: 10, color: s.done ? c.green : c.accent }}>{s.done ? "✓ Complété" : "À compléter"}</div>
            </div>
            <span style={{ color: s.done ? c.green : c.accent }}>›</span>
          </div>
        ))}

        <div style={{ marginTop: 14 }}>
          <Btn onClick={() => onNavigate("menu")}>Accéder au dashboard →</Btn>
        </div>
      </div>
    </div>
  );
};

// ── MENU ──────────────────────────────────────────────────────────────────

const menuData = {
  "🥗 Entrées": [
    { nom: "Salade orientale", prix: "600 DA", dispo: true, desc: "Tomates, oignons, herbes" },
    { nom: "Chorba", prix: "500 DA", dispo: false, desc: "Soupe traditionnelle" },
  ],
  "🍖 Plats": [
    { nom: "Brochettes mixtes", prix: "1400 DA", dispo: true, desc: "Agneau, poulet, kefta" },
    { nom: "Couscous royal", prix: "1800 DA", dispo: true, desc: "7 légumes, merguez" },
    { nom: "Tajine poulet", prix: "1200 DA", dispo: true, desc: "Olives, citron confit" },
  ],
  "🍰 Desserts": [
    { nom: "Baklava", prix: "400 DA", dispo: true, desc: "Maison, pistaches" },
  ],
};

const MenuScreen = ({ onNavigate }) => {
  const [cat, setCat] = useState("🍖 Plats");
  return (
    <div>
      <Header
        title="Gestion du menu"
        sub="Le Tantra · 6 plats actifs"
        right={
          <div onClick={() => onNavigate("menu_add")} style={{ background: c.accent, color: "#000", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>+ Ajouter</div>
        }
      />
      <div style={{ padding: "10px 16px 4px" }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {Object.keys(menuData).map((k) => (
            <div key={k} onClick={() => setCat(k)} style={{
              padding: "6px 12px", borderRadius: 20, fontSize: 11, whiteSpace: "nowrap", cursor: "pointer",
              background: cat === k ? c.accentSoft : c.card,
              color: cat === k ? c.accent : c.textMuted,
              border: `1px solid ${cat === k ? c.accent + "50" : c.cardBorder}`,
              fontWeight: cat === k ? 700 : 400
            }}>{k}</div>
          ))}
          <div onClick={() => onNavigate("menu_categorie")} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, whiteSpace: "nowrap", cursor: "pointer", background: c.card, color: c.textDim, border: `1px solid ${c.cardBorder}` }}>⚙️ Catégories</div>
        </div>
      </div>

      <div style={{ padding: "8px 16px 12px" }}>
        {(menuData[cat] || []).map((plat, i) => (
          <div key={i} style={{ background: c.card, borderRadius: 14, padding: "12px", marginBottom: 10, border: `1px solid ${c.cardBorder}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: plat.dispo ? c.text : c.textDim }}>{plat.nom}</div>
                  {!plat.dispo && <Tag color={c.redSoft} textColor={c.red}>Indispo</Tag>}
                </div>
                <div style={{ fontSize: 11, color: c.textDim, marginTop: 2 }}>{plat.desc}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: c.accent, marginLeft: 8 }}>{plat.prix}</div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <div onClick={() => onNavigate("menu_edit")} style={{ flex: 1, background: c.accentSoft, borderRadius: 8, padding: "6px", textAlign: "center", fontSize: 11, color: c.accent, fontWeight: 700, cursor: "pointer" }}>✏️ Modifier</div>
              <div style={{ flex: 1, background: plat.dispo ? c.redSoft : c.greenSoft, borderRadius: 8, padding: "6px", textAlign: "center", fontSize: 11, color: plat.dispo ? c.red : c.green, fontWeight: 700, cursor: "pointer" }}>
                {plat.dispo ? "⏸ Indisponible" : "▶ Disponible"}
              </div>
            </div>
          </div>
        ))}
        <div onClick={() => onNavigate("menu_add")} style={{ border: `1.5px dashed ${c.accent}40`, borderRadius: 14, padding: "16px", textAlign: "center", cursor: "pointer" }}>
          <div style={{ fontSize: 22, color: c.accent }}>+</div>
          <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>Ajouter un plat dans {cat}</div>
        </div>
      </div>
      <ProNavBar active="menu" onNavigate={onNavigate} />
    </div>
  );
};

const MenuAddScreen = ({ onNavigate }) => (
  <div>
    <Header title="Nouveau plat" back onBack={() => onNavigate("menu")} />
    <div style={{ padding: "14px 16px" }}>
      <Input label="Nom du plat" value="" placeholder="Ex : Brochettes mixtes" icon="🍽️" />
      <Input label="Description" value="" placeholder="Ingrédients, préparation…" icon="📝" hint="Aide les clients à faire leur choix" />
      <Input label="Prix (DA)" value="" placeholder="Ex : 1400" icon="💰" />

      <div style={{ marginBottom: 13 }}>
        <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 5, fontWeight: 600 }}>Catégorie</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["🥗 Entrées", "🍖 Plats", "🍰 Desserts", "🥤 Boissons", "+ Nouvelle"].map((k, i) => (
            <div key={i} style={{
              padding: "6px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer",
              background: i === 1 ? c.accentSoft : c.card,
              color: i === 1 ? c.accent : c.textMuted,
              border: `1px solid ${i === 1 ? c.accent + "50" : c.cardBorder}`,
              fontWeight: i === 1 ? 700 : 400
            }}>{k}</div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 13 }}>
        <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 5, fontWeight: 600 }}>Photo du plat</div>
        <div style={{ border: `1.5px dashed ${c.accent}40`, borderRadius: 12, padding: "20px", textAlign: "center", cursor: "pointer" }}>
          <div style={{ fontSize: 28 }}>📷</div>
          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 6 }}>Ajouter une photo</div>
          <div style={{ fontSize: 10, color: c.textDim, marginTop: 2 }}>JPG, PNG · Max 5 Mo</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Toggle label="Disponible dès maintenant" on={true} sub="Les clients peuvent commander ce plat" />
        <Toggle label="Plat du jour" on={false} sub="Mis en avant sur ta fiche restaurant" />
        <Toggle label="Contient des allergènes" on={false} sub="Gluten, lactose, noix…" />
      </div>

      <Btn onClick={() => onNavigate("menu")}>Ajouter au menu →</Btn>
    </div>
  </div>
);

const MenuEditScreen = ({ onNavigate }) => (
  <div>
    <Header title="Modifier le plat" back onBack={() => onNavigate("menu")}
      right={<span style={{ fontSize: 11, color: c.red, cursor: "pointer", fontWeight: 700 }}>Supprimer</span>}
    />
    <div style={{ padding: "14px 16px" }}>
      <Input label="Nom du plat" value="Brochettes mixtes" placeholder="" icon="🍽️" />
      <Input label="Description" value="Agneau, poulet, kefta · Grillés au feu de bois" placeholder="" icon="📝" />
      <Input label="Prix (DA)" value="1 400" placeholder="" icon="💰" />

      <div style={{ marginBottom: 13 }}>
        <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 5, fontWeight: 600 }}>Photo actuelle</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ width: 70, height: 70, borderRadius: 12, background: "#2a1f10", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🍖</div>
          <div style={{ flex: 1 }}>
            <div style={{ background: c.accentSoft, borderRadius: 8, padding: "8px", textAlign: "center", fontSize: 11, color: c.accent, fontWeight: 700, cursor: "pointer" }}>📷 Changer la photo</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Toggle label="Disponible" on={true} sub="Visible par les clients" />
        <Toggle label="Plat du jour" on={true} sub="Mis en avant" />
      </div>

      <div style={{ background: c.card, borderRadius: 12, padding: "10px 12px", border: `1px solid ${c.cardBorder}`, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 6 }}>📊 Stats du plat</div>
        {[["Commandé", "48 fois ce mois"], ["Note moyenne", "★ 4.8 / 5"], ["Revenu généré", "67 200 DA"]].map(([k, v], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: c.textDim }}>{k}</span>
            <span style={{ fontSize: 11, color: c.text, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>

      <Btn onClick={() => onNavigate("menu")}>Enregistrer les modifications →</Btn>
    </div>
  </div>
);

const MenuCategorieScreen = ({ onNavigate }) => (
  <div>
    <Header title="Catégories du menu" back onBack={() => onNavigate("menu")} />
    <div style={{ padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
        Glisse pour réorganiser · Appuie pour renommer ou supprimer
      </div>
      {["🥗 Entrées", "🍖 Plats", "🍰 Desserts", "🥤 Boissons"].map((cat, i) => (
        <div key={i} style={{ background: c.card, borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: `1px solid ${c.cardBorder}`, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: c.textDim, fontSize: 16, cursor: "grab" }}>⠿</span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: c.text }}>{cat}</span>
          <span style={{ fontSize: 11, color: c.textDim }}>{[2, 3, 1, 0][i]} plats</span>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ fontSize: 13, cursor: "pointer" }}>✏️</span>
            <span style={{ fontSize: 13, cursor: "pointer", color: c.red }}>🗑</span>
          </div>
        </div>
      ))}
      <div style={{ border: `1.5px dashed ${c.accent}40`, borderRadius: 12, padding: "12px", textAlign: "center", cursor: "pointer", marginTop: 4 }}>
        <span style={{ fontSize: 12, color: c.accent, fontWeight: 700 }}>+ Nouvelle catégorie</span>
      </div>
      <div style={{ marginTop: 14 }}>
        <Btn onClick={() => onNavigate("menu")}>Enregistrer l'ordre →</Btn>
      </div>
    </div>
  </div>
);

// ── PROMOTIONS ────────────────────────────────────────────────────────────

const PromoScreen = ({ onNavigate }) => (
  <div>
    <Header
      title="Mes promotions"
      sub="Le Tantra"
      right={
        <div onClick={() => onNavigate("promo_create")} style={{ background: c.accent, color: "#000", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>+ Créer</div>
      }
    />
    <div style={{ padding: "12px 16px" }}>
      <div style={{ background: c.greenSoft, borderRadius: 14, padding: "12px", border: `1px solid ${c.green}40`, marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ fontSize: 22 }}>🟢</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.green }}>1 promo active en ce moment</div>
          <div style={{ fontSize: 11, color: c.textMuted }}>Visible par tous les clients sur ta fiche</div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8 }}>⚡ Active</div>
      <div onClick={() => onNavigate("promo_active")} style={{ background: c.card, borderRadius: 14, padding: "14px", border: `1.5px solid ${c.accent}`, marginBottom: 14, cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: c.text }}>−20% sur l'addition</div>
            <div style={{ fontSize: 11, color: c.textMuted }}>Avant 21h · Tous les soirs</div>
          </div>
          <Tag color={c.greenSoft} textColor={c.green}>● Live</Tag>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          <Tag>📅 Lun–Ven</Tag>
          <Tag>🕐 18h–21h</Tag>
          <Tag>👥 Sans minimum</Tag>
        </div>
        <div style={{ background: "#0f0d0b", borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: c.textMuted }}>Utilisations aujourd'hui</span>
            <span style={{ fontSize: 11, color: c.accent, fontWeight: 700 }}>7 / 20</span>
          </div>
          <div style={{ height: 4, background: c.cardBorder, borderRadius: 2 }}>
            <div style={{ width: "35%", height: "100%", background: c.accent, borderRadius: 2 }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <div style={{ flex: 1, background: c.accentSoft, borderRadius: 8, padding: "7px", textAlign: "center", fontSize: 11, color: c.accent, fontWeight: 700, cursor: "pointer" }}>✏️ Modifier</div>
          <div style={{ flex: 1, background: c.redSoft, borderRadius: 8, padding: "7px", textAlign: "center", fontSize: 11, color: c.red, fontWeight: 700, cursor: "pointer" }}>⏸ Suspendre</div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8 }}>📋 Passées</div>
      {[
        { label: "−15% weekend", period: "1–15 Mai", uses: 34 },
        { label: "Menu spécial Ramadan", period: "Mars–Avr.", uses: 112 },
      ].map((p, i) => (
        <div key={i} style={{ background: c.card, borderRadius: 12, padding: "10px 12px", marginBottom: 8, border: `1px solid ${c.cardBorder}`, opacity: 0.7 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{p.label}</div>
            <Tag color={c.accentSoft} textColor={c.accent}>{p.uses} utilisations</Tag>
          </div>
          <div style={{ fontSize: 11, color: c.textDim, marginTop: 3 }}>{p.period}</div>
        </div>
      ))}
    </div>
    <ProNavBar active="promo" onNavigate={onNavigate} />
  </div>
);

const PromoCreateScreen = ({ onNavigate }) => {
  const [type, setType] = useState("percent");
  return (
    <div>
      <Header title="Créer une promotion" back onBack={() => onNavigate("promo")} />
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>Type de promotion</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { id: "percent", icon: "%", label: "Réduction %", desc: "Ex : −20% sur l'addition" },
            { id: "fixed", icon: "DA", label: "Montant fixe", desc: "Ex : −500 DA offerts" },
            { id: "free", icon: "🎁", label: "Offert", desc: "Ex : Dessert offert" },
            { id: "2for1", icon: "2×1", label: "2 pour 1", desc: "Le moins cher offert" },
          ].map(t => (
            <div key={t.id} onClick={() => setType(t.id)} style={{
              background: type === t.id ? c.accentSoft : c.card,
              border: `1.5px solid ${type === t.id ? c.accent : c.cardBorder}`,
              borderRadius: 12, padding: "12px", cursor: "pointer", textAlign: "center"
            }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: type === t.id ? c.accent : c.textMuted, marginBottom: 4 }}>{t.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: type === t.id ? c.accent : c.text }}>{t.label}</div>
              <div style={{ fontSize: 10, color: c.textDim, marginTop: 2 }}>{t.desc}</div>
            </div>
          ))}
        </div>

        {type === "percent" && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 5, fontWeight: 600 }}>Pourcentage de réduction</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["10%", "15%", "20%", "25%", "30%"].map((v, i) => (
                <div key={i} style={{
                  flex: 1, padding: "8px 0", borderRadius: 10, textAlign: "center", cursor: "pointer",
                  background: i === 2 ? c.accent : c.card, color: i === 2 ? "#000" : c.textMuted,
                  fontSize: 11, fontWeight: i === 2 ? 800 : 400, border: `1px solid ${i === 2 ? "transparent" : c.cardBorder}`
                }}>{v}</div>
              ))}
            </div>
          </div>
        )}

        <Input label="Période" value="Lundi – Vendredi" placeholder="Jours d'application" icon="📅" />

        <div style={{ marginBottom: 13 }}>
          <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 5, fontWeight: 600 }}>Créneau horaire</div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, background: c.card, border: `1px solid ${c.cardBorder}`, borderRadius: 10, padding: "9px", textAlign: "center", fontSize: 12, color: c.text }}>18h00</div>
            <div style={{ alignSelf: "center", color: c.textDim }}>→</div>
            <div style={{ flex: 1, background: c.card, border: `1px solid ${c.cardBorder}`, borderRadius: 10, padding: "9px", textAlign: "center", fontSize: 12, color: c.text }}>21h00</div>
          </div>
        </div>

        <Input label="Nombre max d'utilisations / soir" value="20" placeholder="Illimité si vide" icon="🔢" hint="Laisse vide pour ne pas limiter" />

        <div style={{ background: c.accentSoft, borderRadius: 12, padding: "10px 12px", border: `1px solid ${c.accent}30`, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: c.accent, fontWeight: 700, marginBottom: 3 }}>👁 Aperçu client</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: c.text }}>−20% sur l'addition</div>
          <div style={{ fontSize: 11, color: c.textMuted }}>Lun–Ven · 18h00–21h00 · Max 20/soir</div>
        </div>

        <Btn onClick={() => onNavigate("promo_active")}>Activer la promotion →</Btn>
      </div>
    </div>
  );
};

const PromoActiveScreen = ({ onNavigate }) => (
  <div style={{ minHeight: 560, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center" }}>
    <div style={{ width: 70, height: 70, borderRadius: "50%", background: c.accentSoft, border: `2px solid ${c.accent}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 16 }}>🎁</div>
    <div style={{ fontSize: 20, fontWeight: 900, color: c.text, marginBottom: 6 }}>Promotion activée !</div>
    <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.7, marginBottom: 20, maxWidth: 200 }}>
      Ta promo est maintenant visible par tous les clients sur ta fiche Mida.
    </div>
    <div style={{ background: c.card, borderRadius: 14, padding: "14px", border: `1px solid ${c.accent}40`, width: "100%", marginBottom: 20, textAlign: "left" }}>
      {[["Type", "−20% sur l'addition"], ["Créneau", "18h00 – 21h00"], ["Jours", "Lun–Ven"], ["Limite", "20 utilisations / soir"], ["Statut", "● Active"]].map(([k, v], i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, paddingBottom: 8, borderBottom: i < 4 ? `1px solid ${c.cardBorder}` : "none" }}>
          <span style={{ fontSize: 12, color: c.textMuted }}>{k}</span>
          <span style={{ fontSize: 12, color: i === 4 ? c.green : c.text, fontWeight: i === 4 ? 700 : 500 }}>{v}</span>
        </div>
      ))}
    </div>
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      <Btn onClick={() => onNavigate("promo")}>Voir toutes mes promos</Btn>
      <Btn variant="ghost" onClick={() => onNavigate("promo_create")}>Créer une autre promo</Btn>
    </div>
  </div>
);

// ── PROFIL PUBLIC ─────────────────────────────────────────────────────────

const ProfilPublicScreen = ({ onNavigate }) => (
  <div>
    <Header
      title="Mon profil public"
      sub="Visible par les clients"
      right={<div onClick={() => onNavigate("profil_edit")} style={{ background: c.accentSoft, color: c.accent, borderRadius: 10, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✏️ Modifier</div>}
    />
    <div style={{ padding: "12px 16px" }}>
      <div style={{ background: "linear-gradient(135deg, #2a1f14, #1a1209)", borderRadius: 14, height: 100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, marginBottom: -20, position: "relative" }}>
        🎋
        <div onClick={() => onNavigate("profil_photos")} style={{ position: "absolute", bottom: 8, right: 8, background: c.accentSoft, border: `1px solid ${c.accent}50`, borderRadius: 8, padding: "4px 8px", fontSize: 10, color: c.accent, cursor: "pointer", fontWeight: 600 }}>📸 Photos</div>
      </div>
      <div style={{ background: c.card, borderRadius: 14, padding: "26px 14px 14px", border: `1px solid ${c.cardBorder}`, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: c.text }}>Le Tantra</div>
            <div style={{ fontSize: 11, color: c.textMuted }}>Fusion · Grillades · Hydra, Alger</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, color: c.accent, fontWeight: 800 }}>★ 4.7</div>
            <div style={{ fontSize: 10, color: c.textDim }}>312 avis</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 10, lineHeight: 1.6 }}>
          Cuisine fusion au cœur de Hydra. Spécialités de grillades, ambiance chaleureuse et service attentionné.
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          <Tag>🕐 12h–23h</Tag>
          <Tag>💰 1200–2500 DA</Tag>
          <Tag color={c.greenSoft} textColor={c.green}>✓ Parking</Tag>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8 }}>📊 Score de visibilité</div>
      <div style={{ background: c.card, borderRadius: 14, padding: "12px", border: `1px solid ${c.cardBorder}`, marginBottom: 12 }}>
        {[
          { label: "Photos", score: 80, tip: null },
          { label: "Informations", score: 100, tip: null },
          { label: "Horaires", score: 100, tip: null },
          { label: "Menu", score: 60, tip: "Ajoute des plats pour +20pts" },
          { label: "Avis répondus", score: 75, tip: null },
        ].map((item, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: c.text }}>{item.label}</span>
              <span style={{ fontSize: 11, color: item.score >= 80 ? c.green : c.accent, fontWeight: 700 }}>{item.score}%</span>
            </div>
            <div style={{ height: 4, background: c.cardBorder, borderRadius: 2 }}>
              <div style={{ width: `${item.score}%`, height: "100%", background: item.score >= 80 ? c.green : c.accent, borderRadius: 2 }} />
            </div>
            {item.tip && <div style={{ fontSize: 10, color: c.accent, marginTop: 2 }}>💡 {item.tip}</div>}
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${c.cardBorder}` }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: c.text }}>Score total</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: c.accent }}>83 / 100</span>
        </div>
      </div>

      {[
        { icon: "✏️", label: "Modifier les infos & description", screen: "profil_edit" },
        { icon: "📸", label: "Gérer les photos", screen: "profil_photos" },
        { icon: "🕐", label: "Horaires & infos pratiques", screen: "profil_horaires" },
      ].map((item, i) => (
        <div key={i} onClick={() => onNavigate(item.screen)} style={{ background: c.card, borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: `1px solid ${c.cardBorder}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: c.text }}>{item.icon} {item.label}</span>
          <span style={{ color: c.accent }}>›</span>
        </div>
      ))}
    </div>
    <ProNavBar active="profil_public" onNavigate={onNavigate} />
  </div>
);

const ProfilEditScreen = ({ onNavigate }) => (
  <div>
    <Header title="Modifier le profil" back onBack={() => onNavigate("profil_public")} />
    <div style={{ padding: "14px 16px" }}>
      <Input label="Nom du restaurant" value="Le Tantra" icon="🏪" />
      <Input label="Description courte" value="Cuisine fusion au cœur de Hydra. Spécialités de grillades…" icon="📝" hint="Max 200 caractères · Visible sur ta fiche" />
      <Input label="Adresse" value="12 Rue Hassiba Ben Bouali, Hydra" icon="📍" />
      <Input label="Téléphone" value="+213 21 54 32 10" icon="📞" />
      <Input label="Email" value="contact@letantra.dz" icon="✉️" />
      <Input label="Site web (optionnel)" value="" placeholder="https://votre-site.dz" icon="🌐" />

      <div style={{ marginBottom: 13 }}>
        <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 5, fontWeight: 600 }}>Type de cuisine</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["Fusion", "Grillades", "Algérien", "Oriental", "Méditerranéen"].map((t, i) => (
            <div key={i} style={{
              padding: "5px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer",
              background: [0, 1].includes(i) ? c.accentSoft : c.card,
              color: [0, 1].includes(i) ? c.accent : c.textMuted,
              border: `1px solid ${[0, 1].includes(i) ? c.accent + "50" : c.cardBorder}`,
              fontWeight: [0, 1].includes(i) ? 700 : 400
            }}>{t}</div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Toggle label="Parking disponible" on={true} />
        <Toggle label="Climatisation" on={true} />
        <Toggle label="Terrasse" on={false} />
        <Toggle label="Accessible PMR" on={false} />
        <Toggle label="Accepte les réservations groupes" on={true} />
      </div>
      <Btn onClick={() => onNavigate("profil_public")}>Enregistrer →</Btn>
    </div>
  </div>
);

const ProfilPhotosScreen = ({ onNavigate }) => (
  <div>
    <Header title="Photos du restaurant" back onBack={() => onNavigate("profil_public")} sub="6 photos · 1 photo de couverture" />
    <div style={{ padding: "12px 16px" }}>
      <div style={{ background: c.accentSoft, borderRadius: 12, padding: "10px 12px", border: `1px solid ${c.accent}30`, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: c.accent, fontWeight: 700 }}>💡 Conseil</div>
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Les restaurants avec 8+ photos obtiennent +45% de réservations.</div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8 }}>📸 Photo de couverture</div>
      <div style={{ height: 100, background: "linear-gradient(135deg, #2a1f14, #1a1209)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, marginBottom: 10, position: "relative", border: `2px solid ${c.accent}` }}>
        🎋
        <div style={{ position: "absolute", top: 8, right: 8, background: c.accent, color: "#000", borderRadius: 8, padding: "3px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Changer</div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8 }}>🖼 Galerie</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
        {["🍖", "🥘", "🍷", "✨", "🪑"].map((emoji, i) => (
          <div key={i} style={{ aspectRatio: "1", background: "linear-gradient(135deg, #2a1f14, #1a1209)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, position: "relative", cursor: "pointer", border: `1px solid ${c.cardBorder}` }}>
            {emoji}
            <div style={{ position: "absolute", top: 4, right: 4, background: c.redSoft, borderRadius: 6, width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: c.red, cursor: "pointer" }}>✕</div>
          </div>
        ))}
        <div style={{ aspectRatio: "1", border: `1.5px dashed ${c.accent}40`, borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, cursor: "pointer" }}>
          <span style={{ fontSize: 20, color: c.accent }}>+</span>
          <span style={{ fontSize: 8, color: c.textDim }}>Ajouter</span>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8 }}>📁 Catégories</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {["Salle", "Plats", "Ambiance", "Équipe", "Extérieur"].map((cat, i) => (
          <div key={i} style={{ padding: "5px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer", background: i === 0 ? c.accentSoft : c.card, color: i === 0 ? c.accent : c.textMuted, border: `1px solid ${i === 0 ? c.accent + "50" : c.cardBorder}`, fontWeight: i === 0 ? 700 : 400 }}>{cat}</div>
        ))}
      </div>
      <Btn onClick={() => onNavigate("profil_public")}>Enregistrer →</Btn>
    </div>
  </div>
);

const ProfilHorairesScreen = ({ onNavigate }) => (
  <div>
    <Header title="Horaires & infos pratiques" back onBack={() => onNavigate("profil_public")} />
    <div style={{ padding: "14px 16px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>🕐 Horaires d'ouverture</div>
      <div style={{ background: c.card, borderRadius: 14, padding: "4px", border: `1px solid ${c.cardBorder}`, marginBottom: 14 }}>
        {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((jour, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 10px", borderBottom: i < 6 ? `1px solid ${c.cardBorder}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: [5, 6].includes(i) ? c.redSoft : c.greenSoft, border: `1px solid ${[5, 6].includes(i) ? c.red : c.green}` }} />
              <span style={{ fontSize: 12, color: [5, 6].includes(i) ? c.textDim : c.text, fontWeight: [5, 6].includes(i) ? 400 : 500 }}>{jour}</span>
            </div>
            {[5, 6].includes(i)
              ? <span style={{ fontSize: 12, color: c.red, fontWeight: 600 }}>Fermé</span>
              : <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ background: c.cardBorder, borderRadius: 8, padding: "4px 8px", fontSize: 11, color: c.text }}>12h00</div>
                  <span style={{ color: c.textDim, fontSize: 10 }}>–</span>
                  <div style={{ background: c.cardBorder, borderRadius: 8, padding: "4px 8px", fontSize: 11, color: c.text }}>23h00</div>
                </div>
            }
          </div>
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>🍽️ Service</div>
      <div style={{ background: c.card, borderRadius: 14, padding: "4px", border: `1px solid ${c.cardBorder}`, marginBottom: 14 }}>
        <Toggle label="Service du midi" on={true} sub="12h00 – 15h00" />
        <Toggle label="Service du soir" on={true} sub="19h00 – 23h00" />
        <Toggle label="Brunch le weekend" on={false} sub="10h00 – 14h00" />
      </div>

      <Input label="Capacité totale (couverts)" value="80" icon="👥" hint="Nombre maximum de clients en simultané" />
      <Input label="Taille minimum de groupe" value="2" icon="👤" />
      <Input label="Taille maximum de groupe" value="12" icon="👥" hint="Au-delà, contacter directement le restaurant" />

      <div style={{ marginBottom: 16 }}>
        <Toggle label="Ouvert les jours fériés" on={false} />
        <Toggle label="Fermeture exceptionnelle" on={false} sub="Activer pour bloquer toutes les réservations" />
      </div>
      <Btn onClick={() => onNavigate("profil_public")}>Enregistrer →</Btn>
    </div>
  </div>
);

// ── NOTIFICATIONS PRO ─────────────────────────────────────────────────────

const notifsProData = [
  { icon: "📅", title: "Nouvelle réservation", body: "Amira B. · 2 pers. · Ce soir 20h00 · Table T2", time: "il y a 2 min", unread: true, color: c.greenSoft, tc: c.green, action: "Confirmer" },
  { icon: "❌", title: "Annulation · Karim D.", body: "Réservation du 26 Mai · 19h30 · 4 personnes annulée", time: "il y a 25 min", unread: true, color: c.redSoft, tc: c.red, action: null },
  { icon: "⭐", title: "Nouvel avis · 5 étoiles", body: "Nadia K. — \"Service impeccable, plats délicieux !\"", time: "il y a 1h", unread: true, color: c.accentSoft, tc: c.accent, action: "Répondre" },
  { icon: "⚠️", title: "No-show probable", body: "Sofiane M. · 21h00 · Pas de confirmation depuis 2h", time: "il y a 2h", unread: true, color: c.accentSoft, tc: c.accent, action: "Relancer" },
  { icon: "📊", title: "Résumé de la semaine", body: "187 réservations · +23% vs semaine dernière · Note : 4.7", time: "hier matin", unread: false, color: c.blueSoft, tc: c.blue, action: null },
  { icon: "🎁", title: "Promo : 7 utilisations aujourd'hui", body: "Ta promo −20% est bien active. 13 créneaux restants.", time: "hier", unread: false, color: c.purpleSoft, tc: c.purple, action: null },
];

const NotifProScreen = ({ onNavigate }) => (
  <div>
    <div style={{ padding: "16px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: c.text }}>Alertes</div>
        <div style={{ fontSize: 11, color: c.textMuted }}>4 non lues · Le Tantra</div>
      </div>
      <span style={{ fontSize: 11, color: c.accent, cursor: "pointer", fontWeight: 700 }} onClick={() => onNavigate("notifs_pro_settings")}>⚙️ Paramètres</span>
    </div>
    <div style={{ padding: "0 16px 12px" }}>
      {notifsProData.map((n, i) => (
        <div key={i} style={{
          background: n.unread ? n.color : c.card,
          border: `1px solid ${n.unread ? n.tc + "30" : c.cardBorder}`,
          borderRadius: 14, padding: "12px", marginBottom: 8,
          display: "flex", gap: 10, alignItems: "flex-start"
        }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: n.color, border: `1px solid ${n.tc}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{n.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
              <div style={{ fontSize: 12, fontWeight: n.unread ? 700 : 500, color: c.text, lineHeight: 1.3 }}>{n.title}</div>
              {n.unread && <div style={{ width: 7, height: 7, borderRadius: "50%", background: n.tc, flexShrink: 0, marginTop: 4 }} />}
            </div>
            <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3, lineHeight: 1.4 }}>{n.body}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
              <div style={{ fontSize: 10, color: c.textDim }}>{n.time}</div>
              {n.action && (
                <div style={{ background: n.color, border: `1px solid ${n.tc}40`, borderRadius: 8, padding: "4px 10px", fontSize: 10, color: n.tc, fontWeight: 700, cursor: "pointer" }}>{n.action} →</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
    <ProNavBar active="notifs_pro" onNavigate={onNavigate} />
  </div>
);

const NotifProSettingsScreen = ({ onNavigate }) => (
  <div>
    <Header title="Préférences d'alertes" back onBack={() => onNavigate("notifs_pro")} />
    <div style={{ padding: "14px 16px" }}>
      {[
        { section: "📅 Réservations", items: [
          { label: "Nouvelle réservation", sub: "Alerte immédiate", on: true },
          { label: "Annulation reçue", sub: "Alerte immédiate", on: true },
          { label: "Modification de réservation", sub: "Alerte immédiate", on: true },
          { label: "No-show probable (−2h)", sub: "Rappel 2h avant", on: true },
        ]},
        { section: "⭐ Avis", items: [
          { label: "Nouvel avis reçu", sub: "Toutes les notes", on: true },
          { label: "Avis négatif (1–3 ⭐)", sub: "Priorité haute", on: true },
          { label: "Réponse attendue depuis 24h", sub: "Rappel quotidien", on: false },
        ]},
        { section: "📊 Rapports", items: [
          { label: "Résumé quotidien", sub: "Tous les soirs à 23h", on: true },
          { label: "Résumé hebdomadaire", sub: "Chaque lundi matin", on: true },
          { label: "Alerte baisse de fréquentation", sub: "Si −20% vs semaine précédente", on: false },
        ]},
        { section: "🎁 Promotions", items: [
          { label: "Promo bientôt épuisée", sub: "Reste 5 utilisations", on: true },
          { label: "Résumé promo", sub: "En fin de journée", on: false },
        ]},
      ].map((group, gi) => (
        <div key={gi} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.accent, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>{group.section}</div>
          <div style={{ background: c.card, borderRadius: 14, padding: "0 12px", border: `1px solid ${c.cardBorder}` }}>
            {group.items.map((item, i) => (
              <Toggle key={i} label={item.label} sub={item.sub} on={item.on} />
            ))}
          </div>
        </div>
      ))}

      <div style={{ background: c.card, borderRadius: 14, padding: "12px", border: `1px solid ${c.cardBorder}`, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8 }}>📱 Canal de notification</div>
        {[["Push app", true], ["SMS", true], ["Email", false]].map(([label, on], i) => (
          <Toggle key={i} label={label} on={on} />
        ))}
      </div>
      <Btn onClick={() => onNavigate("notifs_pro")}>Enregistrer →</Btn>
    </div>
  </div>
);

// ── MAIN ──────────────────────────────────────────────────────────────────

const screenGroups = [
  { title: "🚀 Onboarding Pro", screens: ["onb1", "onb2", "onb3", "onb4"] },
  { title: "🍽️ Menu", screens: ["menu", "menu_add", "menu_edit", "menu_categorie"] },
  { title: "🎁 Promotions", screens: ["promo", "promo_create", "promo_active"] },
  { title: "🏪 Profil public", screens: ["profil_public", "profil_edit", "profil_photos", "profil_horaires"] },
  { title: "🔔 Notifications Pro", screens: ["notifs_pro", "notifs_pro_settings"] },
];

export default function MidaRestaurateurWireframes() {
  const [active, setActive] = useState("onb1");

  const renderScreen = (screen) => {
    const p = { onNavigate: setActive };
    switch (screen) {
      case "onb1": return <Onb1Screen {...p} />;
      case "onb2": return <Onb2Screen {...p} />;
      case "onb3": return <Onb3Screen {...p} />;
      case "onb4": return <Onb4Screen {...p} />;
      case "menu": return <MenuScreen {...p} />;
      case "menu_add": return <MenuAddScreen {...p} />;
      case "menu_edit": return <MenuEditScreen {...p} />;
      case "menu_categorie": return <MenuCategorieScreen {...p} />;
      case "promo": return <PromoScreen {...p} />;
      case "promo_create": return <PromoCreateScreen {...p} />;
      case "promo_active": return <PromoActiveScreen {...p} />;
      case "profil_public": return <ProfilPublicScreen {...p} />;
      case "profil_edit": return <ProfilEditScreen {...p} />;
      case "profil_photos": return <ProfilPhotosScreen {...p} />;
      case "profil_horaires": return <ProfilHorairesScreen {...p} />;
      case "notifs_pro": return <NotifProScreen {...p} />;
      case "notifs_pro_settings": return <NotifProSettingsScreen {...p} />;
      default: return <div style={{ padding: 20, color: c.text }}>{screen}</div>;
    }
  };

  return (
    <div style={{ background: "#080706", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", color: c.text }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: c.accent, letterSpacing: -1, fontFamily: "Georgia, serif" }}>mida</div>
          <div style={{ fontSize: 13, color: c.textMuted, letterSpacing: 2, textTransform: "uppercase" }}>Côté Restaurateur · Wireframes v1.0</div>
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
          <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>✅ {Object.keys(screenLabels).length} écrans couverts</div>
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
