# Database Setup Instructions

Your profile page is showing 404/400 errors because some required database tables are missing. Follow these steps to fix the issue:

## Step 1: Run the Database Setup Script

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `database-setup.sql` (located in the project root)
4. Click "Run" to execute the script

This will create the missing tables:
- `debate_feedback` - Stores AI-generated feedback for debates
- `practice_sessions` - Stores solo practice session records

## Step 2: Verify the Setup

After running the script, refresh your profile page. The yellow warning banner should disappear, and you should see:
- Your debate statistics
- Practice session history
- Feedback scores (once you have some debates with feedback)

## What the Script Does

The `database-setup.sql` script:

1. **Creates missing tables** with proper structure and constraints
2. **Sets up Row Level Security (RLS)** policies to ensure users can only access their own data
3. **Creates indexes** for better query performance
4. **Adds triggers** to automatically extract numeric scores from feedback JSON
5. **Grants proper permissions** for authenticated users

## Troubleshooting

### If you still see errors after running the script:

1. **Check the browser console** for detailed error messages
2. **Verify RLS policies** are working by testing queries in the Supabase SQL editor
3. **Ensure your user is authenticated** - sign out and sign back in if needed

### Common issues:

- **"relation does not exist"** - The table creation failed, check for SQL errors
- **"permission denied"** - RLS policies aren't set up correctly
- **"column does not exist"** - There might be a schema mismatch

### Testing the setup manually:

You can test if the tables were created correctly by running these queries in the Supabase SQL editor:

```sql
-- Test debate_feedback table
SELECT * FROM public.debate_feedback LIMIT 1;

-- Test practice_sessions table  
SELECT * FROM public.practice_sessions LIMIT 1;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('debate_feedback', 'practice_sessions');
```

## Next Steps

Once the database is set up:

1. **Create some practice sessions** to test the practice history feature
2. **Participate in debates** to generate feedback data
3. **Check your profile page** to see your statistics update

The profile page will now properly display:
- Total debates and completion rate
- Practice session count
- Average feedback scores (clarity, logic, persuasiveness)
- Recent debate and practice history