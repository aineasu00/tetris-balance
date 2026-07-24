// ============================================================
// TETRIS BALANCE — Handicaps façon Mario Kart : objets & événements
// ============================================================

export type ItemType = 'PLUME' | 'ENCLUME' | 'PILIER' | 'DYNAMITE';
export type EventType = 'TREMBLEMENT' | 'PLUIE_FER' | 'BRISE' | 'VENT';

export interface ItemDef {
  type: ItemType;
  name: string;
  icon: string;
  desc: string;
}

export const ITEMS: Record<ItemType, ItemDef> = {
  PLUME:    { type: 'PLUME',    name: 'PLUME',    icon: '🪶', desc: 'Ta prochaine pièce ne pèse rien' },
  ENCLUME:  { type: 'ENCLUME',  name: 'ENCLUME',  icon: '⚓', desc: 'La pièce du joueur suivant est ULTRA LOURDE' },
  PILIER:   { type: 'PILIER',   name: 'PILIER',   icon: '🏛️', desc: 'La balance supporte 2× plus pendant 3 tours' },
  DYNAMITE: { type: 'DYNAMITE', name: 'DYNAMITE', icon: '🧨', desc: 'Détruit la ligne non-vide la plus basse' },
};

export interface EventDef {
  type: EventType;
  name: string;
  icon: string;
  desc: string;
  duration: number; // en tours
}

export const EVENTS: Record<EventType, EventDef> = {
  TREMBLEMENT: { type: 'TREMBLEMENT', name: 'TREMBLEMENT DE TERRE', icon: '🌋', desc: 'La balance tremble et devient imprévisible !', duration: 2 },
  PLUIE_FER:   { type: 'PLUIE_FER',   name: 'PLUIE DE FER',         icon: '☄️', desc: 'Les prochaines pièces sont plus lourdes !', duration: 3 },
  BRISE:       { type: 'BRISE',       name: 'BRISE LÉGÈRE',         icon: '🍃', desc: 'Les prochaines pièces sont allégées !', duration: 3 },
  VENT:        { type: 'VENT',        name: 'VENT LATÉRAL',         icon: '🌀', desc: 'Le vent décale les pièces au verrouillage !', duration: 2 },
};

export function randomItem(rank: number, playerCount: number): ItemType {
  // Le joueur mal classé reçoit de meilleurs objets (rubber-banding)
  const behind = playerCount > 1 ? rank / (playerCount - 1) : 0.5;
  const pool: ItemType[] = ['PLUME', 'DYNAMITE', 'ENCLUME', 'PILIER'];
  if (behind >= 0.99 && Math.random() < 0.45) {
    return Math.random() < 0.5 ? 'ENCLUME' : 'PILIER'; // cadeaux costauds pour le dernier
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function randomEvent(): EventType {
  const pool: EventType[] = ['TREMBLEMENT', 'PLUIE_FER', 'BRISE', 'VENT'];
  return pool[Math.floor(Math.random() * pool.length)];
}
