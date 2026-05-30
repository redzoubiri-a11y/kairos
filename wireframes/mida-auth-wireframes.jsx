import { useState } from "react";

// ── DESIGN TOKENS (identiques au wireframe principal) ─────────────────────
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
};

const screenLabels = {
  onboarding1: "Onboarding 1",
  onboarding2: "Onboarding 2",
  onboarding3: "Onboarding 3",
  choix: "Connexion / Inscription",
  login: "Connexion",
  login_error: "Connexion · Erreur",
  register1: "Créer un compte · Étape 1",
  register2: "Créer un compte · Étape 2",
  register3: "Créer un compte · Étape 3",
  verify: "Vérification SMS",
  forgot: "Mot de passe oublié",
  reset: "Nouveau mot de passe",
  success: "Connexion réussie",
  logout: "Déconnexion",
  type: "Type de compte",
  register_resto: "Compte Restaurateur",
};

// ── COMPOSANTS RÉUTILISABLES ──────────────────────────────────────────────

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

const Input = ({ label, value, type = "text", placeholder, icon, error, hint, show, onToggle }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, color: error ? c.red : c.textMuted, marginBottom: 5, fontWeight: 600 }}>{label}</div>
    <div style={{
      background: c.card,
      border: `1.5px solid ${error ? c.red : value ? c.accent + "60" : c.cardBorder}`,
      borderRadius: 12, padding: "11px 14px",
      display: "flex", alignItems: "center", gap: 8,
      transition: "border-color 0.2s"
    }}>
      {icon && <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>}
      <span style={{ fontSize: 13, color: value ? c.text : c.textDim, flex: 1 }}>
        {value || placeholder}
      </span>
      {type === "password" && (
        <span style={{ fontSize: 13, color: c.textDim, cursor: "pointer" }}>{show ? "👁" : "🙈"}</span>
      )}
    </div>
    {error && <div style={{ fontSize: 11, color: c.red, marginTop: 4 }}>⚠ {error}</div>}
    {hint && !error && <div style={{ fontSize: 11, color: c.textDim, marginTop: 4 }}>{hint}</div>}
  </div>
);

const Btn = ({ children, variant = "primary", onClick, disabled }) => {
  const styles = {
    primary: { background: c.accent, color: "#000", border: "none" },
    secondary: { background: "transparent", color: c.accent, border: `1.5px solid ${c.accent}` },
    ghost: { background: c.card, color: c.textMuted, border: `1px solid ${c.cardBorder}` },
    danger: { background: c.redSoft, color: c.red, border: `1px solid ${c.red}30` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", borderRadius: 14, padding: "14px",
      fontSize: 14, fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer",
      letterSpacing: 0.3, opacity: disabled ? 0.5 : 1,
      ...styles[variant]
    }}>{children}</button>
  );
};

const Divider = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
    <div style={{ flex: 1, height: 1, background: c.cardBorder }} />
    <span style={{ fontSize: 11, color: c.textDim }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: c.cardBorder }} />
  </div>
);

const SocialBtn = ({ icon, label }) => (
  <div style={{
    background: c.card, border: `1px solid ${c.cardBorder}`,
    borderRadius: 12, padding: "11px", display: "flex",
    alignItems: "center", justifyContent: "center", gap: 8,
    cursor: "pointer", fontSize: 13, color: c.textMuted, fontWeight: 600
  }}>
    <span style={{ fontSize: 16 }}>{icon}</span> {label}
  </div>
);

const StepDots = ({ total, active }) => (
  <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} style={{
        width: i === active ? 20 : 6, height: 6, borderRadius: 3,
        background: i === active ? c.accent : i < active ? c.accentDim : c.cardBorder,
        transition: "width 0.3s"
      }} />
    ))}
  </div>
);

const Logo = ({ size = "md" }) => (
  <div style={{ textAlign: "center", marginBottom: size === "sm" ? 16 : 24 }}>
    <div style={{ fontSize: size === "sm" ? 28 : 40 }}>🍽️</div>
    <div style={{
      fontSize: size === "sm" ? 26 : 36, fontWeight: 900,
      color: c.accent, letterSpacing: -1, fontFamily: "Georgia, serif", lineHeight: 1
    }}>mida</div>
    {size !== "sm" && (
      <div style={{ fontSize: 10, color: c.textMuted, letterSpacing: 3, marginTop: 4, textTransform: "uppercase" }}>
        Alger · Resto · Réservation
      </div>
    )}
  </div>
);

