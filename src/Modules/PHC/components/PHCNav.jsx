import React from "react";
import { Paper, Text, Tabs, ScrollArea } from "@mantine/core";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  House,
  CalendarBlank,
  ClipboardText,
  Stethoscope,
  Package,
  Ambulance,
  ArrowsClockwise,
  FileText,
  CurrencyDollar,
  Megaphone,
  Users,
  UserCircle,
  ClockCounterClockwise,
  ChartBar,
  CheckCircle,
  Eye,
  FirstAid,
} from "@phosphor-icons/react";

// ── Patient / Student / Professor links ────────────────────────────────────────
const patientLinks = [
  { label: "Overview",            path: "/phc",                         icon: House },
  { label: "Appointments",        path: "/phc/appointments",            icon: CalendarBlank },
  { label: "Visit History",       path: "/phc/prescriptions",           icon: ClipboardText },
  { label: "Reimbursement",       path: "/phc/reimbursement",           role: "professor", icon: CurrencyDollar },
  { label: "View Claims Progress",path: "/phc/reimbursement/claims",    role: "professor", icon: Eye },
];

// ── PHC Staff (Compounder) links ───────────────────────────────────────────────
const staffLinks = [
  { label: "Staff Dashboard",  path: "/phc/staff/dashboard",           role: "phc_staff", icon: House },
  { label: "Patients",         path: "/phc/staff/patients",            role: "phc_staff", icon: Users },
  { label: "Appointments",     path: "/phc/staff/appointments",        role: "phc_staff", icon: CalendarBlank },
  { label: "Doctors",          path: "/phc/staff/doctors",             role: "phc_staff", icon: Stethoscope },
  { label: "Inventory",        path: "/phc/staff/inventory",           role: "phc_staff", icon: Package },
  { label: "Ambulance",        path: "/phc/staff/ambulance",           role: "phc_staff", icon: Ambulance },
  { label: "Requisitions",     path: "/phc/staff/requisitions",        role: "phc_staff", icon: ArrowsClockwise },
  { label: "Reports",          path: "/phc/staff/reports",             role: "phc_staff", icon: ChartBar },
  { label: "Reimbursement",    path: "/phc/staff/reimbursement",       role: "phc_staff", icon: CurrencyDollar },
  { label: "Announcements",    path: "/phc/staff/announcements",       role: "phc_staff", icon: Megaphone },
];

// ── Auditor links ──────────────────────────────────────────────────────────────
const auditLinks = [
  { label: "Reimbursement",  path: "/phc/staff/reimbursement",       role: "auditor", icon: CurrencyDollar },
  { label: "Action History", path: "/phc/auditor/action-history",    role: "auditor", icon: ClockCounterClockwise },
];

function PHCNav({ overviewUnreadCount = 0 }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const phcRole    = useSelector((state) => state.user.phcRole);
  const selectedRole = useSelector((state) => state.user.role);

  // Determine which links to show based on role
  const normalizedRole    = String(selectedRole  || "").toLowerCase();
  const normalizedPhcRole = String(phcRole       || "").toLowerCase();
  const isProfessorView   = normalizedRole === "professor";
  const isAuditorView     = /(auditor|audit|accounts)/.test(normalizedRole) || normalizedPhcRole === "accounts";
  const isPHCStaff        = normalizedPhcRole === "phc_staff" && !isProfessorView && !isAuditorView;
  const effectiveRole     = isProfessorView ? "professor" : (isAuditorView ? "auditor" : phcRole);

  const links = isPHCStaff ? staffLinks : (isAuditorView ? auditLinks : patientLinks);
  const visibleLinks = links.filter((item) => !item.role || item.role === effectiveRole);

  // Determine active tab by current pathname
  // Use the longest-matching path to handle nested routes
  const activeTab = visibleLinks.reduce((best, item) => {
    if (location.pathname.startsWith(item.path)) {
      if (!best || item.path.length > best.length) return item.path;
    }
    return best;
  }, null) || (visibleLinks[0]?.path ?? "");

  return (
    <Paper
      radius="md"
      withBorder
      mb="md"
      style={{ overflow: "hidden" }}
    >
      {/* Header row */}
      <div
        style={{
          padding: "10px 16px 0 16px",
          borderBottom: "1px solid var(--mantine-color-gray-2)",
        }}
      >
        <Text fw={700} size="sm" c="dimmed" mb={6} tt="uppercase" style={{ letterSpacing: "0.05em" }}>
          Primary Health Center
        </Text>

        <ScrollArea type="hover" offsetScrollbars scrollbarSize={4}>
          <Tabs
            value={activeTab}
            onChange={(val) => val && navigate(val)}
            variant="outline"
            style={{ minWidth: "max-content" }}
          >
            <Tabs.List style={{ flexWrap: "nowrap", border: "none", gap: 2 }}>
              {visibleLinks.map((item) => {
                const Icon = item.icon ?? FirstAid;
                const isOverview = !isPHCStaff && item.path === "/phc";
                const label =
                  isOverview && overviewUnreadCount > 0
                    ? `${item.label} (${overviewUnreadCount > 99 ? "99+" : overviewUnreadCount})`
                    : item.label;

                return (
                  <Tabs.Tab
                    key={item.path}
                    value={item.path}
                    leftSection={<Icon size={15} weight="duotone" />}
                    style={{
                      whiteSpace: "nowrap",
                      fontWeight: activeTab === item.path ? 600 : 400,
                      fontSize: "0.82rem",
                    }}
                  >
                    {label}
                  </Tabs.Tab>
                );
              })}
            </Tabs.List>
          </Tabs>
        </ScrollArea>
      </div>
    </Paper>
  );
}

export default PHCNav;
