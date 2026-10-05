<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Provider;
use App\Models\ServiceRequest;
use App\Models\ServiceRequestProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ServiceRequestController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | CREATE SERVICE REQUEST
    |--------------------------------------------------------------------------
    |
    | Customer creates a request without selecting a provider.
    |
    | QuickFix automatically finds nearby providers who:
    |
    | 1. Provide the selected service
    | 2. Are verified
    | 3. Are online
    | 4. Are available
    | 5. Are within 5 KM
    |
    */

    public function store(Request $request)
   {
        $customer = Auth::user();

        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([

            'service_id' => [
                'required',
                'integer',
                'exists:services,id',
            ],

            'address' => [
                'required',
                'string',
                'max:500',
            ],

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

            'problem_description' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'request_type' => [
                'required',
                Rule::in([
                    'now',
                    'scheduled',
                ]),
            ],

            'scheduled_at' => [
                'nullable',
                'date',
                'after:now',
            ],
        ]);


        /*
        |--------------------------------------------------------------------------
        | SCHEDULED VALIDATION
        |--------------------------------------------------------------------------
        */

        if (
            $validated['request_type'] === 'scheduled'
            && empty($validated['scheduled_at'])
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Scheduled date and time is required.',
            ], 422);
        }


        /*
        |--------------------------------------------------------------------------
        | NOW REQUEST
        |--------------------------------------------------------------------------
        */

        if ($validated['request_type'] === 'now') {

            $validated['scheduled_at'] = null;
        }


        /*
        |--------------------------------------------------------------------------
        | FIND NEARBY PROVIDERS
        |--------------------------------------------------------------------------
        */

        $providers = Provider::query()
            ->where('verification_status', 'verified')
            ->where('is_online', true)
            ->where('availability_status', 'available')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')

            // Provider provides selected service
            ->whereHas('services', function ($query) use ($validated) {
                $query
                    ->where('services.id', $validated['service_id'])
                    ->where('provider_services.is_active', true);
            })

            // Calculate distance in KM
            ->select('providers.*')
            ->selectRaw(
                '(6371 * acos(
                LEAST(1, GREATEST(-1,
                    cos(radians(?))
                    * cos(radians(latitude))
                    * cos(radians(longitude) - radians(?))
                    + sin(radians(?))
                    * sin(radians(latitude))
                ))
            )) AS distance',
                [
                    $validated['latitude'],
                    $validated['longitude'],
                    $validated['latitude'],
                ]
            )

            // Only providers within 5 KM
            ->having('distance', '<=', 5)

            // Nearest providers first
            ->orderBy('distance', 'asc')

            ->get();

        // ---------------------------------------------
        // CREATE SERVICE REQUEST
        // ---------------------------------------------

        $serviceRequest = ServiceRequest::create([
            'customer_id' => $customer->id,

            // No provider selected initially
            'provider_id' => null,

            'service_id' => $validated['service_id'],

            'address' => $validated['address'],

            'latitude' => $validated['latitude'],

            'longitude' => $validated['longitude'],

            'problem_description' =>
                $validated['problem_description'] ?? null,

            'request_type' =>
                $validated['request_type'],

            'scheduled_at' =>
                $validated['scheduled_at'],

            'status' => 'searching',
        ]);

        // ---------------------------------------------
        // SEND REQUEST TO MATCHING PROVIDERS
        // ---------------------------------------------

        foreach ($providers as $provider) {
            ServiceRequestProvider::create([
                'service_request_id' => $serviceRequest->id,
                'provider_id' => $provider->id,
                'status' => 'pending',
            ]);
        }

        // ---------------------------------------------
        // LOAD RELATED DATA
        // ---------------------------------------------

        $serviceRequest->load([
            'service',
            'customer',
        ]);

        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        if ($providers->count() === 0) {
            return response()->json([
                'success' => true,
                'message' =>
                    'Request created, but no nearby providers are currently available.',
                'service_request' => $serviceRequest,
                'nearby_providers_count' => 0,
            ], 201);
        }

        return response()->json([
            'success' => true,
            'message' =>
                'Service request sent to nearby providers.',
            'service_request' => $serviceRequest,
            'nearby_providers_count' => $providers->count(),
        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | CUSTOMER REQUEST LIST
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        $customer = Auth::user();

        $requests = ServiceRequest::with([
            'service',
            'provider',
        ])
            ->where(
                'customer_id',
                $customer->id
            )
            ->latest()
            ->get();

        return response()->json([

            'success' => true,

            'service_requests' =>
                $requests,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CUSTOMER REQUEST DETAIL
    |--------------------------------------------------------------------------
    */

    public function show($id)
    {
        $customer = Auth::user();

        $serviceRequest =
            ServiceRequest::with([
                'service',
                'customer',
                'provider',
            ])
                ->where(
                    'customer_id',
                    $customer->id
                )
                ->find($id);

        if (!$serviceRequest) {

            return response()->json([

                'success' => false,

                'message' =>
                    'Service request not found.',

            ], 404);
        }

        return response()->json([

            'success' => true,

            'service_request' =>
                $serviceRequest,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CANCEL REQUEST
    |--------------------------------------------------------------------------
    */

    public function cancel($id)
    {
        $customer = Auth::user();

        $serviceRequest =
            ServiceRequest::where(
                'customer_id',
                $customer->id
            )
                ->find($id);

        if (!$serviceRequest) {

            return response()->json([

                'success' => false,

                'message' =>
                    'Service request not found.',

            ], 404);
        }


        /*
        |--------------------------------------------------------------------------
        | CHECK STATUS
        |--------------------------------------------------------------------------
        */

        if (
            $serviceRequest->status ===
            'service_completed'
            ||
            $serviceRequest->status ===
            'cancelled'
        ) {

            return response()->json([

                'success' => false,

                'message' =>
                    'This request cannot be cancelled.',

            ], 422);
        }


        /*
        |--------------------------------------------------------------------------
        | CANCEL
        |--------------------------------------------------------------------------
        */

        $serviceRequest->update([

            'status' =>
                'cancelled',

        ]);


        return response()->json([

            'success' => true,

            'message' =>
                'Service request cancelled successfully.',

            'service_request' =>
                $serviceRequest,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | PROVIDER LIVE LOCATION
    |--------------------------------------------------------------------------
    */

    public function providerLocation($id)
    {
        $customer = Auth::user();

        $serviceRequest =
            ServiceRequest::with('provider')
                ->where(
                    'id',
                    $id
                )
                ->where(
                    'customer_id',
                    $customer->id
                )
                ->first();

        if (!$serviceRequest) {

            return response()->json([

                'success' => false,

                'message' =>
                    'Service request not found.',

            ], 404);
        }


        /*
        |--------------------------------------------------------------------------
        | PROVIDER NOT ASSIGNED
        |--------------------------------------------------------------------------
        */

        if (!$serviceRequest->provider) {

            return response()->json([

                'success' => true,

                'provider_location' => null,

                'message' =>
                    'Provider is not assigned yet.',

            ]);
        }


        return response()->json([

            'success' => true,

            'provider_location' => [

                'provider_id' =>
                    $serviceRequest->provider->id,

                'latitude' =>
                    $serviceRequest->provider->latitude,

                'longitude' =>
                    $serviceRequest->provider->longitude,

                'is_online' =>
                    $serviceRequest->provider->is_online,

                'availability_status' =>
                    $serviceRequest->provider->availability_status,

            ],

            'request_status' =>
                $serviceRequest->status,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | APPROVE FINAL PRICE
    |--------------------------------------------------------------------------
    */

    public function approvePrice($id)
    {
        $customer = Auth::user();

        $serviceRequest =
            ServiceRequest::where(
                'id',
                $id
            )
                ->where(
                    'customer_id',
                    $customer->id
                )
                ->first();

        if (!$serviceRequest) {

            return response()->json([

                'success' => false,

                'message' =>
                    'Service request not found.',

            ], 404);
        }


        if (
            $serviceRequest->price_status !==
            'pending'
        ) {

            return response()->json([

                'success' => false,

                'message' =>
                    'There is no pending price for approval.',

            ], 422);
        }


        $serviceRequest->update([

            'price_status' =>
                'approved',

        ]);


        $serviceRequest->load([
            'service',
            'provider',
        ]);


        return response()->json([

            'success' => true,

            'message' =>
                'Final price approved successfully.',

            'service_request' =>
                $serviceRequest,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | REJECT FINAL PRICE
    |--------------------------------------------------------------------------
    */

    public function rejectPrice($id)
    {
        $customer = Auth::user();

        $serviceRequest =
            ServiceRequest::where(
                'id',
                $id
            )
                ->where(
                    'customer_id',
                    $customer->id
                )
                ->first();

        if (!$serviceRequest) {

            return response()->json([

                'success' => false,

                'message' =>
                    'Service request not found.',

            ], 404);
        }


        if (
            $serviceRequest->price_status !==
            'pending'
        ) {

            return response()->json([

                'success' => false,

                'message' =>
                    'There is no pending price to reject.',

            ], 422);
        }


        $serviceRequest->update([

            'price_status' =>
                'rejected',

        ]);


        $serviceRequest->load([
            'service',
            'provider',
        ]);


        return response()->json([

            'success' => true,

            'message' =>
                'Final price rejected.',

            'service_request' =>
                $serviceRequest,

        ]);
    }
}
