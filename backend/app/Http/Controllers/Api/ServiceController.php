<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;

class ServiceController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | GET ALL SERVICES
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        $services = Service::where('is_active', true)
            ->withCount([
                'providers as providers_count' => function ($query) {
                    $query->where('provider_services.is_active', true);
                }
            ])
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'services' => $services,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | GET SINGLE SERVICE + PROVIDERS
    |--------------------------------------------------------------------------
    */

    public function show($id)
{
    $service = Service::where('is_active', true)
        ->with([
            'providers' => function ($query) {
                $query
                    ->where('providers.verification_status', 'approved')
                    ->where('provider_services.is_active', true)
                    ->with('user:id,name,email,profile_photo');
            }
        ])
        ->withCount([
            'providers as providers_count' => function ($query) {
                $query
                    ->where('providers.verification_status', 'approved')
                    ->where('provider_services.is_active', true);
            }
        ])
        ->find($id);

    if (!$service) {
        return response()->json([
            'success' => false,
            'message' => 'Service not found.',
        ], 404);
    }

    return response()->json([
        'success' => true,
        'service' => $service,
    ]);
}
}

