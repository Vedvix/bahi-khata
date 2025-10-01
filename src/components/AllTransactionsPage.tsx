import React, { useState } from "react";
import { Transaction } from "./TransactionContext"; // adjust path if needed
import { Calendar } from "./ui/calendar";
import { X } from "lucide-react";

interface AllTransactionsPageProps {
  transactions: Transaction[];
  onBack: () => void;
}

export function AllTransactionsPage({ transactions, onBack }: AllTransactionsPageProps) {
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "investment" | "lent" | "subscription">("all");
  const [sortOption, setSortOption] = useState<"dateDesc" | "dateAsc" | "amountDesc" | "amountAsc" | "custom">("dateDesc");
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});

  // Filtering
  let filteredTransactions = transactions.filter(tx => {
    if (filterType === "all") return true;
    return tx.type === filterType;
  });

  // Custom date range
  if (sortOption === "custom" && customRange.from && customRange.to) {
  const fromDate = new Date(customRange.from);
  fromDate.setHours(0, 0, 0, 0);

  const toDate = new Date(customRange.to);
  toDate.setHours(23, 59, 59, 999); // include the full day

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

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">All Transactions</h2>
        <button onClick={onBack} className="p-1 rounded hover:bg-gray-200">
          <X size={24} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["all", "income", "expense", "investment", "lent", "subscription"].map(type => (
          <button
            key={type}
            className={`px-3 py-1 rounded ${
              filterType === type ? "bg-indigo-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setFilterType(type as any)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Sorting */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          className="border rounded px-2 py-1"
          value={sortOption}
          onChange={e => setSortOption(e.target.value as any)}
        >
          <option value="dateDesc">Date ↓</option>
          <option value="dateAsc">Date ↑</option>
          <option value="amountDesc">Amount ↓</option>
          <option value="amountAsc">Amount ↑</option>
          <option value="custom">Custom Date</option>
        </select>

        {sortOption === "custom" && (
          <div className="border p-2 rounded">
            <Calendar mode="range" selected={customRange} onSelect={setCustomRange} />
          </div>
        )}
      </div>

      {/* Transaction list */}
      <div className="space-y-2">
        {filteredTransactions.map(tx => (
          <div key={tx.id} className="flex justify-between p-3 bg-white rounded-lg shadow-sm border">
            <div>
              <p className="font-medium">{tx.category || tx.type}</p>
              <p className="text-sm text-gray-500">{tx.description || "-"}</p>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
              </p>
              <p className="text-xs text-gray-500">{formatDate(tx.date)}</p>
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <p className="text-gray-500 text-center mt-4">No transactions found.</p>
        )}
      </div>
    </div>
  );
}

export default AllTransactionsPage;
