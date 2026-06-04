create table if not exists public.expenses (
    id uuid primary key default uuid_generate_v4(),
    society_id uuid not null references public.societies(id) on delete cascade,
    facility_id uuid references public.facilities(id) on delete set null,
    expense_category text not null,
    amount numeric not null check (amount >= 0),
    description text,
    expense_date date not null,
    is_recurring boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.expenses enable row level security;

create policy "Admins can view expenses of their society"
    on public.expenses for select
    to authenticated
    using (society_id in (select society_id from public.admins where id = auth.uid()));

create policy "Admins can insert expenses to their society"
    on public.expenses for insert
    to authenticated
    with check (society_id in (select society_id from public.admins where id = auth.uid()));

create policy "Admins can update expenses of their society"
    on public.expenses for update
    to authenticated
    using (society_id in (select society_id from public.admins where id = auth.uid()))
    with check (society_id in (select society_id from public.admins where id = auth.uid()));

create policy "Admins can delete expenses of their society"
    on public.expenses for delete
    to authenticated
    using (society_id in (select society_id from public.admins where id = auth.uid()));

-- trigger for updated_at
create trigger set_expenses_updated_at
    before update on public.expenses
    for each row
    execute function trigger_set_updated_at();
