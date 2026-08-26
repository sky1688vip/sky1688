export const playerInvitationPath = "/player/activate";
export const defaultPublicAppOrigin = "https://sky1688lotto-csfu4zpn.manus.space";

export function getPlayerInvitationUrl(origin: string, token: string) {
  const hostname = new URL(origin).hostname;
  const publicOrigin = hostname === "127.0.0.1" || hostname === "localhost" ? defaultPublicAppOrigin : origin;
  const url = new URL(playerInvitationPath, publicOrigin);
  url.searchParams.set("invite", token);
  return url.toString();
}
