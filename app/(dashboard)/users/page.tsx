// app/(dashboard)/users/page.tsx
"use client";

import { useState } from "react";
import { Plus, Eye } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import { DataTable, ColumnDef } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import UserDetail, { User } from "@/components/users/UserDetail";

const statusVariant: Record<string, "green" | "purple" | "yellow" | "red" | "gray"> = {
  Active:    "green",
  "Tier 1":  "purple",
  "Tier 2":  "purple",
  "Tier 3":  "purple",
  Pending:   "yellow",
  Suspended: "red",
};

const mockUsers: User[] = [
  { id: 1,  name: "Adebayo S.", type: "Expert", status: "Tier 2",    joined: "15/03/2026", jobs: 24 },
  { id: 2,  name: "Funke A.",   type: "Client", status: "Active",    joined: "14/03/2026", jobs: 3 },
  { id: 3,  name: "Chidi E.",   type: "TAS",    status: "Tier 3",    joined: "10/03/2026", jobs: "N/A" },
  { id: 4,  name: "Emeka O.",   type: "Expert", status: "Pending",   joined: "09/03/2026", jobs: 0 },
  { id: 5,  name: "Grace A.",   type: "TAS",    status: "Tier 2",    joined: "08/03/2026", jobs: "N/A" },
  { id: 6,  name: "John D.",    type: "Client", status: "Suspended", joined: "05/03/2026", jobs: 1 },
  { id: 7,  name: "James O.",   type: "Client", status: "Active",    joined: "28/02/2026", jobs: 25 },
  { id: 8,  name: "Mayowa S.",  type: "Expert", status: "Tier 1",    joined: "25/02/2026", jobs: 10 },
  { id: 9,  name: "Tolu B.",    type: "Expert", status: "Tier 3",    joined: "20/02/2026", jobs: 38 },
  { id: 10, name: "Amaka N.",   type: "Client", status: "Active",    joined: "18/02/2026", jobs: 7 },
];

const FILTER_OPTIONS = ["All Users", "Client", "Expert", "TAS"] as const;

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  if (selectedUser) {
    return (
      <div className="flex flex-col flex-1">
        <Topbar title="User Management" />
        <UserDetail user={selectedUser} onBack={() => setSelectedUser(null)} />
      </div>
    );
  }

  const columns: ColumnDef<User>[] = [
    {
      key: "name",
      header: "Name",
      render: (u) => <span className="font-semibold text-text-main">{u.name}</span>,
    },
    {
      key: "type",
      header: "Type",
      render: (u) => <span className="text-text-muted">{u.type}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (u) => <StatusBadge label={u.status} variant={statusVariant[u.status] ?? "gray"} />,
    },
    {
      key: "joined",
      header: "Joined",
      render: (u) => <span className="text-text-muted">{u.joined}</span>,
    },
    {
      key: "jobs",
      header: "Jobs",
      render: (u) => <span className="text-text-muted">{u.jobs}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (u) => (
        <button
          onClick={() => setSelectedUser(u)}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors"
          title="View user"
        >
          <Eye size={17} strokeWidth={1.8} />
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="User Management" />

      <div className="flex items-center justify-between px-8 py-5">
        <p className="text-sm text-text-muted">Manage all users</p>
        <button className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold">
          <Plus size={15} />
          Add User
        </button>
      </div>

      <main className="flex-1 px-8 pb-8">
        <DataTable
          data={mockUsers}
          columns={columns}
          filterOptions={FILTER_OPTIONS}
          filterKey="type"
          searchKey="name"
          searchPlaceholder="Search name..."
          pageSize={10}
          onExport={() => console.log("export")}
        />
      </main>
    </div>
  );
}