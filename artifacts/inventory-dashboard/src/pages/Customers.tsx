import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, getListCustomersQueryKey,
} from "@workspace/api-client-react";
import type { Customer, CreateCustomerBody } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/format";

const GLASS_INPUT = "glass border-white/10 text-white placeholder:text-white/25 focus-visible:ring-cyan-500/40 rounded-xl";
const DIALOG_STYLE = { background: "rgba(8,14,36,0.95)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.1)" };
const DELETE_DIALOG_STYLE = { background: "rgba(8,14,36,0.95)", backdropFilter: "blur(40px)", border: "1px solid rgba(239,68,68,0.2)" };

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
        <Label className="text-white/60 text-xs uppercase tracking-wider">Name</Label>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Company or person name" className={GLASS_INPUT} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-white/60 text-xs uppercase tracking-wider">Email</Label>
        <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@example.com" className={GLASS_INPUT} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-white/60 text-xs uppercase tracking-wider">Phone</Label>
        <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1-555-0000" className={GLASS_INPUT} />
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label className="text-white/60 text-xs uppercase tracking-wider">Address</Label>
        <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street address" className={GLASS_INPUT} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-white/60 text-xs uppercase tracking-wider">City</Label>
        <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" className={GLASS_INPUT} />
      </div>
      <div className="col-span-2 flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={loading} className="border-white/10 text-white/70 hover:bg-white/5">Cancel</Button>
        <Button onClick={() => onSubmit(form)} disabled={loading} className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30">{loading ? "Saving..." : "Save"}</Button>
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Customers</h1>
          <p className="text-sm text-white/35 mt-1">{customers.length} customers</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/25 rounded-xl">
          <Plus className="h-4 w-4" /> Add Customer
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
        <Input placeholder="Search customers..." className={`pl-9 ${GLASS_INPUT}`} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-2xl overflow-hidden glass" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Name", "Email", "Phone", "City", "Total Purchases", "Joined", ""].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-white/30 ${i === 4 ? "text-right" : i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center">
                  <Users className="mx-auto h-10 w-10 opacity-15 mb-3 text-white" />
                  <p className="font-medium text-white/40">No customers found</p>
                </td></tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="border-b border-white/4 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 font-medium text-white/80">{c.name}</td>
                  <td className="px-4 py-3 text-white/45">{c.email}</td>
                  <td className="px-4 py-3 text-white/45">{c.phone}</td>
                  <td className="px-4 py-3 text-white/45">{c.city}</td>
                  <td className="px-4 py-3 text-right font-semibold text-cyan-400 tabular-nums">{formatCurrency(c.totalPurchases)}</td>
                  <td className="px-4 py-3 text-white/35">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg" onClick={() => setEditItem(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg" onClick={() => setDeleteId(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md text-white" style={DIALOG_STYLE}>
          <DialogHeader><DialogTitle className="text-white">Add Customer</DialogTitle></DialogHeader>
          <CustomerForm onSubmit={(d) => createMutation.mutate({ data: d }, { onSuccess: () => { invalidate(); setShowAdd(false); } })} onCancel={() => setShowAdd(false)} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-md text-white" style={DIALOG_STYLE}>
          <DialogHeader><DialogTitle className="text-white">Edit Customer</DialogTitle></DialogHeader>
          {editItem && <CustomerForm initialData={editItem} onSubmit={(d) => updateMutation.mutate({ id: editItem.id, data: d }, { onSuccess: () => { invalidate(); setEditItem(null); } })} onCancel={() => setEditItem(null)} loading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent style={DELETE_DIALOG_STYLE}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Customer</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/70 hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate({ id: deleteId! }, { onSuccess: () => { invalidate(); setDeleteId(null); } })} className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
