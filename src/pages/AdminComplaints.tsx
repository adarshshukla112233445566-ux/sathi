import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/services/supabase";
import { Card, Badge, LoadingState, EmptyState, Select } from "@/components/ui";
import {
  categoryLabel,
  statusColor,
  priorityColor,
  formatDateShort,
  CATEGORIES,
  STATUSES,
} from "@/utils/constants";
import type { Complaint, Department } from "@/types";

const PAGE_SIZE = 10;

export default function AdminComplaints() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [sortPriority, setSortPriority] = useState(true);
  const [page, setPage] = useState(0);

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return data as Department[];
    },
  });

  const { data, isLoading } = useQuery<Complaint[]>({
    queryKey: ["admin-complaints", search, statusFilter, categoryFilter, deptFilter, sortPriority],
    queryFn: async () => {
      let q = supabase
        .from("complaints")
        .select("*, department:departments(*)")
        .order(sortPriority ? "priority_score" : "created_at", { ascending: sortPriority ? false : false });
      if (statusFilter) q = q.eq("status", statusFilter);
      if (categoryFilter) q = q.eq("category", categoryFilter);
      if (deptFilter) q = q.eq("department_id", deptFilter);
      if (search) q = q.or(`title.ilike.%${search}%,tracking_id.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Complaint[];
    },
    refetchInterval: 30000,
  });

  const filtered = data || [];
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Complaint Management</h1>
        <p className="text-sm text-gray-500 mt-1">Search, filter and manage all city complaints</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or tracking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </Select>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-auto">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
        <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-auto">
          <option value="">All Departments</option>
          {departments?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <button
          onClick={() => setSortPriority(!sortPriority)}
          className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${
            sortPriority ? "bg-brand-50 border-brand-200 text-brand-700" : "bg-white border-gray-200 text-navy-700"
          }`}
        >
          {sortPriority ? "Priority Sort" : "Newest First"}
        </button>
      </div>

      {isLoading ? (
        <LoadingState message="Loading complaints..." />
      ) : pageData.length === 0 ? (
        <Card className="p-6">
          <EmptyState icon={<Search className="w-12 h-12" />} title="No complaints found" message="Try adjusting your filters or search." />
        </Card>
      ) : (
        <>
          {/* Table */}
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-medium">Tracking ID</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Location</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium hidden lg:table-cell">Department</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Created</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageData.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.tracking_id}</td>
                      <td className="px-4 py-3 text-navy-700">{categoryLabel(c.category)}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-[150px] truncate">{c.address || "N/A"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-lg font-bold ${priorityColor(c.priority_score)}`}>{c.priority_score}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{c.department?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge className={statusColor(c.status)}>{c.status.replace("_", " ")}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{formatDateShort(c.created_at)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/complaints/${c.id}`} className="text-brand-600 font-medium hover:underline text-xs">
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-600">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
