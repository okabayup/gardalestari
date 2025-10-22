
'use client';

import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/panel/DataTable"
import type { ErrorLog } from "@/lib/definitions"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, ChevronsUpDown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"


const columns: ColumnDef<ErrorLog>[] = [
  {
    accessorKey: "context",
    header: "Konteks",
     cell: ({ row }) => <Badge variant="secondary">{row.original.context}</Badge>
  },
  {
    accessorKey: "message",
    header: "Pesan Error",
     cell: ({ row }) => <p className="max-w-xs truncate">{row.original.message}</p>
  },
  {
    accessorKey: "userId",
    header: "ID Pengguna",
    cell: ({ row }) => <p className="font-mono text-xs">{row.original.userId || 'N/A'}</p>
  },
  {
    accessorKey: "timestamp",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Waktu
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      // The timestamp is now reliably a serialized string from the server action
      const date = new Date(row.original.timestamp);
      return format(date, "dd MMM, HH:mm", { locale: id });
    },
    sortingFn: 'datetime',
  },
  {
      id: "actions",
      cell: ({ row }) => {
        const log = row.original
        const date = new Date(log.timestamp);
        return (
          <Dialog>
            <DialogTrigger asChild>
               <Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4"/> Detail</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detail Error: {log.context}</DialogTitle>
                <DialogDescription>
                  {format(date, "dd MMMM yyyy, HH:mm:ss", { locale: id })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                  <div>
                      <h4 className="font-semibold">Pesan</h4>
                      <p className="text-sm text-destructive">{log.message}</p>
                  </div>
                   <div>
                      <h4 className="font-semibold">Stack Trace</h4>
                      <ScrollArea className="h-64 mt-2 rounded-md border bg-muted p-4">
                          <pre className="text-xs whitespace-pre-wrap">{log.stack || "Stack trace tidak tersedia."}</pre>
                      </ScrollArea>
                  </div>
              </div>
            </DialogContent>
          </Dialog>
        )
      }
  }
];

export default function ErrorLogTable({ data }: { data: ErrorLog[] }) {
    return <DataTable columns={columns} data={data} placeholder="Cari error..." />
}
