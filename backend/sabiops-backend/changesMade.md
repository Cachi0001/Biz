# Changes and Bug Fixes

This document outlines the changes made to the authentication system and the bugs encountered during the process.

## Initial Problem: Foreign Key Constraint Violation

**Issue:** When a new user attempted to register, a `foreign key constraint 


violation` occurred on the `email_verification_tokens` table, specifically related to the `user_id_fkey`. This happened because a user record was created, but the subsequent insertion of the `email_verification_token` failed to correctly reference the newly created user's ID.

## Attempted Fixes and Learnings:

1.  **Initial Python-side Atomicity Attempt:**
    *   **Approach:** Modified the Python `register` endpoint to attempt to create the user and then the token, with a rollback mechanism if token creation failed.
    *   **Outcome:** Unsuccessful. The logs indicated that even with Python-side error handling, the foreign key violation still occurred, and the user was sometimes created before the token insertion failed.
    *   **Learning:** This highlighted that the issue was deeper than just Python-level atomicity; it pointed towards a database-level transaction or visibility problem.

2.  **Introduction of Supabase RPC Function (`register_user_with_token`):**
    *   **Approach:** Created a PostgreSQL stored procedure (`register_user_with_token`) to encapsulate user creation and email token generation within a single, atomic database transaction. The Python `register` endpoint was updated to call this RPC function.
    *   **Outcome:** Initial deployment still showed the foreign key violation, but the logs now clearly indicated the error was originating *within* the RPC function itself. This was a crucial diagnostic step.
    *   **Learning:** This confirmed that the problem was not the RPC approach itself, but rather the specific SQL logic within the RPC function. It also revealed that the Python code was still falling back to the old, problematic logic if the RPC call failed or was not properly configured.

3.  **Refinement of RPC Function and Python Code Cleanup:**
    *   **Approach:**
        *   **RPC Function (`register_user_with_token`):** The SQL function was refined to explicitly generate the `user_id` using `gen_random_uuid()` *before* inserting the user record. This pre-generated `user_id` was then used consistently for both the `users` table insertion and the `email_verification_tokens` table insertion. Added explicit `created_at` and `updated_at` fields.
        *   **Python `auth.py`:** The `register` endpoint was completely refactored to *only* use the RPC function, removing all old, problematic fallback logic. This ensured that the atomic database transaction was always attempted.
    *   **Outcome:** This approach is designed to resolve the foreign key constraint violation by ensuring that the `user_id` is known and valid throughout the atomic operation within the database. The RPC function also includes checks for existing confirmed/unconfirmed emails and phone numbers, and allows for flexible role assignment.

## Current Status:

The `register_user_with_token` RPC function has been updated to handle the `user_id` generation and foreign key relationships more robustly. The Python backend has been streamlined to exclusively use this RPC function for user registration. The expectation is that this will finally resolve the foreign key constraint violation and provide a reliable, atomic registration process.