// ── ÉCRANS D'ONBOARDING ───────────────────────────────────────────────────

const slides = [
  {
    emoji: "🔍",
    title: "Trouve ton resto en 10 secondes",
    desc: "Parcours les meilleurs restaurants d'Alger, filtre par quartier, cuisine et budget.",
    bg: "linear-gradient(160deg, #1a1208 0%, #0f0d0b 100%)",
  },
  {
    emoji: "📅",
    title: "Réserve sans appeler",
    desc: "Choisis ton créneau, ton nombre de couverts, et c'est confirmé instantanément.",
    bg: "linear-gradient(160deg, #0d1a10 0%, #0f0d0b 100%)",
  },
  {
    emoji: "⭐",
    title: "Des avis 100% vérifiés",
    desc: "Chaque note vient d'un client ayant vraiment réservé. Pas de faux avis.",
    bg: "linear-gradient(160deg, #1a1408 0%, #0f0d0b 100%)",
  },
];

const OnboardingScreen = ({ idx, onNavigate }) => {
  const slide = slides[idx];
  const nextScreen = idx < 2 ? `onboarding${idx + 2}` : "choix";
  return (
    <div style={{ minHeight: 560, background: slide.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 18px" }}>
        <span onClick={() => onNavigate("choix")} style={{ fontSize: 11, color: c.textDim, cursor: "pointer" }}>
          Passer →
        </span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", textAlign: "center", gap: 16 }}>
        <div style={{ fontSize: 64 }}>{slide.emoji}</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: c.text, lineHeight: 1.2 }}>{slide.title}</div>
        <div style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.7 }}>{slide.desc}</div>
      </div>
      <div style={{ padding: "0 24px 32px" }}>
        <StepDots total={3} active={idx} />
        <Btn onClick={() => onNavigate(nextScreen)}>
          {idx < 2 ? "Suivant →" : "Commencer →"}
        </Btn>
      </div>
    </div>
  );
};

// ── ÉCRAN CHOIX ────────────────────────────────────────────────────────────

