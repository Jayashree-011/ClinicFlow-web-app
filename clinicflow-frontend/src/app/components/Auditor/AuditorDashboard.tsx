import { JSX } from "react/jsx-runtime";
import { CentralDashboard } from "../CentralDashboard";
import { Tabs } from "../Tabs";

export function AuditorDashboard(): JSX.Element {
  const tabList = [
    Tabs.Dashboard,
    Tabs.Billing,
    Tabs.Records,
  ];

  return <CentralDashboard tabList={tabList} />;
}
