import { JSX } from "react/jsx-runtime";
import { CentralDashboard } from "../CentralDashboard";
import { Tabs } from "../Tabs";

export function ManagerDashboard(): JSX.Element {
  const tabList = [
    Tabs.Dashboard,
    Tabs.Patients,
    Tabs.Appointments,
    Tabs.Doctors,
    Tabs.Staff,
    Tabs.Billing,
    Tabs.Records,
  ];

  return <CentralDashboard tabList={tabList} />;
}