const ChoixScreen = ({ onNavigate }) => (
  <div style={{ minHeight: 560, display: "flex", flexDirection: "column" }}>
    <div style={{
      flex: 1, background: "linear-gradient(180deg, #1a1208 0%, #0f0d0b 70%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "32px 24px 20px"
    }}>
      <Logo />
      <div style={{ fontSize: 12, color: c.textMuted, textAlign: "center", lineHeight: 1.7, maxWidth: 200, marginBottom: 8 }}>
        La plateforme de réservation de restaurants faite pour Alger
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
        {["347 restaurants", "100% avis vérifiés", "Résa en 30s"].map((t, i) => (
          <div key={i} style={{ background: c.accentSoft, borderRadius: 20, padding: "4px 10px", fontSize: 10, color: c.accent, fontWeight: 600 }}>{t}</div>
        ))}
      </div>
    </div>
    <div style={{ padding: "20px 24px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
      <Btn onClick={() => onNavigate("register1")}>Créer un compte</Btn>
      <Btn variant="secondary" onClick={() => onNavigate("login")}>Se connecter</Btn>
      <Divider label="ou continuer avec" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <SocialBtn icon="🇬" label="Google" />
        <SocialBtn icon="🍎" label="Apple" />
      </div>
      <div style={{ textAlign: "center", marginTop: 6 }}>
        <span style={{ fontSize: 11, color: c.textDim }}>Tu es restaurateur ? </span>
        <span onClick={() => onNavigate("type")} style={{ fontSize: 11, color: c.accent, fontWeight: 700, cursor: "pointer" }}>Espace pro →</span>
      </div>
    </div>
  </div>
);

// ── CONNEXION ──────────────────────────────────────────────────────────────

const LoginScreen = ({ onNavigate, hasError }) => (
  <div style={{ padding: "20px 20px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <span onClick={() => onNavigate("choix")} style={{ fontSize: 20, color: c.textMuted, cursor: "pointer" }}>←</span>
      <Logo size="sm" />
    </div>
    <div style={{ fontSize: 20, fontWeight: 900, color: c.text, marginBottom: 4 }}>Bon retour 👋</div>
    <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 20 }}>Connecte-toi à ton compte Mida</div>

    {hasError && (
      <div style={{ background: c.redSoft, border: `1px solid ${c.red}40`, borderRadius: 12, padding: "10px 12px", marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
        <span style={{ fontSize: 14 }}>⚠️</span>
        <div>
          <div style={{ fontSize: 12, color: c.red, fontWeight: 700 }}>Identifiants incorrects</div>
          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Vérifie ton email ou ton mot de passe.</div>
        </div>
      </div>
    )}

    <Input label="Adresse email" value={hasError ? "amira@email.com" : ""} placeholder="ton@email.com" icon="✉️" error={hasError ? "Email ou mot de passe incorrect" : null} />
    <Input label="Mot de passe" value={hasError ? "••••••••" : ""} placeholder="••••••••" type="password" icon="🔒" />

    <div style={{ textAlign: "right", marginTop: -8, marginBottom: 16 }}>
      <span onClick={() => onNavigate("forgot")} style={{ fontSize: 11, color: c.accent, cursor: "pointer", fontWeight: 600 }}>
        Mot de passe oublié ?
      </span>
    </div>

    <Btn onClick={() => onNavigate("success")}>Se connecter</Btn>

    <Divider label="ou" />

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
      <SocialBtn icon="🇬" label="Google" />
      <SocialBtn icon="🍎" label="Apple" />
    </div>

    <div style={{ textAlign: "center" }}>
      <span style={{ fontSize: 12, color: c.textMuted }}>Pas encore de compte ? </span>
      <span onClick={() => onNavigate("register1")} style={{ fontSize: 12, color: c.accent, fontWeight: 700, cursor: "pointer" }}>
        S'inscrire →
      </span>
    </div>
  </div>
);

// ── INSCRIPTION ────────────────────────────────────────────────────────────

const Register1Screen = ({ onNavigate }) => (
  <div style={{ padding: "20px 20px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span onClick={() => onNavigate("choix")} style={{ fontSize: 20, color: c.textMuted, cursor: "pointer" }}>←</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>Créer un compte</div>
        <div style={{ fontSize: 11, color: c.textMuted }}>Étape 1 sur 3 · Identité</div>
      </div>
    </div>
    <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
      {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s === 1 ? c.accent : c.cardBorder }} />)}
    </div>

    <Input label="Prénom" value="Amira" placeholder="Ton prénom" icon="👤" hint="Ton prénom apparaîtra dans tes réservations" />
    <Input label="Nom" value="" placeholder="Ton nom de famille" icon="👤" />
    <Input label="Numéro de téléphone" value="+213 661 23 45 67" placeholder="+213 6XX XX XX XX" icon="📱" hint="Pour recevoir tes confirmations par SMS" />

    <div style={{ background: c.card, borderRadius: 12, padding: "10px 12px", border: `1px solid ${c.cardBorder}`, marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6 }}>
        🔒 Tes données sont protégées et ne seront jamais revendues à des tiers.
      </div>
    </div>

    <Btn onClick={() => onNavigate("register2")}>Continuer →</Btn>
    <div style={{ textAlign: "center", marginTop: 12 }}>
      <span style={{ fontSize: 12, color: c.textMuted }}>Déjà un compte ? </span>
      <span onClick={() => onNavigate("login")} style={{ fontSize: 12, color: c.accent, fontWeight: 700, cursor: "pointer" }}>Se connecter</span>
    </div>
  </div>
);

const Register2Screen = ({ onNavigate }) => (
  <div style={{ padding: "20px 20px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span onClick={() => onNavigate("register1")} style={{ fontSize: 20, color: c.textMuted, cursor: "pointer" }}>←</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>Créer un compte</div>
        <div style={{ fontSize: 11, color: c.textMuted }}>Étape 2 sur 3 · Connexion</div>
      </div>
    </div>
    <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
      {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= 2 ? c.accent : c.cardBorder }} />)}
    </div>

    <Input label="Adresse email" value="" placeholder="ton@email.com" icon="✉️" hint="Utilisée pour tes confirmations de réservation" />
    <Input label="Mot de passe" value="" placeholder="Min. 8 caractères" type="password" icon="🔒" />
    <Input label="Confirmer le mot de passe" value="" placeholder="Répète ton mot de passe" type="password" icon="🔒" />

    <div style={{ background: c.accentSoft, borderRadius: 12, padding: "10px 12px", border: `1px solid ${c.accent}30`, marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: c.accent, fontWeight: 700, marginBottom: 4 }}>🔐 Force du mot de passe</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= 2 ? "#E8A045" : c.cardBorder }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: c.textMuted }}>Moyen · Ajoute un caractère spécial pour renforcer</div>
    </div>

    <Btn onClick={() => onNavigate("verify")}>Continuer →</Btn>
  </div>
);

