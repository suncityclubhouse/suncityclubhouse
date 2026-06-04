"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Expense } from "@/types/database";
import type { ActionResult } from "@/types";

const SOCIETY_ID = process.env.NEXT_PUBLIC_SOCIETY_ID!;

async function verifyAdmin() {
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  return user;
}

export async function getExpenses(): Promise<Expense[]> {
  const db = createAdminClient();
  const { data } = await db
    .from("expenses")
    .select("*")
    .eq("society_id", SOCIETY_ID)
    .order("expense_date", { ascending: false });

  return (data ?? []) as Expense[];
}

export async function getRecurringTemplates(): Promise<Expense[]> {
  const db = createAdminClient();
  const { data } = await db
    .from("expenses")
    .select("*")
    .eq("society_id", SOCIETY_ID)
    .eq("is_recurring", true)
    .order("expense_category", { ascending: true });

  return (data ?? []) as Expense[];
}

export async function createExpense(values: {
  facility_id: string | null;
  expense_category: string;
  amount: number;
  description: string | null;
  expense_date: string;
  is_recurring: boolean;
}): Promise<ActionResult<Expense>> {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { data, error } = await db
    .from("expenses")
    .insert({
      society_id: SOCIETY_ID,
      facility_id: values.facility_id,
      expense_category: values.expense_category,
      amount: values.amount,
      description: values.description,
      expense_date: values.expense_date,
      is_recurring: values.is_recurring,
    })
    .select("*")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Expense };
}

export async function updateExpense(
  id: string,
  values: {
    facility_id: string | null;
    expense_category: string;
    amount: number;
    description: string | null;
    expense_date: string;
    is_recurring: boolean;
  }
): Promise<ActionResult<Expense>> {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { data, error } = await db
    .from("expenses")
    .update({
      facility_id: values.facility_id,
      expense_category: values.expense_category,
      amount: values.amount,
      description: values.description,
      expense_date: values.expense_date,
      is_recurring: values.is_recurring,
    })
    .eq("id", id)
    .eq("society_id", SOCIETY_ID)
    .select("*")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Expense };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { error } = await db
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("society_id", SOCIETY_ID);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
