import { createMemoryRouter } from "react-router";
import { AuthPage } from "./pages/auth-page";
import { DashboardPage } from "./pages/dashboard-page";
import { CreateJobPage } from "./pages/create-job-page";
import { JobsPage } from "./pages/jobs-page";
import { TalentPage } from "./pages/talent-page";
import { WorkRecordsPage } from "./pages/work-records-page";
import { SchedulePage } from "./pages/schedule-page";
import { JobTypesPage } from "./pages/job-types-page";
import { EmployeesPage } from "./pages/employees-page";
import { AttendancePage } from "./pages/attendance-page";
import { EmployeeAttendancePage } from "./pages/employee-attendance-page";
import { FinancePage } from "./pages/finance-page";
import { StoresPage } from "./pages/stores-page";
import { MerchantProfilePage } from "./pages/merchant-profile-page";
import { NotificationsPage } from "./pages/notifications-page";

export const router = createMemoryRouter([
  {
    path: "/",
    Component: AuthPage,
  },
  {
    path: "/auth",
    Component: AuthPage,
  },
  {
    path: "/dashboard",
    Component: DashboardPage,
  },
  {
    path: "/create-job",
    Component: CreateJobPage,
  },
  {
    path: "/jobs",
    Component: JobsPage,
  },
  {
    path: "/talent",
    Component: TalentPage,
  },
  {
    path: "/work-records",
    Component: WorkRecordsPage,
  },
  {
    path: "/job-types",
    Component: JobTypesPage,
  },
  {
    path: "/employees",
    Component: EmployeesPage,
  },
  {
    path: "/schedule",
    Component: SchedulePage,
  },
  {
    path: "/attendance",
    Component: AttendancePage,
  },
  {
    path: "/attendance-employee",
    Component: EmployeeAttendancePage,
  },
  {
    path: "/finance",
    Component: FinancePage,
  },
  {
    path: "/finance-platform",
    Component: FinancePage,
  },
  {
    path: "/stores",
    Component: StoresPage,
  },
  {
    path: "/merchant-profile",
    Component: MerchantProfilePage,
  },
  {
    path: "/notifications",
    Component: NotificationsPage,
  },
]);
