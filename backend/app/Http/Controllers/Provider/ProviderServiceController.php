<?php

namespace App\Http\Controllers\Provider;

use App\Http\Controllers\Controller;
use App\Models\ProviderService;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ProviderServiceController extends Controller
{
    /**
     * Get logged-in provider services
     */
  public function index()
{
    $provider = Auth::user()->provider;

    $services = ProviderService::with('service')
        ->where('provider_id', $provider->id)
        ->latest()
        ->get();

    $services->transform(function ($item) {
        if ($item->service_image) {
            $item->service_image = asset(
                'storage/' . $item->service_image
            );
        }

        return $item;
    });

    return response()->json([
        'success' => true,
        'services' => $services
    ]);
}


    /**
     * Add new provider service
     */
    public function store(Request $request)
    {
        $provider = Auth::user()->provider;

        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'price' => 'required|numeric|min:0',
            'experience' => 'nullable|integer|min:0',
            'service_area' => 'required|string|max:255',
            'service_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'is_active' => 'nullable|boolean',
        ]);

        // Check duplicate service
        $exists = ProviderService::where(
            'provider_id',
            $provider->id
        )
        ->where(
            'service_id',
            $validated['service_id']
        )
        ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'This service is already added.'
            ], 422);
        }

        // Upload image
        if ($request->hasFile('service_image')) {

            $validated['service_image'] =
                $request->file('service_image')
                    ->store('provider-services', 'public');
        }

        $validated['provider_id'] = $provider->id;

        if (!isset($validated['is_active'])) {
            $validated['is_active'] = true;
        }

        $providerService = ProviderService::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service added successfully.',
            'service' => $providerService->load('service')
        ], 201);
    }


    /**
     * Get single provider service
     */
    public function show($id)
    {
        $provider = Auth::user()->provider;

        $service = ProviderService::with('service')
            ->where('provider_id', $provider->id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'service' => $service
        ]);
    }


    /**
     * Update provider service
     */
    public function update(Request $request, $id)
    {
        $provider = Auth::user()->provider;

        $providerService = ProviderService::where(
            'provider_id',
            $provider->id
        )->findOrFail($id);

        $validated = $request->validate([
            'price' => 'required|numeric|min:0',
            'experience' => 'nullable|integer|min:0',
            'service_area' => 'required|string|max:255',
            'service_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'is_active' => 'nullable|boolean',
        ]);

        // New image
        if ($request->hasFile('service_image')) {

            if ($providerService->service_image) {
                Storage::disk('public')->delete(
                    $providerService->service_image
                );
            }

            $validated['service_image'] =
                $request->file('service_image')
                    ->store('provider-services', 'public');
        }

        $providerService->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully.',
            'service' => $providerService->load('service')
        ]);
    }


    /**
     * Delete provider service
     */
    public function destroy($id)
    {
        $provider = Auth::user()->provider;

        $providerService = ProviderService::where(
            'provider_id',
            $provider->id
        )->findOrFail($id);

        if ($providerService->service_image) {
            Storage::disk('public')->delete(
                $providerService->service_image
            );
        }

        $providerService->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service deleted successfully.'
        ]);
    }


    /**
     * Get active master services for provider selection
     */
    public function availableServices()
    {
        $services = Service::where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'category',
                'description',
                'base_price'
            ]);

        return response()->json([
            'success' => true,
            'services' => $services
        ]);
    }
}