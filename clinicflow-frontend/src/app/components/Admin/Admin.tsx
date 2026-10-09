import { JSX } from "react/jsx-runtime";
import { CentralDashboard } from "../CentralDashboard";
import { Tabs } from "../Tabs";
export function Admin(): JSX.Element {
  const tabList = [
    Tabs.Dashboard,
    Tabs.Staff,
    Tabs.Users,
    Tabs.Patients,
    Tabs.Appointments,
    Tabs.Lab,
    Tabs.Pharmacy,
    Tabs.Billing,
    Tabs.Records,
  ];

  return <CentralDashboard tabList={tabList} />;
}