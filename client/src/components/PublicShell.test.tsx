import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("wouter", () => ({
  Link: ({ children, ...props }: React.PropsWithChildren<{ href: string; className?: string }>) => <a {...props}>{children}</a>,
  useLocation: () => ["/", vi.fn()],
}));

import { PublicShell } from "./PublicShell";

describe("PublicShell player variant", () => {
  it("keeps branding but suppresses public navigation and the Administrator entry", () => {
    const markup = renderToStaticMarkup(<PublicShell variant="player"><div>Player content</div></PublicShell>);

    expect(markup).toContain("Golden Money");
    expect(markup).toContain("Player content");
    expect(markup).not.toContain("စီမံခန့်ခွဲမှု");
    expect(markup).not.toContain("Dream1000");
  });

  it("retains public navigation in the standard site shell", () => {
    const markup = renderToStaticMarkup(<PublicShell><div>Public content</div></PublicShell>);

    expect(markup).toContain("စီမံခန့်ခွဲမှု");
    expect(markup).toContain("Dream1000");
  });
});
