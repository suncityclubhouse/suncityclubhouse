"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createExpense, updateExpense, deleteExpense } from "@/actions/expenses";
import { formatINR } from "@/lib/utils/formatters";
import type { Expense, Facility } from "@/types/database";

interface Props {
  initialExpenses: Expense[];
  facilities: Facility[];
  recurringTemplates: Expense[];
}

export function ExpenseManager({ initialExpenses, facilities, recurringTemplates }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [expenseDate, setExpenseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [facilityId, setFacilityId] = useState<string>("none");
  const [isRecurring, setIsRecurring] = useState(false);

  const resetForm = () => {
    setExpenseDate(format(new Date(), "yyyy-MM-dd"));
    setAmount("");
    setCategory("");
    setDescription("");
    setFacilityId("none");
    setIsRecurring(false);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (expense: Expense) => {
    setExpenseDate(expense.expense_date);
    setAmount(expense.amount.toString());
    setCategory(expense.expense_category);
    setDescription(expense.description ?? "");
    setFacilityId(expense.facility_id ?? "none");
    setIsRecurring(expense.is_recurring);
    setEditingId(expense.id);
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !expenseDate) {
      toast.error("Please fill in required fields (Amount, Category, Date).");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        facility_id: facilityId === "none" ? null : facilityId,
        expense_category: category,
        amount: parseFloat(amount),
        description: description || null,
        expense_date: expenseDate,
        is_recurring: isRecurring,
      };

      if (editingId) {
        const res = await updateExpense(editingId, payload);
        if (res.success && res.data) {
          setExpenses((prev) => prev.map((ex) => (ex.id === editingId ? res.data! : ex)));
          toast.success("Expense updated");
        } else {
          toast.error(res.error || "Failed to update expense");
        }
      } else {
        const res = await createExpense(payload);
        if (res.success && res.data) {
          setExpenses((prev) => [res.data!, ...prev]);
          toast.success("Expense added");
        } else {
          toast.error(res.error || "Failed to add expense");
        }
      }
      if (!editingId || (editingId && isRecurring !== expenses.find(e => e.id === editingId)?.is_recurring)) {
        // A page refresh might be cleaner to update the recurring templates list
        window.location.reload();
      }
      resetForm();
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    setLoading(true);
    try {
      const res = await deleteExpense(id);
      if (res.success) {
        setExpenses((prev) => prev.filter((ex) => ex.id !== id));
        toast.success("Expense deleted");
      } else {
        toast.error(res.error || "Failed to delete");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (template: Expense) => {
    setExpenseDate(format(new Date(), "yyyy-MM-dd"));
    setAmount(template.amount.toString());
    setCategory(template.expense_category);
    setDescription(template.description ?? "");
    setFacilityId(template.facility_id ?? "none");
    setIsRecurring(false); // Don't make the logged instance a template itself
    setIsAdding(true);
    setEditingId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const unloggedTemplates = recurringTemplates.filter((template) => {
    // Check if there is an expense logged this month matching this template
    const alreadyLogged = expenses.some((ex) => {
      if (ex.is_recurring) return false;
      if (ex.expense_category !== template.expense_category) return false;
      if (ex.amount !== template.amount) return false;
      if (ex.facility_id !== template.facility_id) return false;

      const exDate = new Date(ex.expense_date);
      return exDate.getMonth() === currentMonth && exDate.getFullYear() === currentYear;
    });
    return !alreadyLogged;
  });

  return (
    <div className="space-y-8">
      {/* Quick Add Recurring Templates */}
      {unloggedTemplates.length > 0 && !isAdding && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Recurring Monthly Expenses
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {unloggedTemplates.map((template) => (
              <div key={template.id} className="bg-white border border-amber-200 rounded-lg p-3 flex flex-col justify-between">
                <div>
                  <p className="font-medium text-stone-900">{template.expense_category}</p>
                  <p className="text-lg font-bold text-stone-800">{formatINR(template.amount)}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-3 w-full text-amber-700 border-amber-200 hover:bg-amber-100"
                  onClick={() => handleQuickAdd(template)}
                >
                  Log for this month
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header & Add Button */}
      {!isAdding && (
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-serif font-bold text-stone-900">Expenses</h1>
          <Button onClick={() => setIsAdding(true)} style={{ backgroundColor: "#08428C" }} className="text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      )}

      {/* Add / Edit Form */}
      {isAdding && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm max-w-2xl">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">
            {editingId ? "Edit Expense" : "Log New Expense"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input id="amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="e.g. 1500" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category *</Label>
                <Input id="category" type="text" value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="e.g. Maid, Cleaning, Electricity" />
              </div>
              <div className="space-y-1.5">
                <Label>Facility (Optional)</Label>
                <Select value={facilityId} onValueChange={setFacilityId}>
                  <SelectTrigger><SelectValue placeholder="Overall Society" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Overall Society --</SelectItem>
                    {facilities.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Deep cleaning for the main hall" />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="recurring" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="rounded border-stone-300 text-blue-600 focus:ring-blue-500" />
              <Label htmlFor="recurring" className="text-stone-600 font-normal">Save as a recurring monthly template</Label>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading} style={{ backgroundColor: "#08428C" }} className="text-white min-w-24">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Expense"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-900 font-medium">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Facility</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                    No expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => {
                  const facilityName = expense.facility_id 
                    ? facilities.find(f => f.id === expense.facility_id)?.name || "Unknown"
                    : "Overall";
                  
                  return (
                    <tr key={expense.id} className="hover:bg-stone-50/50">
                      <td className="px-4 py-3 whitespace-nowrap">{format(new Date(expense.expense_date), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3 font-medium text-stone-900">
                        {expense.expense_category}
                        {expense.is_recurring && <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Template</span>}
                      </td>
                      <td className="px-4 py-3 text-stone-500">{facilityName}</td>
                      <td className="px-4 py-3 text-stone-500 max-w-xs truncate">{expense.description || "-"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-stone-900">{formatINR(expense.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(expense)} className="p-1 text-stone-400 hover:text-blue-600 transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(expense.id)} className="p-1 text-stone-400 hover:text-red-500 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
