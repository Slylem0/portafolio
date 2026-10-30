/** Page sections in nav order; "home" is the hero, every other one is an episode. */
export const SECTIONS = ["home", "about", "skills", "sessions", "log"] as const;

/** Number of episodes (all sections after the hero). */
export const EPISODE_COUNT = SECTIONS.length - 1;
