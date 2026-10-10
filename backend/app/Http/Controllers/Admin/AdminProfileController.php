<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AdminProfileController extends Controller
{
    /**
     * Get logged-in admin profile
     */
    public function show(Request $request)
    {
        $admin = $request->user();

        if (!$admin || $admin->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        return response()->json([
            'success' => true,

            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'phone' => $admin->phone,
                'address' => $admin->address,

               'profile_photo' => $admin->profile_photo ? 
               asset('storage/' . $admin->profile_photo) : null,

                'role' => $admin->role,
                'status' => $admin->status,
                'is_verified' => (bool) $admin->is_verified,
                'created_at' => $admin->created_at,
            ],
        ]);
    }

    /**
     * Update admin profile
     */
    public function update(Request $request)
    {
        $admin = $request->user();

        if (!$admin || $admin->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:20',
            ],

            'address' => [
                'nullable',
                'string',
                'max:500',
            ],

            'profile_image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please check the entered information.',
                'errors' => $validator->errors(),
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Update Basic Information
        |--------------------------------------------------------------------------
        */

        $admin->name = $request->name;
        $admin->phone = $request->phone;
        $admin->address = $request->address;

        /*
        |--------------------------------------------------------------------------
        | Profile Image
        |--------------------------------------------------------------------------
        */

     if ($request->hasFile('profile_photo')) {

    if (
        $admin->profile_photo &&
        Storage::disk('public')->exists($admin->profile_photo)
    ) {
        Storage::disk('public')->delete($admin->profile_photo);
    }

    $path = $request
        ->file('profile_photo')
        ->store('admin-profiles', 'public');

    $admin->profile_photo = $path;
}

        $admin->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',

            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'phone' => $admin->phone,
                'address' => $admin->address,

               'profile_photo' => $admin->profile_photo
    ? asset('storage/' . $admin->profile_photo)
    : null,

                'role' => $admin->role,
                'status' => $admin->status,
                'is_verified' => (bool) $admin->is_verified,
                'created_at' => $admin->created_at,
            ],
        ]);
    }

    /**
     * Change admin password
     */
    public function changePassword(Request $request)
    {
        $admin = $request->user();

        if (!$admin || $admin->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'current_password' => [
                'required',
                'string',
            ],

            'new_password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please check your password details.',
                'errors' => $validator->errors(),
            ], 422);
        }

        if (!Hash::check(
            $request->current_password,
            $admin->password
        )) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        $admin->password = Hash::make(
            $request->new_password
        );

        $admin->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }
}