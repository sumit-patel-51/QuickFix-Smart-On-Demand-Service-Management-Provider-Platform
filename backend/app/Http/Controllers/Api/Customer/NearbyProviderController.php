<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Provider;
use Illuminate\Http\Request;

class NearbyProviderController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | GET NEARBY PROVIDERS
    |--------------------------------------------------------------------------
    |
    | Customer latitude + longitude ke basis par nearby providers find karta hai.
    |
    | Optional:
    | service_id = sirf selected service provide karne wale providers
    |
    */

    public function nearbyProviders(Request $request)
    {
        // --------------------------------------------------
        // VALIDATION
        // --------------------------------------------------

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

            'radius' => [
                'nullable',
                'numeric',
                'min:1',
                'max:100',
            ]
        ]);


        // --------------------------------------------------
        // CUSTOMER LOCATION
        // --------------------------------------------------

        $latitude = $validated['latitude'];

        $longitude = $validated['longitude'];

        $radius = $validated['radius'] ?? 10;

        $serviceId = $validated['service_id'] ?? null;


        // --------------------------------------------------
        // PROVIDER QUERY
        // --------------------------------------------------

        $query = Provider::with([
            'user:id,name,phone',

            'services' => function ($query) {

                $query->select(
                    'services.id',
                    'services.name',
                    'services.category'
                )
                ->wherePivot(
                    'is_active',
                    true
                );

            },
        ])
        ->select('providers.*')


        // --------------------------------------------------
        // DISTANCE CALCULATION
        // --------------------------------------------------

        ->selectRaw(
            '(6371 * acos(
                cos(radians(?))
                * cos(radians(latitude))
                * cos(radians(longitude) - radians(?))
                + sin(radians(?))
                * sin(radians(latitude))
            )) AS distance',
            [
                $latitude,
                $longitude,
                $latitude,
            ]
        )


        // --------------------------------------------------
        // ONLY ONLINE PROVIDERS
        // --------------------------------------------------

        ->where(
            'is_online',
            true
        )


        // --------------------------------------------------
        // ONLY AVAILABLE PROVIDERS
        // --------------------------------------------------

        ->where(
            'availability_status',
            'available'
        )


        // --------------------------------------------------
        // PROVIDER MUST HAVE LOCATION
        // --------------------------------------------------

        ->whereNotNull(
            'latitude'
        )

        ->whereNotNull(
            'longitude'
        );


// --------------------------------------------------
// SERVICE FILTER
// --------------------------------------------------

if ($serviceId) {

    $query->whereExists(function ($subQuery) use ($serviceId) {

        $subQuery
            ->selectRaw('1')
            ->from('provider_services')
            ->whereColumn(
                'provider_services.provider_id',
                'providers.id'
            )
            ->where(
                'provider_services.service_id',
                $serviceId
            )
            ->where(
                'provider_services.is_active',
                true
            );

    });

}




        // --------------------------------------------------
        // DISTANCE + ORDER
        // --------------------------------------------------

        $providers = $query

            ->having(
                'distance',
                '<=',
                $radius
            )

            ->orderBy(
                'distance',
                'asc'
            )

            ->get();


        // --------------------------------------------------
        // RESPONSE
        // --------------------------------------------------

        return response()->json([

            'success' => true,

            'message' =>
                'Nearby providers fetched successfully.',

            'customer_location' => [

                'latitude' =>
                    (float) $latitude,

                'longitude' =>
                    (float) $longitude,

            ],

            'radius' =>
                (float) $radius,

            'service_id' =>
                $serviceId,

            'providers' =>
                $providers->map(
                    function ($provider) {

                        return [

                            'id' =>
                                $provider->id,

                            'name' =>
                                $provider->user->name
                                ?? null,

                            'phone' =>
                                $provider->user->phone
                                ?? null,

                            'latitude' =>
                                (float) $provider->latitude,

                            'longitude' =>
                                (float) $provider->longitude,

                            'distance' =>
                                round(
                                    (float) $provider->distance,
                                    2
                                ),

                            'rating' =>
                                (float) $provider->rating,

                            'availability_status' =>
                                $provider->availability_status,

                            'is_online' =>
                                (bool) $provider->is_online,

                            'services' =>
                                $provider->services,

                        ];

                    }
                ),

        ]);
    }
}

