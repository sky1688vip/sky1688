import { describe, expect, it } from "vitest";
import { agentDashboardNavigationItems, getAgentDashboardNavigationItem } from "./agentDashboardNavigation";

describe("agentDashboardNavigation", () => {
  it("contains every visible reference-inspired Agent management section", () => {
    expect(agentDashboardNavigationItems.map(item => item.id)).toEqual([
      "dashboard", "financialReport", "betList", "playerList", "createPlayer", "cashInOut", "autoDepositList", "createDeposit", "autoWithdrawList", "createWithdraw", "cashBonus", "userBankInfo", "contactInfo", "bankInfo",
    ]);
  });

  it("keeps only existing Player-account operations active", () => {
    expect(agentDashboardNavigationItems.filter(item => item.active).map(item => item.id)).toEqual(["dashboard", "playerList", "createPlayer"]);
    expect(getAgentDashboardNavigationItem("createWithdraw")).toMatchObject({ label: "Create Withdraw", active: false });
  });
});
