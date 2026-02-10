
-- PoultryPro AI - Complete Database Schema & Initial Data

-- ১. মুরগির ব্যাচ টেবিল (Flocks Table)
CREATE TABLE IF NOT EXISTS flocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    "batchName" TEXT NOT NULL,
    "startDate" DATE NOT NULL DEFAULT CURRENT_DATE,
    "initialCount" INTEGER NOT NULL DEFAULT 0,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    breed TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ২. আর্থিক লেনদেনের টেবিল (Transactions Table)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    quantity NUMERIC,
    unit TEXT,
    flock_id UUID REFERENCES flocks(id) ON DELETE SET NULL, -- ব্যাচের সাথে লিঙ্কিং
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ৩. ইনভেন্টরি টেবিল (Inventory Table)
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('FEED', 'MEDICINE')),
    "currentQuantity" NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    "minThreshold" NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ৪. ওজন ট্র্যাকিং টেবিল (Weight Logs Table)
CREATE TABLE IF NOT EXISTS weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flock_id UUID REFERENCES flocks(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    "averageWeight" NUMERIC NOT NULL,
    "sampleSize" INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ৫. মৃত্যুর হার ট্র্যাকিং টেবিল (Mortality Logs Table)
CREATE TABLE IF NOT EXISTS mortality_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flock_id UUID REFERENCES flocks(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INTEGER NOT NULL DEFAULT 1,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ৬. প্রতিদিনের খাবার ট্র্যাকিং টেবিল (Feed Logs Table)
CREATE TABLE IF NOT EXISTS feed_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flock_id UUID REFERENCES flocks(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC NOT NULL,
    unit TEXT NOT NULL DEFAULT 'ব্যাগ',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Enable করা
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mortality_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_logs ENABLE ROW LEVEL SECURITY;

-- পলিসি তৈরি (যাতে ইউজার শুধু নিজের ডেটা দেখতে পায়)
CREATE POLICY "Manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own flocks" ON flocks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own inventory" ON inventory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own weight logs" ON weight_logs FOR ALL USING (EXISTS (SELECT 1 FROM flocks WHERE flocks.id = weight_logs.flock_id AND flocks.user_id = auth.uid()));
CREATE POLICY "Manage own mortality logs" ON mortality_logs FOR ALL USING (EXISTS (SELECT 1 FROM flocks WHERE flocks.id = mortality_logs.flock_id AND flocks.user_id = auth.uid()));
CREATE POLICY "Manage own feed logs" ON feed_logs FOR ALL USING (EXISTS (SELECT 1 FROM flocks WHERE flocks.id = feed_logs.flock_id AND flocks.user_id = auth.uid()));

-- ডামি এন্ট্রি (নমুনা ডেটা) - আপনার প্রথমবার ব্যবহারের সুবিধার্থে
-- নোট: আপনি অ্যাপে লগইন করার পর সরাসরি অ্যাপ থেকেই ডেটা দিতে পারবেন।

-- ইনভেন্টরিতে কিছু ফিড যোগ করা
-- INSERT INTO inventory (name, category, "currentQuantity", unit, "minThreshold") 
-- VALUES ('স্টার্টার ফিড', 'FEED', 10, 'ব্যাগ', 2);
