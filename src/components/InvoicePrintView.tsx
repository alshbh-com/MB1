import logo from "@/assets/logo.jpg";

interface Order {
  id: string;
  order_number: number;
  info: string | null;
  total_price: number;
  products?: { name: string } | null;
}

interface Props {
  invoice: {
    invoice_number: number;
    created_at: string | null;
  };
  orders: Order[];
}

const InvoiceCopy = ({ invoice, orders }: Props) => {
  const date = invoice.created_at ? new Date(invoice.created_at).toLocaleDateString("ar-EG") : "-";

  return (
    <div style={{ width: "60mm", padding: "3mm", fontFamily: "Cairo, sans-serif", fontSize: "7pt", color: "#000", direction: "rtl" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2mm", borderBottom: "1px solid #333", paddingBottom: "2mm" }}>
        <img src={logo} alt="MB" style={{ width: "12mm", height: "12mm", margin: "0 auto 1mm", borderRadius: "3mm", objectFit: "cover" }} />
        <div style={{ fontWeight: 800, fontSize: "10pt" }}>MB</div>
        <div style={{ fontSize: "6pt", color: "#666", marginTop: "1mm" }}>
          فاتورة #{invoice.invoice_number} • {date}
        </div>
      </div>

      {/* Orders Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "6.5pt" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ccc" }}>
            <th style={{ textAlign: "right", padding: "1mm", fontWeight: 700 }}>#</th>
            <th style={{ textAlign: "right", padding: "1mm", fontWeight: 700 }}>المنتج</th>
            <th style={{ textAlign: "right", padding: "1mm", fontWeight: 700 }}>المعلومات</th>
            <th style={{ textAlign: "right", padding: "1mm", fontWeight: 700 }}>السعر</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => (
            <tr key={order.id} style={{ borderBottom: "0.5px solid #eee" }}>
              <td style={{ padding: "1mm", fontSize: "6pt" }}>{i + 1}</td>
              <td style={{ padding: "1mm" }}>{order.products?.name || "-"}</td>
              <td style={{ padding: "1mm", maxWidth: "20mm", wordBreak: "break-word", fontSize: "5.5pt" }}>{order.info || "-"}</td>
              <td style={{ padding: "1mm", fontWeight: 700 }}>{order.total_price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #333", marginTop: "2mm", paddingTop: "2mm", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "7pt" }}>
        <span>عدد الطلبات: {orders.length}</span>
        <span>الإجمالي: {orders.reduce((s, o) => s + o.total_price, 0)} جنيه</span>
      </div>
    </div>
  );
};

const InvoicePrintView = ({ invoice, orders }: Props) => {
  return (
    <div className="hidden print:block" style={{ width: "128mm", height: "150mm", display: "flex", margin: 0, padding: "3mm", boxSizing: "border-box", background: "#fff" }}>
      <style>{`
        @media print {
          .hidden.print\\:block { display: flex !important; }
        }
      `}</style>
      <InvoiceCopy invoice={invoice} orders={orders} />
      <div style={{ width: "1px", background: "#ccc", margin: "0 1mm" }} />
      <InvoiceCopy invoice={invoice} orders={orders} />
    </div>
  );
};

export default InvoicePrintView;
