import { JSX } from "react/jsx-runtime";
import { CentralDashboard } from "../CentralDashboard";
import { Tabs } from "../Tabs";
export function Reception(): JSX.Element {
  const tabList = [
    Tabs.Dashboard,
    Tabs.Patients,
    Tabs.Appointments,
    Tabs.Doctors,
    Tabs.Billing,
  ];

  return <CentralDashboard tabList={tabList} />;
}