// Node 25 expone un `localStorage` globale incompleto (`getItem` non è una
// funzione) senza un `--localstorage-file` valido. Alcune dipendenze fanno
// feature-detection con `typeof localStorage !== "undefined"` e poi crashano
// in SSR. Qui lo sostituiamo con una Web Storage in-memory funzionante.
export async function register() {
  const broken =
    typeof globalThis.localStorage === "undefined" ||
    typeof globalThis.localStorage.getItem !== "function";

  if (!broken) return;

  const store = new Map<string, string>();
  const polyfill: Storage = {
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => void store.set(String(key), String(value)),
    removeItem: (key) => void store.delete(String(key)),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };

  Object.defineProperty(globalThis, "localStorage", {
    value: polyfill,
    configurable: true,
    writable: true,
  });
}
