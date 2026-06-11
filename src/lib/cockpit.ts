/**
 * Cockpit — registro dei servizi/infrastruttura usati da Fabrizio.
 * Modulo PURO, server-safe: solo dati + tipi, nessun segreto qui dentro.
 * I token delle API live stanno nelle env var (lette solo lato server).
 */

export type ServiceId =
  | "vercel"
  | "github"
  | "cloudflare"
  | "neon"
  | "supabase"
  | "gitlab";

export interface ServiceLink {
  /** Etichetta breve mostrata sulla card (es. "KONTRO"). */
  label: string;
  /** Deep-link diretto al progetto/pannello. */
  href: string;
}

export interface Service {
  id: ServiceId;
  name: string;
  /** Colore d'accento del brand del servizio. */
  color: string;
  /** Pannello principale del servizio. */
  dashboard: string;
  /** Una riga di contesto. */
  blurb: string;
  /** Deep-link rapidi ai progetti che contano. */
  links: ServiceLink[];
  /** true se esiste un widget di stato LIVE per questo servizio. */
  live?: boolean;
}

/**
 * Ordine = importanza nel lavoro quotidiano. I primi due hanno widget live.
 */
export const SERVICES: Service[] = [
  {
    id: "vercel",
    name: "Vercel",
    color: "#ffffff",
    dashboard: "https://vercel.com/dashboard",
    blurb: "Deploy di tutti i progetti web.",
    live: true,
    links: [
      { label: "Tutti i progetti", href: "https://vercel.com/dashboard" },
      { label: "Deploy recenti", href: "https://vercel.com/dashboard/deployments" },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    color: "#e2e8f0",
    dashboard: "https://github.com",
    blurb: "Repo, PR e Actions.",
    live: true,
    links: [
      { label: "FaberAi (org)", href: "https://github.com/orgs/FaberAi/repositories" },
      { label: "Le mie PR", href: "https://github.com/pulls" },
    ],
  },
  {
    id: "supabase",
    name: "Supabase",
    color: "#3ecf8e",
    dashboard: "https://supabase.com/dashboard/projects",
    blurb: "Database e auth dei progetti.",
    links: [
      { label: "KONTRO", href: "https://supabase.com/dashboard/project/imghqxftitokjkajtjjc" },
      { label: "Social Hub / Faber Adv", href: "https://supabase.com/dashboard/project/regdnixcqpghncjbeejf" },
      { label: "Cantina Love Me", href: "https://supabase.com/dashboard/project/eqkvagnfmsxvbwlvhvbk" },
      { label: "Tutti i progetti", href: "https://supabase.com/dashboard/projects" },
    ],
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    color: "#f6821f",
    dashboard: "https://dash.cloudflare.com",
    blurb: "DNS, Tunnel e Access del cockpit.",
    links: [
      { label: "Dashboard", href: "https://dash.cloudflare.com" },
      { label: "Zero Trust (Access)", href: "https://one.dash.cloudflare.com" },
    ],
  },
  {
    id: "neon",
    name: "Neon",
    color: "#00e599",
    dashboard: "https://console.neon.tech",
    blurb: "Postgres serverless.",
    links: [{ label: "Console", href: "https://console.neon.tech" }],
  },
  {
    id: "gitlab",
    name: "GitLab",
    color: "#fc6d26",
    dashboard: "https://gitlab.com/FaberAi",
    blurb: "Repo alternativi (palestra).",
    links: [{ label: "FaberAi", href: "https://gitlab.com/FaberAi" }],
  },
];

/** URL del Box (terminale web). Configurabile via env, default sul sottodominio. */
export const BOX_URL = process.env.BOX_URL || "https://box.sagripanti.uk";
