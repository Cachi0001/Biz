-- Drop the incorrect policies that were just created
DROP POLICY IF EXISTS "Team members can manage owner's customers" ON public.customers;
DROP POLICY IF EXISTS "Team members can manage owner's products" ON public.products;
DROP POLICY IF EXISTS "Team members can view owner's invoices" ON public.invoices;
DROP POLICY IF EXISTS "Team members can view owner's expenses" ON public.expenses;
DROP POLICY IF EXISTS "Team members can manage owner's sales" ON public.sales;
DROP POLICY IF EXISTS "Owners and team can view payments" ON public.payments;
DROP POLICY IF EXISTS "Owners and team members can view transactions" ON public.transactions;

-- Re-create the policies using the correct JWT claim logic for Flask
CREATE POLICY "Team members can manage owner's customers" ON public.customers
  FOR ALL
  USING (owner_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid) OR owner_id = (SELECT u.owner_id FROM public.users u WHERE u.id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)))
  WITH CHECK (owner_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid) OR owner_id = (SELECT u.owner_id FROM public.users u WHERE u.id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)));

CREATE POLICY "Team members can manage owner's products" ON public.products
  FOR ALL
  USING (owner_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid) OR owner_id = (SELECT u.owner_id FROM public.users u WHERE u.id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)))
  WITH CHECK (owner_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid) OR owner_id = (SELECT u.owner_id FROM public.users u WHERE u.id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)));

CREATE POLICY "Team members can view owner's invoices" ON public.invoices
  FOR SELECT
  USING (owner_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid) OR owner_id = (SELECT u.owner_id FROM public.users u WHERE u.id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)));

CREATE POLICY "Team members can view owner's expenses" ON public.expenses
  FOR SELECT
  USING (owner_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid) OR owner_id = (SELECT u.owner_id FROM public.users u WHERE u.id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)));
  
CREATE POLICY "Team members can manage owner's sales" ON public.sales
  FOR ALL
  USING (owner_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid) OR owner_id = (SELECT u.owner_id FROM public.users u WHERE u.id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)))
  WITH CHECK (owner_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid) OR owner_id = (SELECT u.owner_id FROM public.users u WHERE u.id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)));

CREATE POLICY "Owners and team can view payments" ON public.payments
  FOR SELECT
  USING (owner_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid) OR owner_id = (SELECT u.owner_id FROM public.users u WHERE u.id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)));

CREATE POLICY "Owners and team members can view transactions" ON public.transactions
  FOR SELECT
  USING (owner_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid) OR owner_id = (SELECT u.owner_id FROM public.users u WHERE u.id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)));