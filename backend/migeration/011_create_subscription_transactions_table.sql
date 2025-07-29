-- Create subscription_transactions table if it doesn't exist
-- This table tracks all subscription payments and upgrades

CREATE TABLE IF NOT EXISTS public.subscription_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_reference TEXT NOT NULL,
    paystack_reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'successful'::text, 'failed'::text, 'cancelled'::text])),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user_id ON public.subscription_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_status ON public.subscription_transactions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_payment_reference ON public.subscription_transactions(payment_reference);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_created_at ON public.subscription_transactions(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_subscription_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_subscription_transactions_updated_at ON public.subscription_transactions;
CREATE TRIGGER trigger_subscription_transactions_updated_at
    BEFORE UPDATE ON public.subscription_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_transactions_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.subscription_transactions TO postgres;
GRANT SELECT, INSERT, UPDATE ON public.subscription_transactions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.subscription_transactions TO authenticated;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully created subscription_transactions table';
END $$;