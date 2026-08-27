export const PLAYER_HOME_ASSET_SLOTS = [
  "brand_logo",
  "hero_banner",
  "quick_result",
  "quick_dream",
  "quick_unit",
  "quick_profile",
  "notice_icon",
] as const;

export type PlayerHomeAssetSlot = (typeof PLAYER_HOME_ASSET_SLOTS)[number];

export const PLAYER_HOME_ASSET_LABELS: Record<PlayerHomeAssetSlot, string> = {
  brand_logo: "Player logo",
  hero_banner: "Main banner",
  quick_result: "Result shortcut icon",
  quick_dream: "Dream shortcut icon",
  quick_unit: "Unit shortcut icon",
  quick_profile: "Profile shortcut icon",
  notice_icon: "Notice icon",
};
