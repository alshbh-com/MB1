import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  username: string;
  role: "admin" | "moderator";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("mb_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("mb_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (password: string) => {
    const { data, error } = await supabase.rpc("login_by_password", {
      p_password: password,
    });

    if (error) return { success: false, message: "حدث خطأ في الاتصال" };

    const result = data as any;
    if (!result?.success) return { success: false, message: result?.message || "كلمة المرور غير صحيحة" };

    const u: User = {
      id: result.user.id,
      username: result.user.username,
      role: result.user.role,
    };
    setUser(u);
    localStorage.setItem("mb_user", JSON.stringify(u));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("mb_user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
};
