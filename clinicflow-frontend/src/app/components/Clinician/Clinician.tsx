import { JSX } from "react/jsx-runtime";
import { CentralDashboard } from "../CentralDashboard";
import { Tabs } from "../Tabs";
export function Clinician(): JSX.Element {
  const tabList = [
    Tabs.Dashboard,
    Tabs.Patients,
    Tabs.Appointments,
    Tabs.Encounters,
    Tabs.Prescription,
    Tabs.Pharmacy,
    Tabs.Lab,
  ];

  return <CentralDashboard tabList={tabList} />;
}