const Register3Screen = ({ onNavigate }) => (
  <div style={{ padding: "20px 20px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span onClick={() => onNavigate("register2")} style={{ fontSize: 20, color: c.textMuted, cursor: "pointer" }}>←</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>Créer un compte</div>
        <div style={{ fontSize: 11, color: c.textMuted }}>Étape 3 sur 3 · Préférences</div>
      </div>
    </div>
    <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
      {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: c.accent }} />)}
    </div>

    <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>📍 Ta zone préférée</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
      {["Hydra", "El Biar", "Ben Aknoun", "Alger Centre", "Bab Ezzouar", "Sidi Yahia", "Kouba", "Bouzaréah"].map((q, i) => (
        <div key={i} style={{
          padding: "6px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer",
          background: [0, 2, 5].includes(i) ? c.accentSoft : c.card,
          color: [0, 2, 5].includes(i) ? c.accent : c.textMuted,
          border: `1px solid ${[0, 2, 5].includes(i) ? c.accent + "50" : c.cardBorder}`,
          fontWeight: [0, 2, 5].includes(i) ? 700 : 400
        }}>{q}</div>
      ))}
    </div>

    <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>🍽️ Tes cuisines préférées</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
      {["🍖 Grillades", "🥘 Traditionnel", "🍕 Pizza", "🍣 Sushi", "🥗 Végétarien", "🍔 Burgers"].map((f, i) => (
        <div key={i} style={{
          padding: "6px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer",
          background: [0, 1].includes(i) ? c.accentSoft : c.card,
          color: [0, 1].includes(i) ? c.accent : c.textMuted,
          border: `1px solid ${[0, 1].includes(i) ? c.accent + "50" : c.cardBorder}`,
          fontWeight: [0, 1].includes(i) ? 700 : 400
        }}>{f}</div>
      ))}
    </div>

    <div style={{ background: c.card, borderRadius: 12, padding: "10px 12px", border: `1px solid ${c.cardBorder}`, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: c.text }}>🔔 Notifications de promos</span>
        <div style={{ width: 36, height: 20, borderRadius: 10, background: c.accent, position: "relative" }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#000", position: "absolute", right: 2, top: 2 }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: c.text }}>📧 Emails de rappel</span>
        <div style={{ width: 36, height: 20, borderRadius: 10, background: c.accentSoft, border: `1px solid ${c.cardBorder}`, position: "relative" }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: c.textDim, position: "absolute", left: 2, top: 1 }} />
        </div>
      </div>
    </div>

    <Btn onClick={() => onNavigate("verify")}>Créer mon compte 🎉</Btn>
    <div style={{ fontSize: 10, color: c.textDim, textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
      En créant un compte, tu acceptes les{" "}
      <span style={{ color: c.accent }}>Conditions d'utilisation</span> et la{" "}
      <span style={{ color: c.accent }}>Politique de confidentialité</span> de Mida.
    </div>
  </div>
);

// ── VÉRIFICATION SMS ────────────────────────────────────────────────────────

const VerifyScreen = ({ onNavigate }) => (
  <div style={{ padding: "20px 20px", minHeight: 560, display: "flex", flexDirection: "column" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
      <span onClick={() => onNavigate("register2")} style={{ fontSize: 20, color: c.textMuted, cursor: "pointer" }}>←</span>
    </div>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: c.text, marginBottom: 8 }}>Vérifie ton numéro</div>
      <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.7, marginBottom: 28, maxWidth: 200 }}>
        Un code à 6 chiffres a été envoyé au<br />
        <span style={{ color: c.accent, fontWeight: 700 }}>+213 661 23 45 67</span>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {["4", "8", "2", "·", "·", "·"].map((digit, i) => (
          <div key={i} style={{
            width: 36, height: 44, borderRadius: 10,
            background: c.card,
            border: `2px solid ${i === 3 ? c.accent : i < 3 ? c.accent + "40" : c.cardBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800,
            color: i < 3 ? c.text : c.textDim
          }}>{digit}</div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 20 }}>
        Code expirant dans{" "}
        <span style={{ color: c.accent, fontWeight: 700 }}>02:34</span>
      </div>

      <div style={{ width: "100%", marginBottom: 12 }}>
        <Btn onClick={() => onNavigate("success")}>Vérifier le code →</Btn>
      </div>
      <div style={{ width: "100%" }}>
        <Btn variant="ghost">Renvoyer le code</Btn>
      </div>

      <div style={{ marginTop: 16 }}>
        <span onClick={() => onNavigate("register1")} style={{ fontSize: 11, color: c.textDim, cursor: "pointer" }}>
          Changer de numéro ?
        </span>
      </div>
    </div>
  </div>
);

// ── MOT DE PASSE OUBLIÉ ────────────────────────────────────────────────────

const ForgotScreen = ({ onNavigate }) => (
  <div style={{ padding: "20px 20px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
      <span onClick={() => onNavigate("login")} style={{ fontSize: 20, color: c.textMuted, cursor: "pointer" }}>←</span>
    </div>
    <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>🔑</div>
    <div style={{ fontSize: 18, fontWeight: 900, color: c.text, textAlign: "center", marginBottom: 6 }}>Mot de passe oublié</div>
    <div style={{ fontSize: 12, color: c.textMuted, textAlign: "center", lineHeight: 1.7, marginBottom: 24 }}>
      Saisis ton email ou numéro de téléphone. On t'envoie un lien de réinitialisation.
    </div>

    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {["📧 Email", "📱 SMS"].map((opt, i) => (
        <div key={i} style={{
          flex: 1, padding: "10px", borderRadius: 12, textAlign: "center",
          background: i === 0 ? c.accentSoft : c.card,
          border: `1.5px solid ${i === 0 ? c.accent : c.cardBorder}`,
          fontSize: 12, color: i === 0 ? c.accent : c.textMuted,
          fontWeight: i === 0 ? 700 : 400, cursor: "pointer"
        }}>{opt}</div>
      ))}
    </div>

    <Input label="Adresse email" value="amira@email.com" placeholder="ton@email.com" icon="✉️" />

    <Btn onClick={() => onNavigate("reset")}>Envoyer le lien →</Btn>

    <div style={{ background: c.card, borderRadius: 12, padding: "10px 12px", border: `1px solid ${c.cardBorder}`, marginTop: 14 }}>
      <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6 }}>
        💡 Vérifie aussi tes spams si tu ne reçois rien dans les 2 minutes.
      </div>
    </div>
  </div>
);

// ── RESET MOT DE PASSE ─────────────────────────────────────────────────────

const ResetScreen = ({ onNavigate }) => (
  <div style={{ padding: "20px 20px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <span onClick={() => onNavigate("forgot")} style={{ fontSize: 20, color: c.textMuted, cursor: "pointer" }}>←</span>
    </div>
    <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>🔐</div>
    <div style={{ fontSize: 18, fontWeight: 900, color: c.text, textAlign: "center", marginBottom: 6 }}>Nouveau mot de passe</div>
    <div style={{ fontSize: 12, color: c.textMuted, textAlign: "center", marginBottom: 24, lineHeight: 1.7 }}>
      Lien valide pour<br /><span style={{ color: c.accent, fontWeight: 700 }}>amira@email.com</span>
    </div>

    <Input label="Nouveau mot de passe" value="" placeholder="Min. 8 caractères" type="password" icon="🔒" />
    <Input label="Confirmer le mot de passe" value="" placeholder="Répète ton nouveau mot de passe" type="password" icon="🔒" />

    <div style={{ background: c.card, borderRadius: 12, padding: "10px 12px", border: `1px solid ${c.cardBorder}`, marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 6 }}>Critères :</div>
      {["✅ Minimum 8 caractères", "✅ Au moins une majuscule", "❌ Au moins un chiffre", "❌ Au moins un caractère spécial"].map((r, i) => (
        <div key={i} style={{ fontSize: 11, color: r.startsWith("✅") ? c.green : c.textDim, marginBottom: 3 }}>{r}</div>
      ))}
    </div>

    <Btn disabled>Enregistrer →</Btn>
    <div style={{ fontSize: 11, color: c.textDim, textAlign: "center", marginTop: 10 }}>Complète les critères pour continuer</div>
  </div>
);

// ── CONNEXION RÉUSSIE ─────────────────────────────────────────────────────

const SuccessScreen = ({ onNavigate }) => (
  <div style={{ minHeight: 560, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center" }}>
    <div style={{ width: 70, height: 70, borderRadius: "50%", background: c.greenSoft, border: `2px solid ${c.green}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 16 }}>✅</div>
    <div style={{ fontSize: 20, fontWeight: 900, color: c.text, marginBottom: 6 }}>Bienvenue sur Mida !</div>
    <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.7, marginBottom: 24, maxWidth: 200 }}>
      Ton compte est actif. Tu gagnes{" "}
      <span style={{ color: c.accent, fontWeight: 700 }}>100 points</span>{" "}
      de bienvenue 🎁
    </div>
    <div style={{ background: c.accentSoft, border: `1px solid ${c.accent}40`, borderRadius: 14, padding: "14px", width: "100%", marginBottom: 20 }}>
      <div style={{ fontSize: 12, color: c.accent, fontWeight: 700, marginBottom: 4 }}>🏅 Points de bienvenue</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: c.text }}>100 pts</div>
      <div style={{ fontSize: 11, color: c.textMuted }}>Réserve ton 1er restaurant pour en gagner encore !</div>
    </div>
    <div style={{ width: "100%" }}>
      <Btn onClick={() => onNavigate("logout")}>Découvrir les restaurants →</Btn>
    </div>
  </div>
);

