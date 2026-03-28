import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface OrderToEdit {
  id: string;
  product_id: string | null;
  info: string | null;
  total_price: number;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  editOrder?: OrderToEdit | null;
}

const OrderFormDialog = ({ onClose, onSuccess, editOrder }: Props) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState(editOrder?.product_id || "");
  const [info, setInfo] = useState(editOrder?.info || "");
  const [totalPrice, setTotalPrice] = useState<number>(editOrder?.total_price || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("products").select("id, name, price").then(({ data }) => {
      if (data) setProducts(data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) { toast.error("اختر منتج"); return; }
    setLoading(true);

    if (editOrder) {
      const { error } = await supabase.from("orders").update({
        product_id: productId,
        info,
        total_price: totalPrice,
      }).eq("id", editOrder.id);

      setLoading(false);
      if (error) {
        toast.error("حدث خطأ: " + error.message);
      } else {
        toast.success("تم تعديل الأوردر بنجاح ✅");
        onSuccess();
      }
    } else {
      const { error } = await supabase.from("orders").insert({
        product_id: productId,
        info,
        total_price: totalPrice,
        created_by: user?.id,
        customer_name: "",
        phone: "",
        address: "",
        governorate: "",
      });

      setLoading(false);
      if (error) {
        toast.error("حدث خطأ: " + error.message);
      } else {
        toast.success("تم إنشاء الأوردر بنجاح 🎉");
        onSuccess();
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card p-6 w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            {editOrder ? "تعديل الأوردر" : "إضافة أوردر جديد"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">المنتج</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:border-primary outline-none"
            >
              <option value="">اختر منتج...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} - {p.price} جنيه</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">المعلومات</label>
            <textarea
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              rows={4}
              placeholder="اسم العميل، العنوان، رقم الهاتف، المقاس، اللون، الكمية..."
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:border-primary outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">الإجمالي (جنيه)</label>
            <input
              type="number"
              value={totalPrice || ""}
              onChange={(e) => setTotalPrice(Number(e.target.value))}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:border-primary outline-none"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
          >
            {loading ? (editOrder ? "جاري التعديل..." : "جاري الإنشاء...") : (editOrder ? "حفظ التعديلات" : "إنشاء أوردر")}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default OrderFormDialog;
