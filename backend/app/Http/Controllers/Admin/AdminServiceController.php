<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminServiceController extends Controller
{
    // Get all services with search, filters and sorting
    public function index(Request $request)
    {
        $query = Service::query();

        // Search
        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // Status filter
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        // Sorting
        $allowedSorts = [
            'name',
            'category',
            'base_price',
            'created_at',
        ];

        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');

        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }

        if (!in_array($sortOrder, ['asc', 'desc'])) {
            $sortOrder = 'desc';
        }

        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = (int) $request->get('per_page', 10);
        $perPage = min(max($perPage, 1), 100);

        $services = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Services fetched successfully',
            'data' => $services,
        ]);
    }

    // Dashboard statistics
    public function stats()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total' => Service::count(),

                'active' => Service::where(
                    'is_active',
                    true
                )->count(),

                'inactive' => Service::where(
                    'is_active',
                    false
                )->count(),

                'categories' => Service::query()
                    ->whereNotNull('category')
                    ->where('category', '!=', '')
                    ->distinct('category')
                    ->count('category'),
            ],
        ]);
    }

    // Get unique categories
    public function categories()
    {
        $categories = Service::query()
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    // Add service
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:services,name',
            ],
            'category' => [
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
                'max:2000',
            ],
            'base_price' => [
                'required',
                'numeric',
                'min:0',
                'max:99999999.99',
            ],
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $service = Service::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service created successfully',
            'data' => $service,
        ], 201);
    }

    // Get single service
    public function show($id)
    {
        $service = Service::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $service,
        ]);
    }

    // Update service
    public function update(Request $request, $id)
    {
        $service = Service::findOrFail($id);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('services', 'name')->ignore($service->id),
            ],
            'category' => [
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
                'max:2000',
            ],
            'base_price' => [
                'required',
                'numeric',
                'min:0',
                'max:99999999.99',
            ],
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $service->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully',
            'data' => $service->fresh(),
        ]);
    }

    // Activate / Deactivate service
    public function toggleStatus($id)
    {
        $service = Service::findOrFail($id);

        $service->is_active = !$service->is_active;
        $service->save();

        return response()->json([
            'success' => true,
            'message' => $service->is_active
                ? 'Service activated successfully'
                : 'Service deactivated successfully',
            'data' => $service,
        ]);
    }

    // Delete service
    public function destroy($id)
    {
        $service = Service::findOrFail($id);

        // Prevent deletion if service has existing requests
        if ($service->serviceRequests()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This service has existing requests. Deactivate it instead of deleting.',
            ], 422);
        }

        // Prevent deletion if linked with providers
        if ($service->providers()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This service is linked with providers. Deactivate it instead of deleting.',
            ], 422);
        }

        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service deleted successfully',
        ]);
    }
}