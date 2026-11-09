import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  Filter, 
  Eye, 
  Calendar, 
  Building2, 
  User, 
  Car, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { VisitorRecord, VisitorCategory } from '../types/visitor';
import VisitorStatusBadge from './VisitorStatusBadge';
import { format } from 'date-fns';

interface VisitorHistoryTableProps {
  visitors: VisitorRecord[];
  onViewDetails: (visitor: VisitorRecord) => void;
  title?: string;
  allowExport?: boolean;
}

export default function VisitorHistoryTable({
  visitors,
  onViewDetails,
  title = 'Visitor Entry & Activity History',
  allowExport = true
}: VisitorHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [flatFilter, setFlatFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Extract unique flats for dropdown filter
  const uniqueFlats = useMemo(() => {
    const set = new Set<string>();
    visitors.forEach(v => {
      if (v.flat_number) set.add(v.flat_number);
    });
    return Array.from(set).sort();
  }, [visitors]);

  // Filtering
  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      // Search
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || (
        v.visitor_name.toLowerCase().includes(q) ||
        v.visitor_mobile.includes(q) ||
        (v.flat_number && v.flat_number.toLowerCase().includes(q)) ||
        (v.resident_name && v.resident_name.toLowerCase().includes(q)) ||
        (v.vehicle_number && v.vehicle_number.toLowerCase().includes(q)) ||
        v.purpose.toLowerCase().includes(q) ||
        String(v.visitor_id).includes(q)
      );

      // Status
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter.toLowerCase();

      // Category
      const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter.toLowerCase();

      // Flat
      const matchesFlat = flatFilter === 'all' || v.flat_number === flatFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesFlat;
    });
  }, [visitors, searchTerm, statusFilter, categoryFilter, flatFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage) || 1;
  const paginatedVisitors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVisitors.slice(start, start + itemsPerPage);
  }, [filteredVisitors, currentPage]);

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr), 'dd MMM, hh:mm a');
    } catch {
      return dateStr;
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Visitor ID',
      'Visitor Name',
      'Mobile',
      'Category',
      'Flat',
      'Tower',
      'Resident Host',
      'Purpose',
      'Vehicle Number',
      'Gate',
      'Guard Name',
      'Status',
      'Request Time',
      'Check-In Time',
      'Check-Out Time'
    ];

    const rows = filteredVisitors.map(v => [
      `#${v.visitor_id}`,
      `"${v.visitor_name.replace(/"/g, '""')}"`,
      v.visitor_mobile || '',
      v.category,
      v.flat_number || '',
      v.tower || '',
      `"${(v.resident_name || '').replace(/"/g, '""')}"`,
      `"${v.purpose.replace(/"/g, '""')}"`,
      v.vehicle_number || '',
      v.gate_name || 'Main Gate',
      `"${(v.security_user_name || '').replace(/"/g, '""')}"`,
      v.status.toUpperCase(),
      v.created_at ? format(new Date(v.created_at), 'yyyy-MM-dd HH:mm') : '',
      v.entry_time ? format(new Date(v.entry_time), 'yyyy-MM-dd HH:mm') : '',
      v.exit_time ? format(new Date(v.exit_time), 'yyyy-MM-dd HH:mm') : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `towertech_visitor_report_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6 font-sans">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-400 font-medium">
            Showing {filteredVisitors.length} of {visitors.length} total database records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search visitor, flat, phone..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 placeholder:text-slate-400 bg-slate-50/50 outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          {/* Export Button */}
          {allowExport && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6339CA] border border-purple-200 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Download CSV Spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 outline-none uppercase text-[11px]"
        >
          <option value="all">Status: All</option>
          <option value="pending">Status: Pending</option>
          <option value="approved">Status: Approved</option>
          <option value="inside">Status: Inside</option>
          <option value="exited">Status: Exited</option>
          <option value="rejected">Status: Rejected</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 outline-none uppercase text-[11px]"
        >
          <option value="all">Category: All</option>
          <option value="guest">Guest</option>
          <option value="delivery">Delivery</option>
          <option value="cab">Cab</option>
          <option value="maintenance">Maintenance</option>
          <option value="vendor">Vendor</option>
          <option value="domestic_help">Domestic Help</option>
          <option value="other">Other</option>
        </select>

        {/* Flat Filter */}
        {uniqueFlats.length > 0 && (
          <select
            value={flatFilter}
            onChange={(e) => {
              setFlatFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 outline-none text-[11px]"
          >
            <option value="all">Flat: All</option>
            {uniqueFlats.map((flat, idx) => (
              <option key={`flat-${flat}-${idx}`} value={flat}>Flat {flat}</option>
            ))}
          </select>
        )}

        {(statusFilter !== 'all' || categoryFilter !== 'all' || flatFilter !== 'all' || searchTerm) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setCategoryFilter('all');
              setFlatFilter('all');
              setSearchTerm('');
              setCurrentPage(1);
            }}
            className="text-[11px] font-black text-purple-700 hover:underline px-2 py-1 cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-wider">
              <th className="py-3 px-4">Visitor ID</th>
              <th className="py-3 px-4">Visitor Details</th>
              <th className="py-3 px-4">Destination Flat</th>
              <th className="py-3 px-4">Purpose & Category</th>
              <th className="py-3 px-4">Gate & Guard</th>
              <th className="py-3 px-4">Entry / Exit</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedVisitors.map((v, index) => (
              <tr key={v.id ? `${v.id}-${index}` : `visitor-${index}`} className="hover:bg-purple-50/30 transition-colors group">
                <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                  #{v.visitor_id}
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    {v.profile_photo ? (
                      <img
                        src={v.profile_photo}
                        alt={v.visitor_name}
                        className="w-8 h-8 rounded-lg object-cover border border-purple-200 shadow-2xs shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#6339CA] flex items-center justify-center font-black text-xs shrink-0 border border-purple-100">
                        {v.visitor_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-black text-slate-900 group-hover:text-[#6339CA] transition-colors leading-tight">
                        {v.visitor_name}
                      </p>
                      <p className="text-[11px] font-mono font-bold text-slate-400 mt-0.5">
                        {v.visitor_mobile || 'No Mobile'}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <span className="font-mono font-black text-purple-900 block">
                    Flat {v.flat_number} (T-{v.tower})
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate max-w-[130px]">
                    {v.resident_name || 'Resident'}
                  </span>
                </td>

                <td className="py-3.5 px-4">
                  <span className="font-bold text-slate-800 block truncate max-w-[140px]" title={v.purpose}>
                    {v.purpose}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 inline-block mt-0.5">
                    {v.category.replace('_', ' ')}
                  </span>
                </td>

                <td className="py-3.5 px-4">
                  <p className="font-bold text-slate-800">{v.gate_name || 'Main Gate'}</p>
                  <p className="text-[10px] text-slate-400">{v.security_user_name || 'Amit Jadhav'}</p>
                </td>

                <td className="py-3.5 px-4 text-[11px] space-y-0.5">
                  <p className="text-slate-700 font-mono">
                    <span className="text-slate-400">In:</span> {formatDateTime(v.entry_time)}
                  </p>
                  {v.exit_time && (
                    <p className="text-slate-500 font-mono">
                      <span className="text-slate-400">Out:</span> {formatDateTime(v.exit_time)}
                    </p>
                  )}
                </td>

                <td className="py-3.5 px-4">
                  <VisitorStatusBadge status={v.status} size="sm" />
                </td>

                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => onViewDetails(v)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#6339CA] hover:bg-purple-50 border border-slate-200 transition-colors cursor-pointer"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {paginatedVisitors.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold">No visitor records found matching criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-slate-400 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
