import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  getListCustomersQueryKey,
} from "@workspace/api-client-react";
import type { Customer, CreateCustomerBody } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/format";

function CustomerForm({ initialData, onSubmit, onCancel, loading }: {
  initialData?: Partial<CreateCustomerBody>;
  onSubmit: (d: CreateCustomerBody) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<CreateCustomerBody>({
    name: initialData?.name ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    address: initialData?.address ?? "",
    city: initialData?.city ?? "",
  });
  const set = (f: keyof CreateCustomerBody, v: string) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <div className="grid grid-cols-2 gap-4 py-2">
      <div className="col-span-2 space-y-1.5">
        <Label>Name</Label>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Company or person name" />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@example.com" />
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
      <div className="col-span-2 flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button onClick={() => onSubmit(form)} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
      </div>
    </div>
  );
}

export default function Customers() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: customers = [] } = useListCustomers({ search: search || undefined });
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">{customers.length} customers</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Customer</Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">City</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Total Purchases</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                    <Users className="mx-auto h-10 w-10 opacity-30 mb-3" />
                    <p className="font-medium">No customers found</p>
                  </td>
                </tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.city}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{formatCurrency(c.totalPurchases)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditItem(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(c.id)}>
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
          <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
          <CustomerForm onSubmit={(d) => createMutation.mutate({ data: d }, { onSuccess: () => { invalidate(); setShowAdd(false); } })} onCancel={() => setShowAdd(false)} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
          {editItem && <CustomerForm initialData={editItem} onSubmit={(d) => updateMutation.mutate({ id: editItem.id, data: d }, { onSuccess: () => { invalidate(); setEditItem(null); } })} onCancel={() => setEditItem(null)} loading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this customer? This action cannot be undone.</AlertDialogDescription>
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
