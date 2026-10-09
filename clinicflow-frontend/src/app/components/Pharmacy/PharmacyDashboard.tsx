import { JSX } from "react/jsx-runtime";
import { CentralDashboard } from "../CentralDashboard";
import { Tabs } from "../Tabs";

export function PharmacyDashboard(): JSX.Element {
  const tabList = [
    Tabs.Dashboard,
    Tabs.Prescription,
    Tabs.Pharmacy,
    Tabs.Lab,
  ];

  return <CentralDashboard tabList={tabList} />;
}