// ── DÉCONNEXION ────────────────────────────────────────────────────────────

const LogoutScreen = ({ onNavigate }) => (
  <div style={{ padding: "20px 20px" }}>
    <div style={{ fontSize: 15, fontWeight: 800, color: c.text, marginBottom: 4 }}>Mon compte</div>
    <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 20 }}>Amira Benali · amira@email.com</div>

    <div style={{ background: c.card, borderRadius: 14, overflow: "hidden", border: `1px solid ${c.cardBorder}`, marginBottom: 16 }}>
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${c.cardBorder}` }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: c.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: c.accent, fontWeight: 800 }}>A</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>Amira Benali</div>
          <div style={{ fontSize: 11, color: c.textMuted }}>Membre Gold · 1 240 pts</div>
        </div>
      </div>
      {["✏️  Modifier mon profil", "🔒  Changer le mot de passe", "📱  Numéro de téléphone", "🔔  Notifications"].map((item, i) => (
        <div key={i} style={{ padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: i < 3 ? `1px solid ${c.cardBorder}` : "none", cursor: "pointer" }}>
          <span style={{ fontSize: 13, color: c.text }}>{item}</span>
          <span style={{ color: c.textDim }}>›</span>
        </div>
      ))}
    </div>

    <div style={{ background: c.card, borderRadius: 14, overflow: "hidden", border: `1px solid ${c.cardBorder}`, marginBottom: 16 }}>
      {["🛡️  Confidentialité", "📄  Conditions d'utilisation", "❓  Aide & Support"].map((item, i) => (
        <div key={i} style={{ padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: i < 2 ? `1px solid ${c.cardBorder}` : "none", cursor: "pointer" }}>
          <span style={{ fontSize: 13, color: c.text }}>{item}</span>
          <span style={{ color: c.textDim }}>›</span>
        </div>
      ))}
    </div>

    <div style={{ background: c.card, borderRadius: 14, border: `1px solid ${c.cardBorder}`, overflow: "hidden", marginBottom: 16 }}>
      <div onClick={() => onNavigate("choix")} style={{ padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${c.cardBorder}`, cursor: "pointer" }}>
        <span style={{ fontSize: 13, color: c.red, fontWeight: 700 }}>🚪  Se déconnecter</span>
        <span style={{ color: c.textDim }}>›</span>
      </div>
      <div style={{ padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
        <span style={{ fontSize: 13, color: c.red }}>🗑️  Supprimer mon compte</span>
        <span style={{ color: c.textDim }}>›</span>
      </div>
    </div>

    <div style={{ textAlign: "center", marginTop: 8 }}>
      <div style={{ fontSize: 10, color: c.textDim }}>Mida v1.0.0 · © 2025 Mida DZ</div>
    </div>
  </div>
);

// ── CHOIX TYPE DE COMPTE ──────────────────────────────────────────────────

const TypeScreen = ({ onNavigate }) => (
  <div style={{ padding: "20px 20px", minHeight: 560, display: "flex", flexDirection: "column" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <span onClick={() => onNavigate("choix")} style={{ fontSize: 20, color: c.textMuted, cursor: "pointer" }}>←</span>
    </div>
    <div style={{ flex: 1 }}>
      <Logo size="sm" />
      <div style={{ fontSize: 18, fontWeight: 900, color: c.text, textAlign: "center", marginBottom: 6 }}>Quel type de compte ?</div>
      <div style={{ fontSize: 12, color: c.textMuted, textAlign: "center", marginBottom: 28 }}>Choisis ton profil pour personnaliser ton expérience</div>

      <div onClick={() => onNavigate("register1")} style={{
        background: c.card, borderRadius: 16, padding: "18px", border: `2px solid ${c.accent}`,
        cursor: "pointer", marginBottom: 12
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🍽️</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: c.text, marginBottom: 4 }}>Client</div>
        <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.6 }}>Découvre et réserve les meilleurs restaurants d'Alger. Cumule des points à chaque visite.</div>
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["Réservation", "Avis vérifiés", "Promos", "Points fidélité"].map((t, i) => (
            <div key={i} style={{ background: c.accentSoft, borderRadius: 20, padding: "3px 8px", fontSize: 10, color: c.accent }}>{t}</div>
          ))}
        </div>
      </div>

      <div onClick={() => onNavigate("register_resto")} style={{
        background: c.card, borderRadius: 16, padding: "18px", border: `1px solid ${c.cardBorder}`,
        cursor: "pointer", marginBottom: 12
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🏪</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: c.text, marginBottom: 4 }}>Restaurateur</div>
        <div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.6 }}>Gère tes réservations, réponds aux avis et analyse ta fréquentation depuis un seul endroit.</div>
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["Dashboard", "Plan de salle", "Stats", "Anti no-show"].map((t, i) => (
            <div key={i} style={{ background: "#2a2520", borderRadius: 20, padding: "3px 8px", fontSize: 10, color: c.textMuted }}>{t}</div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ── INSCRIPTION RESTAURATEUR ──────────────────────────────────────────────

const RegisterRestoScreen = ({ onNavigate }) => (
  <div style={{ padding: "20px 20px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span onClick={() => onNavigate("type")} style={{ fontSize: 20, color: c.textMuted, cursor: "pointer" }}>←</span>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>Espace Restaurateur</div>
        <div style={{ fontSize: 11, color: c.textMuted }}>Rejoins +347 établissements sur Mida</div>
      </div>
    </div>

    <div style={{ background: c.accentSoft, borderRadius: 12, padding: "10px 12px", border: `1px solid ${c.accent}30`, marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: c.accent, fontWeight: 700 }}>🎁 Offre de lancement</div>
      <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3 }}>3 mois gratuits · Sans engagement · Activation en 24h</div>
    </div>

    <Input label="Nom du restaurant" value="Le Tantra" placeholder="Nom de votre établissement" icon="🏪" />
    <Input label="Adresse complète" value="12 Rue Hassiba, Hydra" placeholder="Adresse complète" icon="📍" />
    <Input label="Numéro de téléphone" value="+213 21 54 32 10" placeholder="+213 XX XX XX XX" icon="📞" />
    <Input label="Email professionnel" value="" placeholder="contact@votre-resto.dz" icon="✉️" />

    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 5, fontWeight: 600 }}>Type d'établissement</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {["Restaurant", "Café", "Fast-food", "Pizzeria", "Brasserie", "Gastronomique"].map((t, i) => (
          <div key={i} style={{
            padding: "5px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer",
            background: i === 0 ? c.accentSoft : c.card,
            color: i === 0 ? c.accent : c.textMuted,
            border: `1px solid ${i === 0 ? c.accent + "50" : c.cardBorder}`,
            fontWeight: i === 0 ? 700 : 400
          }}>{t}</div>
        ))}
      </div>
    </div>

    <div style={{ background: c.card, borderRadius: 12, padding: "10px 12px", border: `1px solid ${c.cardBorder}`, marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6 }}>
        📋 Notre équipe vérifiera votre établissement sous <span style={{ color: c.accent, fontWeight: 700 }}>24h ouvrées</span> avant activation.
      </div>
    </div>

    <Btn onClick={() => onNavigate("success")}>Envoyer ma demande →</Btn>
  </div>
);

