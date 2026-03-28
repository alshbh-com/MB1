import { useAuth } from "@/contexts/AuthContext";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Package, FileText, ShoppingBag, Users, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.jpg";

const DashboardLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const links = [
    { to: "/dashboard/orders", icon: ShoppingBag, label: "الطلبات", show: true },
    { to: "/dashboard/invoices", icon: FileText, label: "الفواتير", show: isAdmin },
    { to: "/dashboard/products", icon: Package, label: "المنتجات", show: isAdmin },
    { to: "/dashboard/users", icon: Users, label: "المستخدمين", show: isAdmin },
  ].filter((l) => l.show);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <img src={logo} alt="MB" className="w-10 h-10 rounded-xl object-cover" />
        <div>
          <h2 className="font-bold text-foreground">MB System</h2>
          <p className="text-xs text-muted-foreground">{user?.username} • {user?.role === "admin" ? "مالك" : "مودريتور"}</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                isActive
                  ? "gradient-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`
            }
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 w-full transition-all text-sm font-medium"
        >
          <LogOut className="h-5 w-5" />
          تسجيل خروج
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-card border-l border-border flex-col fixed h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: 100 }}
              animate={{ x: 0 }}
              exit={{ x: 100 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed top-0 right-0 w-72 h-full bg-card border-l border-border z-50 md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:mr-64">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="MB" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-foreground">MB System</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-foreground p-2">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
