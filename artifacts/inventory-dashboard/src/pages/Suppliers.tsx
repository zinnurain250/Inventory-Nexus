import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Truck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  getListSuppliersQueryKey,
} from "@workspace/api-client-react";
import type { Supplier, CreateSupplierBody } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/format";

function SupplierForm({ initialData, onSubmit, onCancel, loading }: {
  initialData?: Partial<CreateSupplierBody>;
  onSubmit: (d: CreateSupplierBody) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<CreateSupplierBody>({
    name: initialData?.name ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    address: initialData?.address ?? "",
    city: initialData?.city ?? "",
    country: initialData?.country ?? "",
  });
  const set = (f: keyof CreateSupplierBody, v: string) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <div className="grid grid-cols-2 gap-4 py-2">
      <div className="col-span-2 space-y-1.5">
        <Label>Company Name</Label>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Supplier name" />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@company.com" />
      </div>
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1-555-0000" />
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label>Address</Label>
        <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street address" />
      </div>
      <div className="space-y-1.5">
        <Label>City</Label>
        <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" />
      </div>
      <div className="space-y-1.5">
        <Label>Country</Label>
        <Input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Country" />
      </div>
      <div className="col-span-2 flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button onClick={() => onSubmit(form)} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
      </div>
    </div>
  );
}

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useListSuppliers({ search: search || undefined });
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-1">{suppliers.length} suppliers</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Supplier</Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search suppliers..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Country</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Total Supplied</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                    <Truck className="mx-auto h-10 w-10 opacity-30 mb-3" />
                    <p className="font-medium">No suppliers found</p>
                  </td>
                </tr>
              ) : suppliers.map((s) => (
                <tr key={s.id} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.country}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(s.totalSupplied)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditItem(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
          <SupplierForm onSubmit={(d) => createMutation.mutate({ data: d }, { onSuccess: () => { invalidate(); setShowAdd(false); } })} onCancel={() => setShowAdd(false)} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Supplier</DialogTitle></DialogHeader>
          {editItem && <SupplierForm initialData={editItem} onSubmit={(d) => updateMutation.mutate({ id: editItem.id, data: d }, { onSuccess: () => { invalidate(); setEditItem(null); } })} onCancel={() => setEditItem(null)} loading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this supplier? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate({ id: deleteId! }, { onSuccess: () => { invalidate(); setDeleteId(null); } })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
