<?php
// PATH: app/Http/Controllers/ProviderController.php

namespace App\Http\Controllers;

use App\Models\Provider;
use App\Models\ProviderDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProviderController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | SELECT SERVICES
    |--------------------------------------------------------------------------
    */

   public function selectServices(Request $request)
{
    $validated = $request->validate([
        'user_id' => 'required|exists:users,id',
        'service_ids' => 'required|array|min:1',
        'service_ids.*' => 'integer|exists:services,id',
    ]);

    $provider = Provider::where(
        'user_id',
        $validated['user_id']
    )->firstOrFail();

    $syncData = [];

    foreach ($validated['service_ids'] as $serviceId) {
        $syncData[$serviceId] = [
            'price' => 0,
            'experience' => 0,
            'service_area' => 'Not specified',
            'is_active' => true,
        ];
    }

    $provider->services()->sync($syncData);

    return response()->json([
        'success' => true,
        'message' => 'Services selected successfully.',
        'services' => $provider->services,
    ]);
}

    /*
    |--------------------------------------------------------------------------
    | UPLOAD DOCUMENT
    |--------------------------------------------------------------------------
    */

    public function uploadDocuments(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'document_type' => 'required|string|max:100',
            'document_number' => 'nullable|string|max:100',
            'file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $provider = Provider::where(
            'user_id',
            $validated['user_id']
        )->firstOrFail();

        // Store document
        $path = $request
            ->file('file')
            ->store('provider-documents', 'public');

        // Create document
        $document = $provider->documents()->create([
            'document_type' => $validated['document_type'],
            'document_number' => $validated['document_number'] ?? null,
            'document_file' => $path,
            'status' => 'pending',
        ]);

        // Update provider verification - REMOVED is_verified
        $provider->verification_status = 'pending';
        // $provider->is_verified = false; // REMOVE THIS LINE
        $provider->save();

        // Also update user's is_verified if needed
        $user = $provider->user;
        if ($user) {
            $user->is_verified = false;
            $user->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded successfully.',
            'document' => $document,
        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | PROVIDER DASHBOARD
    |--------------------------------------------------------------------------
    */

    public function dashboard(Request $request)
    {
        $user = $request->user();

        $provider = Provider::with([
            'user',
            'services',
            'documents',
        ])
        ->where('user_id', $user->id)
        ->firstOrFail();

        return response()->json([
            'success' => true,
            'provider' => [
                'id' => $provider->id,
                'name' => $provider->user->name,
                'phone' => $provider->user->phone,
                'profile_image' => $provider->profile_image,
                'verification_status' => $provider->verification_status,
                'is_online' => $provider->is_online,
                'availability_status' => $provider->availability_status,
                'latitude' => $provider->latitude,
                'longitude' => $provider->longitude,
                'rating' => $provider->rating,
                'total_jobs' => $provider->total_jobs,
                'services' => $provider->services,
                'documents' => $provider->documents,
                'rejection_reason' => $provider->rejection_reason,
            ],
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | PROVIDER PROFILE
    |--------------------------------------------------------------------------
    */

    public function profile(Request $request)
    {
        $user = $request->user();

        $provider = Provider::with([
            'user:id,name,email,phone,address,role,status',
            'services:id,name,category',
            'documents',
        ])
        ->where('user_id', $user->id)
        ->first();

        if (!$provider) {
            return response()->json([
                'success' => false,
                'message' => 'Provider profile not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'provider' => $provider,
            ],
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | GET PROVIDER DOCUMENT
    |--------------------------------------------------------------------------
    */

    public function documents(Request $request)
    {
        $user = $request->user();

        $provider = Provider::where(
            'user_id',
            $user->id
        )->first();

        if (!$provider) {
            return response()->json([
                'success' => false,
                'message' => 'Provider profile not found.',
            ], 404);
        }

        $document = $provider
            ->documents()
            ->latest()
            ->first();

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'No verification document found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'document' => $document,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE REJECTED DOCUMENT
    |--------------------------------------------------------------------------
    */

    public function updateDocument(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $provider = Provider::where(
            'user_id',
            $user->id
        )->first();

        if (!$provider) {
            return response()->json([
                'success' => false,
                'message' => 'Provider profile not found.',
            ], 404);
        }

        // Only rejected provider can update
        if ($provider->verification_status !== 'rejected') {
            return response()->json([
                'success' => false,
                'message' => 'Document can only be updated after rejection.',
            ], 422);
        }

        // Validation
        $validated = $request->validate([
            'document_id' => 'required|integer|exists:provider_documents,id',
            'document_type' => 'required|string|max:100',
            'document_number' => 'nullable|string|max:100',
            'file' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        // Get document belonging to this provider
        $document = $provider
            ->documents()
            ->where('id', $validated['document_id'])
            ->first();

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Verification document not found.',
            ], 404);
        }

        // Replace file if new file uploaded
        if ($request->hasFile('file')) {
            // Delete old file
            if (
                $document->document_file &&
                Storage::disk('public')->exists($document->document_file)
            ) {
                Storage::disk('public')->delete($document->document_file);
            }

            // Store new file
            $path = $request
                ->file('file')
                ->store('provider-documents', 'public');

            $document->document_file = $path;
        }

        // Update document information
        $document->document_type = $validated['document_type'];
        $document->document_number = $validated['document_number'] ?? null;
        $document->status = 'pending';
        $document->rejection_reason = null;
        $document->save();

        // Reset provider verification - REMOVED is_verified
        $provider->verification_status = 'pending';
        // $provider->is_verified = false; // REMOVE THIS LINE
        $provider->rejection_reason = null;
        $provider->save();

        // Also update user's is_verified
        $user = $provider->user;
        if ($user) {
            $user->is_verified = false;
            $user->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Document updated successfully. Your verification is pending again.',
            'document' => $document,
            'provider' => $provider,
        ]);
    }

    /**
 * Update Provider Current Location
 */
public function updateLocation(Request $request)
{
    // Validate location data
    $validated = $request->validate([
        'latitude' => [
            'required',
            'numeric',
            'between:-90,90',
        ],

        'longitude' => [
            'required',
            'numeric',
            'between:-180,180',
        ],

        'is_online' => [
            'nullable',
            'boolean',
        ],
    ]);

    // Get authenticated provider
    $provider = Provider::where(
        'user_id',
        $request->user()->id
    )->first();

    // Provider profile not found
    if (!$provider) {
        return response()->json([
            'success' => false,
            'message' => 'Provider profile not found.',
        ], 404);
    }

    // Update location
    $provider->latitude = $validated['latitude'];
    $provider->longitude = $validated['longitude'];

    // Update online status if provided
    if (array_key_exists('is_online', $validated)) {
        $provider->is_online = $validated['is_online'];

        $provider->availability_status =
            $validated['is_online']
                ? 'online'
                : 'offline';
    }

    $provider->save();

    return response()->json([
        'success' => true,
        'message' => 'Provider location updated successfully.',
        'provider' => [
            'id' => $provider->id,
            'latitude' => $provider->latitude,
            'longitude' => $provider->longitude,
            'is_online' => $provider->is_online,
            'availability_status' => $provider->availability_status,
        ],
    ]);
}

/*
|--------------------------------------------------------------------------
| UPDATE PROVIDER ONLINE / OFFLINE STATUS
|--------------------------------------------------------------------------
*/

public function updateStatus(Request $request)
{
    $validated = $request->validate([
        'is_online' => [
            'required',
            'boolean',
        ],
    ]);

    // Get authenticated provider
    $provider = Provider::where(
        'user_id',
        $request->user()->id
    )->first();

    // Provider not found
    if (!$provider) {
        return response()->json([
            'success' => false,
            'message' => 'Provider profile not found.',
        ], 404);
    }

    // Update online status
    $provider->is_online = $validated['is_online'];

    // Update availability status
    if ($validated['is_online']) {
        $provider->availability_status = 'available';
    } else {
        $provider->availability_status = 'offline';
    }

    $provider->save();

    return response()->json([
        'success' => true,

        'message' => $validated['is_online']
            ? 'Provider is now online.'
            : 'Provider is now offline.',

        'provider' => [
            'id' => $provider->id,
            'is_online' => (bool) $provider->is_online,
            'availability_status' => $provider->availability_status,
        ],
    ]);
}
}