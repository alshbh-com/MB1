import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Printer, Lock } from "lucide-react";
import { motion } from "framer-motion";
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

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [printOrders, setPrintOrders] = useState<Order[]>([]);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data } = await supabase.from("invoices").select("*").order("invoice_number", { ascending: false });
    if (data) setInvoices(data);
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handlePrint = async (invoice: Invoice) => {
    const { data: orders } = await supabase
      .from("orders")
      .select("*, products(name)")
      .eq("invoice_id", invoice.id)
      .order("order_number", { ascending: true });

    if (orders && orders.length > 0) {
      setPrintInvoice(invoice);
      setPrintOrders(orders as any);
      setTimeout(() => window.print(), 300);
    } else {
      toast.error("لا توجد طلبات في هذه الفاتورة");
    }
  };

  return (
    <>
      <div className="space-y-4 no-print">
        <h1 className="text-2xl font-bold text-foreground">الفواتير</h1>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="p-3 text-right">رقم الفاتورة</th>
                <th className="p-3 text-right">التاريخ</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right w-20"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">جاري التحميل...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">لا توجد فواتير</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/50">
                    <td className="p-3 font-mono font-bold text-foreground">#{inv.invoice_number}</td>
                    <td className="p-3 text-muted-foreground text-xs">{inv.created_at ? new Date(inv.created_at).toLocaleDateString("ar-EG") : "-"}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" /> مقفلة
                      </span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => handlePrint(inv)} className="text-primary hover:text-primary/80 transition-colors">
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

      {printInvoice && (
        <InvoicePrintView invoice={printInvoice} orders={printOrders} />
      )}
    </>
  );
};

export default Invoices;
