-- Supprimer toutes les policies existantes sur coaches
DROP POLICY IF EXISTS "Allow public read coaches by access_key" ON public.coaches;
DROP POLICY IF EXISTS "Enable insert for super admins" ON public.coaches;
DROP POLICY IF EXISTS "Enable update for coaches and admins" ON public.coaches;
DROP POLICY IF EXISTS "Enable delete for super admins" ON public.coaches;
DROP POLICY IF EXISTS "Coaches are viewable by everyone" ON public.coaches;
DROP POLICY IF EXISTS "Admins can do everything on coaches" ON public.coaches;
DROP POLICY IF EXISTS "Coaches can update their own data" ON public.coaches;

-- Recréer des policies propres sans récursion
CREATE POLICY "Public can read coaches" 
ON public.coaches FOR SELECT USING (true);

CREATE POLICY "Super admin can insert coaches" 
ON public.coaches FOR INSERT 
WITH CHECK (auth.jwt() ->> 'email' = 'stanlamoureux@gmail.com');

CREATE POLICY "Super admin can update coaches" 
ON public.coaches FOR UPDATE 
USING (auth.jwt() ->> 'email' = 'stanlamoureux@gmail.com');

CREATE POLICY "Super admin can delete coaches" 
ON public.coaches FOR DELETE 
USING (auth.jwt() ->> 'email' = 'stanlamoureux@gmail.com');
