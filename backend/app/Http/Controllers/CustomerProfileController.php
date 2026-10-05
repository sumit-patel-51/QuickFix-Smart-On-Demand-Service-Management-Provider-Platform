<?php

namespace App\Http\Controllers;

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
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'profile_photo' => $user->profile_photo
                    ? asset('storage/' . $user->profile_photo)
                    : null,
                'is_verified' => $user->is_verified,
            ],
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
                'name.required' => 'Full name is required.',

                'email.required' => 'Email address is required.',
                'email.email' => 'Please enter a valid email address.',
                'email.unique' => 'This email is already registered.',

                'phone.required' => 'Phone number is required.',
                'phone.unique' => 'This phone number is already registered.',

                'profile_photo.image' =>
                    'Profile photo must be an image.',

                'profile_photo.max' =>
                    'Profile photo must not exceed 2 MB.',
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user->name = $request->name;
        $user->email = $request->email;
        $user->phone = $request->phone;
        $user->address = $request->address;

        /*
         * Profile Photo
         */
        if ($request->hasFile('profile_photo')) {

            // Delete old image
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

            $path = $request
                ->file('profile_photo')
                ->store('profile_photos', 'public');

            $user->profile_photo = $path;
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'profile_photo' => $user->profile_photo
                    ? asset('storage/' . $user->profile_photo)
                    : null,
                'is_verified' => $user->is_verified,
            ],
        ]);
    }
}
