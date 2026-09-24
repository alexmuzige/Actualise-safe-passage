import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ShieldAlert,
  ArrowRight,
  Radio,
  Fingerprint,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { toast } from "sonner";
import { API_BASE_URL } from "../api/config";
import { getApiMessage, readJsonBody } from "../lib/api-response";
import { extractRoleFromAuthResponse, resolvePostLoginTarget } from "../lib/role-routing";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion · HUMASAFE" },
      { name: "description", content: "Accédez à la plateforme HUMASAFE." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Gestion des blocs ouverts en mode Inscription (Accordéon) - Étape 1 ouverte par défaut
  const [activeStep, setActiveStep] = useState<number>(1);

  // États pour lier tous les champs de l'inscription avec les 4 rôles précis
  const [formDataState, setFormDataState] = useState({
    lastName: "",
    surname: "",
    firstName: "",
    phone: "",
    email: "",
    nationality: "",
    gender: "",
    parentCode: "",
    org: "",
    role: "informateur", // Valeur par défaut parmi : admin, analyst, informant, actor
    username: "",
    password: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormDataState((prev) => ({ ...prev, [name]: value }));
  };

  // Validation par blocs
  const isBlock1Complete = Boolean(
    formDataState.lastName.trim() &&
    formDataState.surname.trim() &&
    formDataState.firstName.trim() &&
    formDataState.phone.trim() &&
    formDataState.nationality.trim() &&
    formDataState.gender.trim(),
  );

  const isBlock2Complete = Boolean(
    formDataState.parentCode.trim() && formDataState.org.trim() && formDataState.role.trim(),
  );

  const isBlock3Complete = Boolean(
    formDataState.username.trim() && formDataState.email.trim() && formDataState.password.trim(),
  );

  const isFormComplete = isBlock1Complete && isBlock2Complete && isBlock3Complete;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const endpoint = isLoginMode ? `${API_BASE_URL}/login` : `${API_BASE_URL}/signup`;
    const payload = isLoginMode
      ? { username: formDataState.username, password: formDataState.password }
      : {
          last_name: formDataState.lastName,
          surname: formDataState.surname,
          first_name: formDataState.firstName,
          phone: formDataState.phone,
          email: formDataState.email,
          nationality: formDataState.nationality,
          gender: formDataState.gender,
          parent_code: formDataState.parentCode,
          organization: formDataState.org,
          role: formDataState.role,
          username: formDataState.username,
          password: formDataState.password,
        };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Inclure les cookies pour la session
        body: JSON.stringify(payload),
      });

      const data = await readJsonBody(response);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("E-mail ou mot de passe incorrect.");
        } else if (response.status === 404) {
          throw new Error("Le service d'authentification est introuvable.");
        } else if (response.status >= 500) {
          throw new Error("Le serveur rencontre un problème technique. Réessayez plus tard.");
        } else {
          throw new Error(
            getApiMessage(data) ?? "Impossible d'ouvrir la session. Vérifiez vos informations.",
          );
        }
      }

      toast.success(isLoginMode ? "Session ouverte · Redirection..." : "Compte créé avec succès !");

      // Rôle renvoyé par l'API (`{ role }` ou `{ user: { role } }`), repli sur l'état local
      const userRole = extractRoleFromAuthResponse(data) ?? formDataState.role;
      const target = resolvePostLoginTarget(userRole);

      if (target.kind === "external") {
        // Connexion admin : redirection vers la console d'administration déployée
        window.location.assign(target.url);
      } else {
        // Redirection interne vers l'espace adapté au rôle
        navigate({ to: target.to });
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Erreur de connexion au réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      mode={isLoginMode ? "login" : "signup"}
      setMode={(modeVal) => {
        setIsLoginMode(modeVal);
        setActiveStep(1);
      }}
      onSubmit={onSubmit}
      loading={loading}
      formDataState={formDataState}
      handleChange={handleChange}
      isFormComplete={isFormComplete}
      setFormDataState={setFormDataState}
      activeStep={activeStep}
      setActiveStep={setActiveStep}
      isBlock1Complete={isBlock1Complete}
      isBlock2Complete={isBlock2Complete}
    />
  );
}

