import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import OrderFormDialog from "@/components/OrderFormDialog";

interface Order {
  id: string;
  order_number: number;
  info: string | null;
  product_id: string | null;
  total_price: number;
  status: string | null;
  created_at: string | null;
  created_by: string | null;
  invoice_id: string | null;
  products?: { name: string } | null;
  app_users?: { username: string } | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: "جديد", color: "bg-primary/20 text-primary" },
  shipped: { label: "تم الشحن", color: "bg-warning/20 text-warning" },
  delivered: { label: "تم التسليم", color: "bg-success/20 text-success" },
};

const Orders = () => {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, products(name), app_users:created_by(username)")
      .order("order_number", { ascending: false });

    if (!error && data) setOrders(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status: status as any }).eq("id", id);
    fetchOrders();
    toast.success("تم تحديث الحالة");
  };

  const deleteOrder = async (order: Order) => {
    if (order.invoice_id) {
      toast.error("لا يمكن حذف أوردر مرتبط بفاتورة");
      return;
    }
    if (!confirm("هل أنت متأكد من حذف هذا الأوردر؟")) return;
    const { error } = await supabase.from("orders").delete().eq("id", order.id);
    if (error) {
      toast.error("حدث خطأ أثناء الحذف");
    } else {
      toast.success("تم حذف الأوردر");
      fetchOrders();
    }
  };

  const handleEdit = (order: Order) => {
    if (order.invoice_id) {
      toast.error("لا يمكن تعديل أوردر مرتبط بفاتورة");
      return;
    }
    setEditOrder(order);
    setShowForm(true);
  };

  const filteredOrders = orders.filter((o) => {
    const matchSearch = !search || 
      o.info?.includes(search) || 
      o.order_number.toString().includes(search) ||
      o.products?.name?.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleSelect = (id: string) => {
    const s = new Set(selectedOrders);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedOrders(s);
  };

  const toggleAll = () => {
    if (selectedOrders.size === filteredOrders.filter(o => !o.invoice_id).length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.filter(o => !o.invoice_id).map(o => o.id)));
    }
  };

  const todayCount = orders.filter(o => {
    if (!o.created_at) return false;
    return new Date(o.created_at).toDateString() === new Date().toDateString();
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الطلبات</h1>
          <p className="text-muted-foreground text-sm">إجمالي: {orders.length} • اليوم: {todayCount}</p>
        </div>
        <button onClick={() => { setEditOrder(null); setShowForm(true); }} className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          إضافة أوردر
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="w-full bg-card border border-border rounded-lg pr-9 pl-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
        >
          <option value="all">كل الحالات</option>
          <option value="new">جديد</option>
          <option value="shipped">تم الشحن</option>
          <option value="delivered">تم التسليم</option>
        </select>
      </div>

      {/* Selected count + create invoice */}
      {isAdmin && selectedOrders.size > 0 && (
        <div className="glass-card p-3 flex items-center justify-between">
          <span className="text-sm text-foreground">تم تحديد {selectedOrders.size} أوردر</span>
          <button
            onClick={async () => {
              const { data: inv } = await supabase.from("invoices").insert({ created_by: user?.id }).select().single();
              if (inv) {
                for (const oid of selectedOrders) {
                  await supabase.from("orders").update({ invoice_id: inv.id }).eq("id", oid);
                }
                toast.success(`تم إنشاء فاتورة رقم ${inv.invoice_number}`);
                setSelectedOrders(new Set());
                fetchOrders();
              }
            }}
            className="gradient-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium"
          >
            إنشاء فاتورة
          </button>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                {isAdmin && (
                  <th className="p-3 text-right w-10">
                    <input type="checkbox" checked={selectedOrders.size === filteredOrders.filter(o => !o.invoice_id).length && filteredOrders.filter(o => !o.invoice_id).length > 0} onChange={toggleAll} className="rounded" />
                  </th>
                )}
                <th className="p-3 text-right">#</th>
                <th className="p-3 text-right">المنتج</th>
                <th className="p-3 text-right">المعلومات</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">المودريتور</th>
                <th className="p-3 text-right">التاريخ</th>
                <th className="p-3 text-right w-20">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">جاري التحميل...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">لا توجد طلبات</td></tr>
              ) : (
                filteredOrders.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
                  >
                    {isAdmin && (
                      <td className="p-3">
                        {!order.invoice_id ? (
                          <input type="checkbox" checked={selectedOrders.has(order.id)} onChange={() => toggleSelect(order.id)} className="rounded" />
                        ) : (
                          <span className="text-xs text-muted-foreground">مفوتر</span>
                        )}
                      </td>
                    )}
                    <td className="p-3 font-mono font-bold text-foreground">{order.order_number}</td>
                    <td className="p-3 text-foreground">{order.products?.name || "-"}</td>
                    <td className="p-3 text-foreground max-w-[200px] truncate">{order.info || "-"}</td>
                    <td className="p-3">
                      {isAdmin ? (
                        <select
                          value={order.status || "new"}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${statusLabels[order.status || "new"]?.color || ""} bg-opacity-20`}
                        >
                          <option value="new">جديد</option>
                          <option value="shipped">تم الشحن</option>
                          <option value="delivered">تم التسليم</option>
                        </select>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusLabels[order.status || "new"]?.color || ""}`}>
                          {statusLabels[order.status || "new"]?.label || order.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">{(order as any).app_users?.username || "-"}</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString("ar-EG") : "-"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(order)}
                          disabled={!!order.invoice_id}
                          className="text-primary hover:text-primary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteOrder(order)}
                          disabled={!!order.invoice_id}
                          className="text-destructive hover:text-destructive/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <OrderFormDialog
            onClose={() => { setShowForm(false); setEditOrder(null); }}
            onSuccess={() => { setShowForm(false); setEditOrder(null); fetchOrders(); }}
            editOrder={editOrder ? { id: editOrder.id, product_id: editOrder.product_id, info: editOrder.info, total_price: editOrder.total_price } : null}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;
