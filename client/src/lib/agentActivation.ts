export const agentActivationPath = "/agent/login";
export const defaultPublicAppOrigin = "https://sky1688lotto-csfu4zpn.manus.space";

export function getAgentActivationUrl(origin: string) {
  const hostname = new URL(origin).hostname;
  const publicOrigin = hostname === "127.0.0.1" || hostname === "localhost" ? defaultPublicAppOrigin : origin;
  return new URL(agentActivationPath, publicOrigin).toString();
}
