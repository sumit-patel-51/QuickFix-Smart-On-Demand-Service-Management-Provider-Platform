<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class AdminUserController extends Controller
{
    /**
     * Check if user is admin
     */
    private function checkAdmin(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.',
            ], 403);
        }
        return null;
    }

    /**
     * Get all users with optional filtering (only customers)
     */
    public function index(Request $request)
    {
        // Check if user is admin
        $adminCheck = $this->checkAdmin($request);
        if ($adminCheck) {
            return $adminCheck;
        }

        try {
            $query = User::where('role', 'customer');

            // Search by name or email
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%")
                      ->orWhere('phone', 'LIKE', "%{$search}%");
                });
            }

            // Filter by status
            if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Filter by role
            if ($request->has('role') && !empty($request->role) && $request->role !== 'all') {
                $query->where('role', $request->role);
            }

            // Sort
            $sortField = $request->input('sort', 'created_at');
            $sortDirection = $request->input('direction', 'desc');
            $query->orderBy($sortField, $sortDirection);

            // Pagination
            $perPage = $request->input('per_page', 10);
            $users = $query->paginate($perPage);

            // Format response
            $formattedUsers = $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'role' => $user->role,
                    'status' => $user->status,
                    'is_verified' => (bool) $user->is_verified,
                    'profile_photo' => $user->profile_photo ? asset('storage/' . $user->profile_photo) : null,
                    'bookings_count' => $user->serviceRequests()->count(),
                    'created_at' => $user->created_at->format('Y-m-d'),
                    'updated_at' => $user->updated_at->format('Y-m-d H:i:s'),
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Customers retrieved successfully',
                'data' => $formattedUsers,
                'pagination' => [
                    'total' => $users->total(),
                    'per_page' => $users->perPage(),
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'from' => $users->firstItem(),
                    'to' => $users->lastItem(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve customers',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get single user details
     */
    public function show(Request $request, $id)
    {
        // Check if user is admin
        $adminCheck = $this->checkAdmin($request);
        if ($adminCheck) {
            return $adminCheck;
        }

        try {
            $user = User::where('role', 'customer')->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Customer retrieved successfully',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'role' => $user->role,
                    'status' => $user->status,
                    'is_verified' => (bool) $user->is_verified,
                    'profile_photo' => $user->profile_photo ? asset('storage/' . $user->profile_photo) : null,
                    'bookings_count' => $user->serviceRequests()->count(),
                    'created_at' => $user->created_at->format('Y-m-d'),
                    'updated_at' => $user->updated_at->format('Y-m-d H:i:s'),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }
    }

    /**
     * Update user status (Active/Inactive/Suspended)
     */
    public function updateStatus(Request $request, $id)
    {
        // Check if user is admin
        $adminCheck = $this->checkAdmin($request);
        if ($adminCheck) {
            return $adminCheck;
        }

        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:active,inactive,suspended',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = User::where('role', 'customer')->findOrFail($id);
            $user->status = $request->status;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Customer status updated successfully',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'status' => $user->status,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update customer status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update user verification status
     */
    public function updateVerification(Request $request, $id)
    {
        // Check if user is admin
        $adminCheck = $this->checkAdmin($request);
        if ($adminCheck) {
            return $adminCheck;
        }

        try {
            $validator = Validator::make($request->all(), [
                'is_verified' => 'required|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = User::where('role', 'customer')->findOrFail($id);
            $user->is_verified = $request->is_verified;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Customer verification status updated successfully',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'is_verified' => (bool) $user->is_verified,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update verification status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete user
     */
    public function destroy(Request $request, $id)
    {
        // Check if user is admin
        $adminCheck = $this->checkAdmin($request);
        if ($adminCheck) {
            return $adminCheck;
        }

        try {
            $user = User::where('role', 'customer')->findOrFail($id);

            // Delete profile photo if exists
            if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
                Storage::disk('public')->delete($user->profile_photo);
            }

            // Delete related data (bookings, requests, etc.)
            $user->serviceRequests()->delete();

            // Delete user
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'Customer deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete customer',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user statistics
     */
    public function stats(Request $request)
    {
        // Check if user is admin
        $adminCheck = $this->checkAdmin($request);
        if ($adminCheck) {
            return $adminCheck;
        }

        try {
            $total = User::where('role', 'customer')->count();
            $active = User::where('role', 'customer')->where('status', 'active')->count();
            $inactive = User::where('role', 'customer')->where('status', 'inactive')->count();
            $suspended = User::where('role', 'customer')->where('status', 'suspended')->count();
            $verified = User::where('role', 'customer')->where('is_verified', true)->count();
            $unverified = User::where('role', 'customer')->where('is_verified', false)->count();

            // New users this month
            $newThisMonth = User::where('role', 'customer')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'active' => $active,
                    'inactive' => $inactive,
                    'suspended' => $suspended,
                    'verified' => $verified,
                    'unverified' => $unverified,
                    'new_this_month' => $newThisMonth,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}