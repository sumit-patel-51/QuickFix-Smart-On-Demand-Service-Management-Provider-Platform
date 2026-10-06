<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class CustomerProfileController extends Controller
{
    /**
     * Get logged-in customer profile
     */
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * Update logged-in customer profile
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make(
            $request->all(),
            [
                'name' => [
                    'required',
                    'string',
                    'max:100',
                ],

                'email' => [
                    'required',
                    'email',
                    'max:150',
                    'unique:users,email,' . $user->id,
                ],

                'phone' => [
                    'required',
                    'string',
                    'max:15',
                    'unique:users,phone,' . $user->id,
                ],

                'address' => [
                    'nullable',
                    'string',
                    'max:500',
                ],

                'profile_photo' => [
                    'nullable',
                    'image',
                    'mimes:jpg,jpeg,png,webp',
                    'max:2048',
                ],
            ],
            [
                'name.required' =>
                    'Full name is required.',

                'email.required' =>
                    'Email address is required.',

                'email.email' =>
                    'Please enter a valid email address.',

                'email.unique' =>
                    'This email is already registered.',

                'phone.required' =>
                    'Phone number is required.',

                'phone.unique' =>
                    'This phone number is already registered.',

                'profile_photo.image' =>
                    'Profile photo must be an image.',

                'profile_photo.mimes' =>
                    'Profile photo must be JPG, JPEG, PNG or WEBP.',

                'profile_photo.max' =>
                    'Profile photo must not exceed 2 MB.',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Update Basic Information
        |--------------------------------------------------------------------------
        */

        $user->name = trim($request->name);
        $user->email = trim($request->email);
        $user->phone = trim($request->phone);
        $user->address = $request->address
            ? trim($request->address)
            : null;

        /*
        |--------------------------------------------------------------------------
        | Profile Photo
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('profile_photo')) {

            /*
             * Delete old profile photo
             */
            if (
                $user->profile_photo &&
                Storage::disk('public')->exists(
                    $user->profile_photo
                )
            ) {
                Storage::disk('public')->delete(
                    $user->profile_photo
                );
            }

            /*
             * Store new profile photo
             *
             * Example:
             * storage/app/public/profile_photos/abc123.jpg
             */
            $path = $request
                ->file('profile_photo')
                ->store('profile_photos', 'public');

            $user->profile_photo = $path;
        }

        /*
        |--------------------------------------------------------------------------
        | Save User
        |--------------------------------------------------------------------------
        */

        $user->save();

        /*
        |--------------------------------------------------------------------------
        | Refresh User
        |--------------------------------------------------------------------------
        */

        $user->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * Format User Response
     *
     * This function is used by both:
     * - show()
     * - update()
     *
     * So the same user structure is returned everywhere.
     */
    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,

            'name' => $user->name,

            'email' => $user->email,

            'phone' => $user->phone,

            'address' => $user->address,

            'role' => $user->role,

            'status' => $user->status,

            'is_verified' => $user->is_verified,

            /*
             * Full profile image URL
             *
             * Example:
             * http://127.0.0.1:8000/storage/profile_photos/abc.jpg
             */
            'profile_photo' => $user->profile_photo
                ? asset('storage/' . $user->profile_photo)
                : null,

            'created_at' => $user->created_at
                ? $user->created_at->toDateTimeString()
                : null,
        ];
    }
}

