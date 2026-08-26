export type AgentDashboardSection =
  | "dashboard"
  | "financialReport"
  | "betList"
  | "playerList"
  | "createPlayer"
  | "cashInOut"
  | "autoDepositList"
  | "createDeposit"
  | "autoWithdrawList"
  | "createWithdraw"
  | "cashBonus"
  | "userBankInfo"
  | "contactInfo"
  | "bankInfo";

export type AgentDashboardNavigationItem = {
  id: AgentDashboardSection;
  label: string;
  active: boolean;
};

export type AgentDashboardNavigationGroup = {
  label?: string;
  items: AgentDashboardNavigationItem[];
};

export const agentDashboardNavigationGroups: AgentDashboardNavigationGroup[] = [
  {
    items: [
      { id: "dashboard", label: "Dashboard", active: true },
      { id: "financialReport", label: "Financial Report", active: false },
    ],
  },
  {
    label: "End Users",
    items: [
      { id: "betList", label: "Bet List", active: false },
      { id: "playerList", label: "User List", active: true },
      { id: "createPlayer", label: "Create user", active: true },
    ],
  },
  {
    label: "Cash In / Cash Out",
    items: [
      { id: "cashInOut", label: "Cash In / Cash Out", active: false },
      { id: "autoDepositList", label: "Auto Deposit list", active: false },
      { id: "createDeposit", label: "Create Deposit", active: false },
      { id: "autoWithdrawList", label: "Auto Withdraw list", active: false },
      { id: "createWithdraw", label: "Create Withdraw", active: false },
      { id: "cashBonus", label: "Cash In / Cash Out (Bonus)", active: false },
    ],
  },
  {
    items: [
      { id: "userBankInfo", label: "User Bank Info", active: false },
      { id: "contactInfo", label: "Contact Info", active: false },
      { id: "bankInfo", label: "Bank Info", active: false },
    ],
  },
];

export const agentDashboardNavigationItems = agentDashboardNavigationGroups.flatMap(group => group.items);

export function getAgentDashboardNavigationItem(section: AgentDashboardSection) {
  return agentDashboardNavigationItems.find(item => item.id === section) ?? agentDashboardNavigationItems[0];
}
