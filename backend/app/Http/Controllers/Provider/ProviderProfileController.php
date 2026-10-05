<?php

namespace App\Http\Controllers\Provider;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ProviderProfileController extends Controller
{
    /**
     * Get logged-in provider profile
     */
    public function show()
    {
        $user = Auth::user();

        $provider = $user->provider;

        if (!$provider) {
            return response()->json([
                'success' => false,
                'message' => 'Provider profile not found'
            ], 404);
        }

        // Load provider documents
        $provider->load('documents');

        return response()->json([
            'success' => true,
            'message' => 'Provider profile fetched successfully',

            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,

                'profile_image' => $provider->profile_image
                    ? asset('storage/' . $provider->profile_image)
                    : null,

                'rating' => $provider->rating,
                'total_jobs' => $provider->total_jobs,

                'verification_status' => $provider->verification_status,
                'rejection_reason' => $provider->rejection_reason,
                'verified_at' => $provider->verified_at,

                'availability_status' => $provider->availability_status,
                'is_online' => $provider->is_online,

                // Verification Documents
                'documents' => $provider->documents->map(function ($document) {
    return [
        'id' => $document->id,
        'document_type' => $document->document_type,
        'document_number' => $document->document_number,
        'document_file' => $document->document_file
            ? asset('storage/' . $document->document_file)
            : null,
        'status' => $document->status,
        'rejection_reason' => $document->rejection_reason,
        'verified_at' => $document->verified_at,
    ];
}),
            ]
        ]);
    }


    /**
     * Update logged-in provider profile
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        $provider = $user->provider;

        if (!$provider) {
            return response()->json([
                'success' => false,
                'message' => 'Provider profile not found'
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([
            'name' => 'required|string|min:3|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string|max:500',

            'profile_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Update User Information
        |--------------------------------------------------------------------------
        */

        $user->update([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'address' => $validated['address'] ?? null,
        ]);


        /*
        |--------------------------------------------------------------------------
        | Profile Image
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('profile_image')) {

            // Delete old profile image
            if ($provider->profile_image) {
                Storage::disk('public')->delete(
                    $provider->profile_image
                );
            }

            // Store new profile image
            $imagePath = $request->file('profile_image')
                ->store('provider-profiles', 'public');

            // Save image path in database
            $provider->update([
                'profile_image' => $imagePath,
            ]);
        }


        /*
        |--------------------------------------------------------------------------
        | Return Updated Profile
        |--------------------------------------------------------------------------
        */

        // Reload documents
        $provider->load('documents');

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',

            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,

                'profile_image' => $provider->profile_image
                    ? asset('storage/' . $provider->profile_image)
                    : null,

                'rating' => $provider->rating,
                'total_jobs' => $provider->total_jobs,

                'verification_status' => $provider->verification_status,
                'rejection_reason' => $provider->rejection_reason,
                'verified_at' => $provider->verified_at,

                'availability_status' => $provider->availability_status,
                'is_online' => $provider->is_online,

                // Verification Documents
                'documents' => $provider->documents->map(function ($document) {
                    return [
                        'id' => $document->id,
                        'document_type' => $document->document_type,
                        'document_number' => $document->document_number,
                        'document_file' => $document->document_file
                            ? asset('storage/' . $document->document_file)
                            : null,
                        'status' => $document->status,
                        'rejection_reason' => $document->rejection_reason,
                        'verified_at' => $document->verified_at,
                    ];
                }),
            ]
        ]);
    }
}