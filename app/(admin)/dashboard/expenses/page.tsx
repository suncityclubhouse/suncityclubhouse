import { getExpenses, getRecurringTemplates } from "@/actions/expenses";
import { getFacilities } from "@/actions/facilities";
import { ExpenseManager } from "@/components/admin/ExpenseManager";

export const metadata = {
  title: "Expenses | Admin Dashboard",
};

export default async function ExpensesPage() {
  const [expenses, facilities, recurringTemplates] = await Promise.all([
    getExpenses(),
    getFacilities(true),
    getRecurringTemplates(),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <ExpenseManager 
        initialExpenses={expenses} 
        facilities={facilities} 
        recurringTemplates={recurringTemplates} 
      />
    </div>
  );
}