// ── MAIN ──────────────────────────────────────────────────────────────────

const screenGroups = [
  {
    title: "🚀 Onboarding",
    screens: ["onboarding1", "onboarding2", "onboarding3", "choix"],
  },
  {
    title: "🔐 Connexion",
    screens: ["login", "login_error", "forgot", "reset"],
  },
  {
    title: "📝 Inscription Client",
    screens: ["register1", "register2", "register3", "verify"],
  },
  {
    title: "🏪 Espace Pro",
    screens: ["type", "register_resto"],
  },
  {
    title: "✅ Post-Auth",
    screens: ["success", "logout"],
  },
];

export default function MidaAuthWireframes() {
  const [activeScreen, setActiveScreen] = useState("onboarding1");

  const renderScreen = (screen) => {
    const props = { onNavigate: setActiveScreen };
    switch (screen) {
      case "onboarding1": return <OnboardingScreen idx={0} {...props} />;
      case "onboarding2": return <OnboardingScreen idx={1} {...props} />;
      case "onboarding3": return <OnboardingScreen idx={2} {...props} />;
      case "choix": return <ChoixScreen {...props} />;
      case "login": return <LoginScreen {...props} hasError={false} />;
      case "login_error": return <LoginScreen {...props} hasError={true} />;
      case "register1": return <Register1Screen {...props} />;
      case "register2": return <Register2Screen {...props} />;
      case "register3": return <Register3Screen {...props} />;
      case "verify": return <VerifyScreen {...props} />;
      case "forgot": return <ForgotScreen {...props} />;
      case "reset": return <ResetScreen {...props} />;
      case "success": return <SuccessScreen {...props} />;
      case "logout": return <LogoutScreen {...props} />;
      case "type": return <TypeScreen {...props} />;
      case "register_resto": return <RegisterRestoScreen {...props} />;
      default: return <div style={{ padding: 20, color: c.text }}>{screen}</div>;
    }
  };

  return (
    <div style={{ background: "#080706", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", color: c.text }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: c.accent, letterSpacing: -1, fontFamily: "Georgia, serif" }}>mida</div>
          <div style={{ fontSize: 13, color: c.textMuted, letterSpacing: 2, textTransform: "uppercase" }}>Auth · Wireframes v1.0</div>
          <div style={{ fontSize: 11, color: c.textDim, marginTop: 4 }}>Flux d'accès complet · Cliquez pour naviguer</div>
        </div>

        {/* Navigation par groupe */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
          {screenGroups.map(group => (
            <div key={group.title} style={{
              background: c.card, borderRadius: 14, padding: "10px 12px",
              border: `1px solid ${c.cardBorder}`
            }}>
              <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 7, fontWeight: 600 }}>{group.title}</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {group.screens.map(s => (
                  <div key={s} onClick={() => setActiveScreen(s)} style={{
                    padding: "4px 9px", borderRadius: 8, fontSize: 10, cursor: "pointer",
                    background: activeScreen === s ? c.accent : "#2a2520",
                    color: activeScreen === s ? "#000" : c.textMuted,
                    fontWeight: activeScreen === s ? 700 : 400,
                    border: `1px solid ${activeScreen === s ? "transparent" : c.cardBorder}`
                  }}>{screenLabels[s]}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Téléphone */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Phone label={screenLabels[activeScreen]}>
            {renderScreen(activeScreen)}
          </Phone>
        </div>

        {/* Flux utilisateur */}
        <div style={{ marginTop: 28, maxWidth: 700, margin: "28px auto 0" }}>
          <div style={{ background: c.card, borderRadius: 16, padding: "16px 20px", border: `1px solid ${c.cardBorder}`, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 12 }}>🗺️ Flux utilisateur complet</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: c.accent, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Nouveau client</div>
                {[
                  "Onboarding 1→2→3",
                  "Choix type de compte",
                  "Inscription étape 1 (identité)",
                  "Inscription étape 2 (email/mdp)",
                  "Inscription étape 3 (préférences)",
                  "Vérification SMS",
                  "Connexion réussie + 100 pts",
                ].map((s, i) => (
                  <div key={i} style={{ fontSize: 11, color: c.textMuted, marginBottom: 5, paddingLeft: 4, borderLeft: `2px solid ${c.accentSoft}` }}>
                    {i + 1}. {s}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, color: c.blue, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Utilisateur existant</div>
                {[
                  "Choix de connexion",
                  "Login (email + mdp) ou Google/Apple",
                  "Erreur → message clair",
                  "Mot de passe oublié → email",
                  "Lien de réinitialisation",
                  "Nouveau mot de passe",
                  "Déconnexion depuis le profil",
                ].map((s, i) => (
                  <div key={i} style={{ fontSize: 11, color: c.textMuted, marginBottom: 5, paddingLeft: 4, borderLeft: `2px solid ${c.blueSoft}` }}>
                    {i + 1}. {s}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: c.card, borderRadius: 16, padding: "16px 20px", border: `1px solid ${c.cardBorder}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>📋 Écrans couverts ({Object.keys(screenLabels).length})</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              {Object.entries(screenLabels).map(([, label], i) => (
                <div key={i} style={{ fontSize: 11, color: c.textMuted }}>✅ {label}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
