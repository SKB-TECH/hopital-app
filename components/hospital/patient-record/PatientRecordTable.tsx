"use client";

import { formatPatientValue } from "./helpers";

export function PatientRecordTable({ title, rows, billing, locale = "fr" }: { title: string; rows: any[]; billing?: boolean; locale?: string }) {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row)).filter((key) => !["organizationId", "deletedAt"].includes(key)))).slice(0, 7);

  return (
    <div>
      <h2 className="mb-5 text-2xl font-black text-slate-950">{title}</h2>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="border-b border-slate-200 px-4 py-3 text-left text-xs font-black uppercase text-slate-500">
                    {column}
                  </th>
                ))}
                {billing && <th className="border-b border-slate-200 px-4 py-3 text-right text-xs font-black uppercase text-slate-500">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  {columns.map((column) => (
                    <td key={column} className="max-w-xs truncate px-4 py-3 text-sm font-semibold text-slate-700">
                      {formatPatientValue(row[column])}
                    </td>
                  ))}
                  {billing && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => window.open(`/api/proxy/api/v1/billing/invoices/${row.id}/pdf`, "_blank")} className="border border-slate-300 px-3 py-2 text-xs font-black">
                        PDF
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="border border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">{locale === "en" ? "No data." : "Aucune donnée."}</p>
      )}
    </div>
  );
}
