<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CustomerSettingsController extends Controller
{
    /**
     * Change Customer Password
     *
     * POST /api/customer/settings/change-password
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        // ==========================================
        // CHECK AUTHENTICATED USER
        // ==========================================

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // ==========================================
        // CHECK CUSTOMER ROLE
        // ==========================================

        if ($user->role !== 'customer') {
            return response()->json([
                'success' => false,
                'message' => 'Only customers can change password.',
            ], 403);
        }

        // ==========================================
        // VALIDATION
        // ==========================================

        $validator = Validator::make(
            $request->all(),
            [
                'current_password' => [
                    'required',
                    'string',
                ],

                'new_password' => [
                    'required',
                    'string',
                    'min:8',
                    'confirmed',
                    'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/',
                ],
            ],
            [
                'current_password.required' =>
                    'Current password is required.',

                'new_password.required' =>
                    'New password is required.',

                'new_password.min' =>
                    'New password must be at least 8 characters.',

                'new_password.confirmed' =>
                    'New password and confirmation do not match.',

                'new_password.regex' =>
                    'New password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number.',
            ]
        );

        // ==========================================
        // VALIDATION FAILED
        // ==========================================

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // ==========================================
        // CHECK CURRENT PASSWORD
        // ==========================================

        if (
            !Hash::check(
                $request->current_password,
                $user->password
            )
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        // ==========================================
        // CHECK SAME PASSWORD
        // ==========================================

        if (
            Hash::check(
                $request->new_password,
                $user->password
            )
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'New password must be different from current password.',
            ], 422);
        }

        // ==========================================
        // UPDATE PASSWORD
        // ==========================================

        $user->password = Hash::make(
            $request->new_password
        );

        $user->save();

        // ==========================================
        // IMPORTANT
        // DO NOT DELETE TOKENS
        //
        // Customer remains logged in after
        // changing the password.
        // ==========================================

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ], 200);
    }
}

