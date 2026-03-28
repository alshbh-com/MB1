import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  available_sizes: string[] | null;
  available_colors: string[] | null;
  created_at: string | null;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [sizes, setSizes] = useState("");
  const [colors, setColors] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("products").insert({
      name: name.trim(),
      price,
      available_sizes: sizes.split(",").map(s => s.trim()).filter(Boolean),
      available_colors: colors.split(",").map(s => s.trim()).filter(Boolean),
    });
    setSaving(false);
    if (error) { toast.error("خطأ: " + error.message); return; }
    toast.success("تمت الإضافة");
    setShowForm(false);
    setName(""); setPrice(0); setSizes(""); setColors("");
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف المنتج؟")) return;
    await supabase.from("products").delete().eq("id", id);
    toast.success("تم الحذف");
    fetchProducts();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">المنتجات</h1>
        <button onClick={() => setShowForm(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm">
          <Plus className="h-4 w-4" /> إضافة منتج
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full text-center text-muted-foreground py-8">جاري التحميل...</p>
        ) : products.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-8">لا توجد منتجات</p>
        ) : (
          products.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-foreground">{p.name}</h3>
                </div>
                <button onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-primary font-bold">{p.price} جنيه</p>
              {p.available_sizes && p.available_sizes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.available_sizes.map(s => <span key={s} className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{s}</span>)}
                </div>
              )}
              {p.available_colors && p.available_colors.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.available_colors.map(c => <span key={c} className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{c}</span>)}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="glass-card p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">إضافة منتج</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-3">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="اسم المنتج" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:border-primary outline-none" />
                <input type="number" value={price || ""} onChange={e => setPrice(Number(e.target.value))} placeholder="السعر" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:border-primary outline-none" dir="ltr" />
                <input value={sizes} onChange={e => setSizes(e.target.value)} placeholder="المقاسات (مفصولة بفاصلة)" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:border-primary outline-none" />
                <input value={colors} onChange={e => setColors(e.target.value)} placeholder="الألوان (مفصولة بفاصلة)" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:border-primary outline-none" />
                <button type="submit" disabled={saving} className="w-full gradient-primary text-primary-foreground font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50">
                  {saving ? "جاري الحفظ..." : "إضافة"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
