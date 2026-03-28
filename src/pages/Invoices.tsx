import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Printer, Lock } from "lucide-react";
import { toast } from "sonner";
import InvoicePrintView from "@/components/InvoicePrintView";

interface Invoice {
  id: string;
  invoice_number: number;
  is_locked: boolean | null;
  created_at: string | null;
  created_by: string | null;
}

interface Order {
  id: string;
  order_number: number;
  info: string | null;
  total_price: number;
  product_id: string | null;
  products?: { name: string } | null;
}

interface PrintData {
  invoice: Invoice;
  orders: Order[];
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [printDataList, setPrintDataList] = useState<PrintData[]>([]);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data } = await supabase.from("invoices").select("*").order("invoice_number", { ascending: false });
    if (data) setInvoices(data);
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, []);

  const toggleSelect = (id: string) => {
    const s = new Set(selectedInvoices);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedInvoices(s);
  };

  const toggleAll = () => {
    if (selectedInvoices.size === invoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(invoices.map(i => i.id)));
    }
  };

  const handlePrintSelected = async () => {
    const targetIds = selectedInvoices.size > 0 
      ? Array.from(selectedInvoices) 
      : [];
    
    if (targetIds.length === 0) {
      toast.error("حدد فاتورة واحدة على الأقل");
      return;
    }

    const results: PrintData[] = [];
    for (const invId of targetIds) {
      const invoice = invoices.find(i => i.id === invId);
      if (!invoice) continue;
      const { data: orders } = await supabase
        .from("orders")
        .select("*, products(name)")
        .eq("invoice_id", invId)
        .order("order_number", { ascending: true });
      if (orders && orders.length > 0) {
        results.push({ invoice, orders: orders as any });
      }
    }

    if (results.length === 0) {
      toast.error("لا توجد طلبات في الفواتير المحددة");
      return;
    }

    setPrintDataList(results);
    setTimeout(() => window.print(), 300);
  };

  const handlePrintSingle = async (invoice: Invoice) => {
    const { data: orders } = await supabase
      .from("orders")
      .select("*, products(name)")
      .eq("invoice_id", invoice.id)
      .order("order_number", { ascending: true });

    if (orders && orders.length > 0) {
      setPrintDataList([{ invoice, orders: orders as any }]);
      setTimeout(() => window.print(), 300);
    } else {
      toast.error("لا توجد طلبات في هذه الفاتورة");
    }
  };

  return (
    <>
      <div className="space-y-4 no-print">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">الفواتير</h1>
          {selectedInvoices.size > 0 && (
            <button
              onClick={handlePrintSelected}
              className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <Printer className="h-4 w-4" />
              طباعة {selectedInvoices.size} فاتورة
            </button>
          )}
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="p-3 text-right w-10">
                  <input type="checkbox" checked={selectedInvoices.size === invoices.length && invoices.length > 0} onChange={toggleAll} className="rounded" />
                </th>
                <th className="p-3 text-right">رقم الفاتورة</th>
                <th className="p-3 text-right">التاريخ</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right w-20"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">جاري التحميل...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">لا توجد فواتير</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/50">
                    <td className="p-3">
                      <input type="checkbox" checked={selectedInvoices.has(inv.id)} onChange={() => toggleSelect(inv.id)} className="rounded" />
                    </td>
                    <td className="p-3 font-mono font-bold text-foreground">#{inv.invoice_number}</td>
                    <td className="p-3 text-muted-foreground text-xs">{inv.created_at ? new Date(inv.created_at).toLocaleDateString("ar-EG") : "-"}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" /> مقفلة
                      </span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => handlePrintSingle(inv)} className="text-primary hover:text-primary/80 transition-colors">
                        <Printer className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {printDataList.map((pd, idx) => (
        <InvoicePrintView key={idx} invoice={pd.invoice} orders={pd.orders} />
      ))}
    </>
  );
};

export default Invoices;
