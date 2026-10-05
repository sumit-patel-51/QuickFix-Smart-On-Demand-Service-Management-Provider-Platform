<?php
// PATH: app/Http/Controllers/Admin/AdminProviderController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Provider;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class AdminProviderController extends Controller
{
    /**
     * Get all providers with optional filtering
     */
    public function show($id)
{
    try {
        $provider = Provider::with([
            'user',
            'services',
            'documents'
        ])->findOrFail($id);

        foreach ($provider->documents as $document) {
            if ($document->document_file) {

                $path = str_replace(
                    'public/',
                    '',
                    $document->document_file
                );

                $document->document_url =
                    asset('storage/' . $path);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $provider,
        ]);

    } catch (\Exception $e) {

        return response()->json([
            'success' => false,
            'message' => 'Provider not found',
        ], 404);
    }
}

    /**
     * Get all providers with document URLs
     */
    public function index(Request $request)
    {
        try {
            $query = Provider::with(['user', 'services', 'documents']);

            // Search by name or email
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%");
                });
            }

            // Filter by verification status
            if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
                $query->where('verification_status', $request->status);
            }

            // Pagination
            $perPage = $request->input('per_page', 10);
            $providers = $query->paginate($perPage);

            // Add document URLs
            foreach ($providers as $provider) {
                if ($provider->documents) {
                    foreach ($provider->documents as $document) {
                        if ($document->document_file) {
                            $path = str_replace('public/', '', $document->document_file);
                            $document->document_url = asset('storage/' . $path);
                        }
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => $providers,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve providers',
                'error' => $e->getMessage(),
            ], 500);
        }
    }   

    public function viewDocument(Request $request)
{
    $file = $request->query('file');

    if (!$file) {
        return response()->json(['message' => 'No file specified'], 400);
    }

    $path = str_replace('public/', '', $file);

    if (!Storage::disk('public')->exists($path)) {
        return response()->json(['message' => 'File not found'], 404);
    }

    return Storage::disk('public')->response($path);
}

    /**
     * Approve provider
     */
    public function approve(Request $request, $id)
    {
        try {
            $provider = Provider::findOrFail($id);
            
            // Update provider status
            $provider->verification_status = 'approved';
            // $provider->is_verified = true; // REMOVE THIS LINE
            $provider->verified_at = now();
            $provider->verified_by = $request->user()->id;
            $provider->rejection_reason = null;
            $provider->save();

            // Update user's is_verified
            $user = $provider->user;
            if ($user) {
                $user->is_verified = true;
                $user->save();
            }

            // Update all documents to approved
            $provider->documents()->update([
                'status' => 'approved',
                'verified_at' => now(),
                'verified_by' => $request->user()->id,
                'rejection_reason' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Provider approved successfully',
                'data' => $provider,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve provider',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject provider
     */
    public function reject(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $provider = Provider::findOrFail($id);
            
            // Update provider status
            $provider->verification_status = 'rejected';
            // $provider->is_verified = false; // REMOVE THIS LINE
            $provider->rejection_reason = $request->reason;
            $provider->save();

            // Update user's is_verified
            $user = $provider->user;
            if ($user) {
                $user->is_verified = false;
                $user->save();
            }

            // Update all documents to rejected
            $provider->documents()->update([
                'status' => 'rejected',
                'rejection_reason' => $request->reason,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Provider rejected',
                'data' => $provider,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject provider',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}