# Wallet Error Fix Guide

## Problem
If you're seeing the error `Failed to load wallet data: [Error: {"error":"Failed to fetch wallet information"}]`, this means the wallet system is not properly set up in your database.

## Root Cause
The error occurs because:
1. The `wallets` table doesn't exist in your Supabase database
2. The user doesn't have a wallet record in the database
3. Database permissions are not properly configured

## Solution: Manual Database Setup (Required)

Since Supabase doesn't support automatic table creation through the API, you need to manually create the database tables:

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** in the left sidebar

### Step 2: Run the SQL Script
1. Copy the entire contents of `backend/setup-wallets-table.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the script

### Step 3: Verify Setup
After running the script, you should see:
- ✅ `wallets` table created
- ✅ `transactions` table created
- ✅ Indexes and triggers created
- ✅ Row Level Security (RLS) policies applied

## What the Script Creates

The SQL script will create:

1. **wallets table** - Stores user wallet balances
2. **transactions table** - Stores transaction history
3. **Indexes** - For faster database queries
4. **Triggers** - To automatically update timestamps
5. **RLS Policies** - For security and data isolation

## Testing the Fix

1. **Restart your backend server** (if it's running)
2. **Open the app and navigate to the Wallet page**
3. **You should see a balance of 0.00 PC** (indicating a new wallet was created)
4. **No more error messages**

## Backend Changes

The backend has been updated to:
- ✅ Automatically create wallet records for users when they don't exist
- ✅ Provide better error handling with user-friendly messages
- ✅ Check database table existence on startup
- ✅ Handle missing wallet scenarios gracefully

## Troubleshooting

### Still seeing errors after running the SQL script?
1. **Check the backend console** - You should see "✅ Wallets table exists"
2. **Verify the script ran successfully** - Check your Supabase dashboard for the tables
3. **Check environment variables** - Ensure your Supabase credentials are correct

### Database permissions issues?
1. Make sure you're using the **service role key** (not the anon key) in your backend
2. Verify that RLS policies are properly applied
3. Test with a fresh user account

### Environment Variables
Ensure your backend `.env` file has:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
```

## Support

If you continue to experience issues:
1. Check the backend logs for specific error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are properly set
4. Try creating a new user account to test the wallet creation 