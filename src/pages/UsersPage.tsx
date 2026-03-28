import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X, Trash2, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface AppUser {
  id: string;
  username: string;
  role: "admin" | "moderator";
  created_at: string | null;
  last_login_at: string | null;
}

const UsersPage = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "moderator">("moderator");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_users").select("id, username, role, created_at, last_login_at").order("created_at", { ascending: false });
    if (data) setUsers(data as AppUser[]);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.rpc("add_user", {
      p_username: username.trim(),
      p_password: password.trim(),
      p_role: role,
    });
    setSaving(false);
    const result = data as any;
    if (error || !result?.success) {
      toast.error(result?.message || error?.message || "خطأ");
      return;
    }
    toast.success("تمت إضافة المستخدم");
    setShowForm(false);
    setUsername(""); setPassword(""); setRole("moderator");
    fetchUsers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف المستخدم؟")) return;
    await supabase.from("app_users").delete().eq("id", id);
    toast.success("تم الحذف");
    fetchUsers();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">المستخدمين</h1>
        <button onClick={() => setShowForm(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm">
          <UserPlus className="h-4 w-4" /> إضافة مستخدم
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="p-3 text-right">المستخدم</th>
              <th className="p-3 text-right">الصلاحية</th>
              <th className="p-3 text-right">آخر دخول</th>
              <th className="p-3 text-right w-16"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">جاري التحميل...</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/50">
                <td className="p-3 font-medium text-foreground">{u.username}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.role === "admin" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    {u.role === "admin" ? "مالك" : "مودريتور"}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground text-xs">
                  {u.last_login_at ? new Date(u.last_login_at).toLocaleString("ar-EG") : "لم يدخل بعد"}
                </td>
                <td className="p-3">
                  <button onClick={() => handleDelete(u.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="glass-card p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">إضافة مستخدم</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-3">
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="اسم المستخدم" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:border-primary outline-none" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:border-primary outline-none" dir="ltr" />
                <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:border-primary outline-none">
                  <option value="moderator">مودريتور</option>
                  <option value="admin">مالك</option>
                </select>
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

export default UsersPage;
