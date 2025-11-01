import React, { useState } from "react";
import { Transaction } from "./TransactionContext"; // adjust path if needed
import { Calendar } from "./ui/calendar";
import { X } from "lucide-react";

interface AllTransactionsPageProps {
  transactions: Transaction[];
  onBack: () => void;
}

export function AllTransactionsPage({ transactions, onBack }: AllTransactionsPageProps) {
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "investment" | "lent" | "subscription" | "emi">("all");
  const [sortOption, setSortOption] = useState<"dateDesc" | "dateAsc" | "amountDesc" | "amountAsc" | "custom">("dateDesc");
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});

  // Filtering
  let filteredTransactions = transactions.filter(tx => {
    if (filterType === "all") return true;
    if (filterType === "expense") return tx.type === "expense" || tx.type === "subscription" || tx.type === "emi";
    if (filterType === "subscription") return tx.type === "subscription";
    if (filterType === "lent") return tx.type === "lend";
    if (filterType === "investment") return tx.type === "investment";
    return tx.type === filterType;
  });

  // Custom date range
  if (sortOption === "custom" && customRange.from && customRange.to) {
    const fromDate = new Date(customRange.from);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(customRange.to);
    toDate.setHours(23, 59, 59, 999);

    filteredTransactions = filteredTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= fromDate && txDate <= toDate;
    });
  }

  // Sorting
  filteredTransactions.sort((a, b) => {
    switch (sortOption) {
      case "dateAsc": return new Date(a.date).getTime() - new Date(b.date).getTime();
      case "dateDesc": return new Date(b.date).getTime() - new Date(a.date).getTime();
      case "amountAsc": return a.amount - b.amount;
      case "amountDesc": return b.amount - a.amount;
      default: return 0;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "income": return "#16A34A"; // green
      case "expense": return "#DC2626"; // red
      case "subscription": return "#2563EB"; // blue
      case "investment": return "#F59E0B"; // amber
      case "lent": return "#6B7280"; // gray
      default: return "#9CA3AF"; // light gray
    }
  };

  return (
    <div style={{ padding: 20, backgroundColor: "#F3F4F6", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>All Transactions</h2>
        <button onClick={onBack} style={{ padding: 6, borderRadius: 6, cursor: "pointer", border: "none", backgroundColor: "#E5E7EB" }}>
          <X size={24} />
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
        {["all", "income", "expense", "investment", "lent", "subscription"].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type as any)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              cursor: "pointer",
              backgroundColor: filterType === type ? "#4F46E5" : "#E5E7EB",
              color: filterType === type ? "#FFFFFF" : "#111827",
              fontWeight: 500,
              border: "none",
              transition: "0.2s"
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Sorting */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <select
          value={sortOption}
          onChange={e => setSortOption(e.target.value as any)}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14 }}
        >
          <option value="dateDesc">Date ↓</option>
          <option value="dateAsc">Date ↑</option>
          <option value="amountDesc">Amount ↓</option>
          <option value="amountAsc">Amount ↑</option>
          <option value="custom">Custom Date</option>
        </select>

        {sortOption === "custom" && (
          <div style={{ border: "1px solid #D1D5DB", padding: 8, borderRadius: 6 }}>
            <Calendar mode="range" selected={customRange} onSelect={setCustomRange} />
          </div>
        )}
      </div>

      {/* Transaction list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredTransactions.map(tx => (
          <div
            key={tx.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 16,
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span
                  style={{
                    backgroundColor: getBadgeColor(tx.type),
                    color: "#fff",
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                </span>
                <p style={{ fontWeight: 600, fontSize: 16 }}>{tx.category || "-"}</p>
              </div>
              <p style={{ fontSize: 13, color: "#6B7280" }}>{tx.description || "-"}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontWeight: 700, fontSize: 16, color: tx.type === "income" ? "#16A34A" : "#DC2626" }}>
                {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
              </p>
              <p style={{ fontSize: 11, color: "#6B7280" }}>{formatDate(tx.date)}</p>
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <p style={{ color: "#6B7280", textAlign: "center", marginTop: 20, fontSize: 14 }}>No transactions found.</p>
        )}
      </div>
    </div>
  );
}

export default AllTransactionsPage;