export function AuthShell({
  mode,
  setMode,
  onSubmit,
  loading,
  formDataState,
  handleChange,
  setFormDataState,
  activeStep,
  setActiveStep,
  isBlock1Complete,
  isBlock2Complete,
}: {
  mode: "login" | "signup";
  setMode: (val: boolean) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  formDataState: Record<string, string>;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  isFormComplete: boolean;
  setFormDataState: React.Dispatch<React.SetStateAction<any>>;
  activeStep: number;
  setActiveStep: (step: number) => void;
  isBlock1Complete: boolean;
  isBlock2Complete: boolean;
}) {
  const isLogin = mode === "login";

  const toggleStep = (stepNumber: number) => {
    setActiveStep(activeStep === stepNumber ? 0 : stepNumber);
  };

  return (
    <div className="relative flex min-h-screen bg-background text-foreground">
      {/* Panneau gauche — contexte opérationnel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-border bg-sidebar p-10 lg:flex">
        <div
          className="absolute inset-0 bg-cover bg-center z-0 opacity-25"
          style={{ backgroundImage: `url('/volcan.jpg')` }}
        />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(60% 50% at 30% 20%, color-mix(in oklch, var(--primary) 20%, transparent), transparent 70%), radial-gradient(50% 40% at 80% 90%, rgba(239, 68, 68, 0.18), transparent 70%)",
          }}
        />
        <div className="relative z-20">
          <Link to="/" className="inline-flex items-center gap-3">
            {/* Logo image à la place de l'icône */}
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 p-1 shadow-sm overflow-hidden">
              <img src="/logo.png" alt="Logo HUMASAFE" className="h-full w-full object-contain" />
            </div>
            <div className="leading-tight">
              <div className="font-mono text-sm font-semibold tracking-wider">HUMASAFE</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Analyse d'itinéraires
              </div>
            </div>
          </Link>
        </div>

        <div className="relative z-20 max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Nœud sécurisé · Goma
          </div>
          <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight">
            « Un rapport terrain envoyé à temps, c'est un convoi qui rentre. »
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            — Coordination humanitaire, Nord-Kivu
          </p>
        </div>

        <div className="relative z-20 grid grid-cols-3 gap-4 border-t border-border/60 pt-6">
          {[
            { k: "128", l: "Rapports / semaine" },
            { k: "34", l: "Aires de santé" },
            { k: "< 2 min", l: "Décision" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-mono text-xl font-semibold tracking-tight">{s.k}</div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex flex-1 items-center justify-center px-5 py-10 md:px-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Link to="/" className="mb-8 inline-flex items-center gap-3">
              {/* Logo image mobile à la place de l'icône */}
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 p-1 shadow-sm overflow-hidden">
                <img src="/logo.png" alt="Logo HUMASAFE" className="h-full w-full object-contain" />
              </div>
              <div className="leading-tight">
                <div className="font-mono text-sm font-semibold tracking-wider">HUMASAFE</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Analyse d'itinéraires
                </div>
              </div>
            </Link>
          </div>

          <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {isLogin ? "Accès sécurisé" : "Nouvel utilisateur"}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {isLogin ? "Ouvrir une session" : "Rejoindre le réseau"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin
              ? "Identifiez-vous pour accéder au stockage et aux rapports."
              : "Créez votre profil et définissez votre rôle étape par étape."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {isLogin ? (
              <div className="space-y-4 rounded-lg border border-border/60 p-4 bg-card/20">
                <Field
                  label="Identifiant ou e-mail"
                  name="username"
                  type="text"
                  placeholder="a.kavira@ong.org"
                  required
                  value={formDataState.username}
                  onChange={handleChange}
                />
                <Field
                  label="Mot de passe"
                  name="password"
                  type="password"
                  placeholder="••••••••••"
                  required
                  value={formDataState.password}
                  onChange={handleChange}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {/* BLOC 1 : IDENTITÉ */}
                <div className="rounded-lg border border-border/60 bg-card/20 overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => toggleStep(1)}
                    className="flex w-full items-center justify-between p-4 text-left transition hover:bg-accent/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {isBlock1Complete ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary font-mono text-xs font-semibold">
                          1
                        </span>
                      )}
                      <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                        1. Identité
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${activeStep === 1 ? "rotate-180" : ""}`}
                    />
                  </button>

                  {activeStep === 1 && (
                    <div className="p-4 pt-0 grid grid-cols-2 gap-3 border-t border-border/40 mt-2">
                      <Field
                        label="Nom"
                        name="lastName"
                        placeholder="Kavira"
                        required
                        value={formDataState.lastName}
                        onChange={handleChange}
                      />
                      <Field
                        label="Post-nom"
                        name="surname"
                        placeholder="Masika"
                        required
                        value={formDataState.surname}
                        onChange={handleChange}
                      />
                      <Field
                        label="Prénom"
                        name="firstName"
                        placeholder="Amina"
                        required
                        value={formDataState.firstName}
                        onChange={handleChange}
                      />
                      <Field
                        label="Téléphone"
                        name="phone"
                        placeholder="0812345678"
                        required
                        value={formDataState.phone}
                        onChange={handleChange}
                      />
                      <Field
                        label="Nationalité"
                        name="nationality"
                        placeholder="Congolaise"
                        required
                        value={formDataState.nationality}
                        onChange={handleChange}
                      />
                      <Field
                        label="Sexe"
                        name="gender"
                        required
                        placeholder="Sélectionner"
                        value={formDataState.gender}
                        onChange={handleChange}
                        options={[
                          { label: "Masculin", value: "Masculin" },
                          { label: "Féminin", value: "Féminin" },
                        ]}
                      />
                      <div className="col-span-2 flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveStep(2)}
                          className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground cursor-pointer"
                        >
                          Suivant <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* BLOC 2 : RATTACHEMENT & RÔLES UTILISATEUR */}
                <div className="rounded-lg border border-border/60 bg-card/20 overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => toggleStep(2)}
                    className="flex w-full items-center justify-between p-4 text-left transition hover:bg-accent/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {isBlock2Complete ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary font-mono text-xs font-semibold">
                          2
                        </span>
                      )}
                      <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                        2. Rattachement & Rôle
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${activeStep === 2 ? "rotate-180" : ""}`}
                    />
                  </button>

                  {activeStep === 2 && (
                    <div className="p-4 pt-0 space-y-3 border-t border-border/40 mt-2">
                      <DynamicParentCodeField
                        value={formDataState.parentCode}
                        onSelect={(selectedItem) => {
                          setFormDataState((prev: any) => ({
                            ...prev,
                            parentCode: selectedItem.value,
                            org: selectedItem.organization,
                            role: selectedItem.role || prev.role,
                          }));
                        }}
                        onChange={handleChange}
                      />

                      <Field
                        label="Organisation"
                        name="org"
                        placeholder="Rempli automatiquement via le code parent"
                        readOnly
                        value={formDataState.org}
                        onChange={handleChange}
                      />

                      {/* Sélecteur explicite pour différencier les 4 rôles demandés */}
                      <Field
                        label="Rôle sur la plateforme"
                        name="role"
                        required
                        value={formDataState.role}
                        onChange={handleChange}
                        options={[
                          {
                            label: "Informateur (Saisie des signalements terrain)",
                            value: "informant",
                          },
                          {
                            label: "Analyste (Traitement et évaluation des risques)",
                            value: "analyst",
                          },
                          { label: "Acteur (Coordination des interventions)", value: "actor" },
                          { label: "Administrateur (Gestion globale du système)", value: "admin" },
                        ]}
                        hint="Détermine vos permissions d'accès au module de stockage."
                      />

                      <div className="flex justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveStep(1)}
                          className="inline-flex items-center gap-1 rounded border border-border px-3 py-1.5 text-xs font-medium text-foreground cursor-pointer"
                        >
                          Retour
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveStep(3)}
                          className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground cursor-pointer"
                        >
                          Suivant <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* BLOC 3 : IDENTIFIANTS */}
                <div className="rounded-lg border border-border/60 bg-card/20 overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => toggleStep(3)}
                    className="flex w-full items-center justify-between p-4 text-left transition hover:bg-accent/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary font-mono text-xs font-semibold">
                        3
                      </span>
                      <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                        3. Identifiants de connexion
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${activeStep === 3 ? "rotate-180" : ""}`}
                    />
                  </button>

                  {activeStep === 3 && (
                    <div className="p-4 pt-0 space-y-3 border-t border-border/40 mt-2">
                      <Field
                        label="Nom d'utilisateur"
                        name="username"
                        placeholder="amina_kavira"
                        required
                        value={formDataState.username}
                        onChange={handleChange}
                      />
                      <Field
                        label="E-mail professionnel"
                        name="email"
                        type="email"
                        placeholder="a.kavira@ong.org"
                        required
                        value={formDataState.email}
                        onChange={handleChange}
                      />
                      <Field
                        label="Mot de passe"
                        name="password"
                        type="password"
                        placeholder="••••••••••"
                        required
                        value={formDataState.password}
                        onChange={handleChange}
                        hint="Min. 8 caractères · lettres, chiffres et symboles."
                      />
                      <div className="flex justify-start pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveStep(2)}
                          className="inline-flex items-center gap-1 rounded border border-border px-3 py-1.5 text-xs font-medium text-foreground cursor-pointer"
                        >
                          Retour
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-border bg-input accent-primary"
                  />
                  Session persistante
                </label>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  Mot de passe oublié ?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-4 cursor-pointer"
            >
              {loading ? "Vérification..." : isLogin ? "Se connecter" : "Créer mon compte"}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            ou
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm transition hover:bg-accent cursor-pointer"
          >
            <Fingerprint className="h-4 w-4 text-primary" />
            {isLogin ? "Connexion par badge terrain" : "S'inscrire avec un badge"}
          </button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {isLogin ? (
              <>
                Pas encore de compte ?{" "}
                <button
                  type="button"
                  onClick={() => setMode(false)}
                  className="text-primary hover:underline bg-transparent border-none cursor-pointer p-0"
                >
                  Demander un accès
                </button>
              </>
            ) : (
              <>
                Déjà membre ?{" "}
                <button
                  type="button"
                  onClick={() => setMode(true)}
                  className="text-primary hover:underline bg-transparent border-none cursor-pointer p-0"
                >
                  Se connecter
                </button>
              </>
            )}
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 border-t border-border/60 pt-4 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Radio className="h-3 w-3 text-emerald-500" />
            Connexion chiffrée · TLS 1.3
          </div>
        </div>
      </div>
    </div>
  );
}

function DynamicParentCodeField({
  value,
  onSelect,
  onChange,
}: {
  value: string;
  onSelect: (item: { value: string; organization: string; role: string }) => void;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  const [searchValue, setSearchValue] = useState(value || "");
  const [results, setResults] = useState<
    { label: string; value: string; organization: string; role: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  useEffect(() => {
    if (!searchValue || searchValue.trim().length === 0) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/actor/type?search=${encodeURIComponent(searchValue)}`,
        );
        if (!response.ok) throw new Error("Erreur de récupération");

        const data = await response.json();
        const formatted = (Array.isArray(data) ? data : []).map((item: any) => ({
          label: item.name || item.label,
          value: item.code || item.id,
          organization: item.organization || item.org || "Organisation non spécifiée",
          role: item.role || item.actorType || "informant",
        }));

        setResults(formatted);
      } catch (error) {
        console.error("Erreur lors de la recherche :", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue]);

  return (
    <div className="relative">
      <Field
        label="Code parent"
        name="parentCode"
        placeholder="Tapez pour rechercher l'organisation..."
        required
        value={searchValue}
        onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
          setSearchValue(e.target.value);
          setShowDropdown(true);
          onChange(e);
        }}
      />

      {loading && (
        <div className="absolute right-3 top-9 text-xs text-muted-foreground animate-pulse pointer-events-none">
          Recherche...
        </div>
      )}

      {showDropdown && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
          {results.map((item) => (
            <li
              key={item.value}
              onClick={() => {
                setSearchValue(item.value);
                setShowDropdown(false);
                onSelect(item);
              }}
              className="cursor-pointer rounded px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <span className="font-medium">{item.label}</span>{" "}
              <span className="text-xs text-muted-foreground">({item.value})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  hint,
  options,
  readOnly,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  options?: { label: string; value: string }[];
  readOnly?: boolean;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </label>

      {options ? (
        <select
          id={name}
          name={name}
          required={required}
          disabled={readOnly}
          value={value || ""}
          onChange={onChange}
          className="w-full rounded-md border border-border bg-input/60 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="" disabled>
            {placeholder || "Sélectionnez..."}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
          value={value || ""}
          onChange={onChange}
          className={`w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none ${
            readOnly
              ? "bg-muted/50 text-muted-foreground cursor-not-allowed border-dashed"
              : "bg-input/60 placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
          }`}
        />
      )}

      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}