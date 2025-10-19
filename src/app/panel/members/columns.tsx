
'use client'

import { ColumnDef } from "@tanstack/react-table"
import { MemberWithStatus } from "@/app/actions/user"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { formatFullName } from "@/lib/utils"
import { DataTableColumnHeader } from "@/components/panel/DataTableColumnHeader"
import { format } from "date-fns"

export const columns: ColumnDef<MemberWithStatus>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Pilih semua"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Pilih baris"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ row }) => {
        const member = row.original;
        return formatFullName(member.name, member.titlePrefix, member.titlePostfix);
    },
  },
  {
    accessorKey: "phoneNumber",
    header: "No. Telepon",
  },
  {
    accessorKey: "verificationStatus",
    header: "Status",
    cell: ({ row }) => {
        const status = row.original.verificationStatus;
         switch (status) {
            case 'permanent':
                return <Badge variant="default">Permanen</Badge>;
            case 'temporary':
                return <Badge variant="secondary">Menunggu</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Ditolak</Badge>;
            case 'manual':
                return <Badge className="bg-blue-500 text-white">Manual</Badge>;
            case 'unverified':
            default:
                return <Badge variant="outline">Belum Terverifikasi</Badge>;
        }
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "type",
    header: "Jenis",
    cell: ({ row }) => row.original.type || 'N/A',
     filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "position",
    header: "Jabatan",
  },
  {
    accessorKey: "joinDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tanggal Daftar" />
    ),
    cell: ({ row }) => {
      const date = row.original.joinDate ? new Date(row.original.joinDate) : null
      if (!date) return '-'
      return format(date, "dd MMM yyyy")
    },
  },
]
