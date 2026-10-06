<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Provider;
use App\Models\Service;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminServiceRequestController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Admin Check
    |--------------------------------------------------------------------------
    */

    private function checkAdmin()
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'admin') {
            abort(403, 'Unauthorized. Admin access required.');
        }
    }


    /*
    |--------------------------------------------------------------------------
    | Request List
    |--------------------------------------------------------------------------
    */

    public function index(Request $request)
    {
        $this->checkAdmin();

        $query = ServiceRequest::with([
            'customer',
            'provider.user',
            'service',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {

            $search = trim($request->search);

            $query->where(function ($q) use ($search) {

                /*
                | Numeric ID
                */

                if (is_numeric($search)) {
                    $q->orWhere('id', $search);
                }


                /*
                | Customer
                */

                $q->orWhereHas('customer', function ($customer) use ($search) {

                    $customer->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });


                /*
                | Provider
                */

                $q->orWhereHas('provider.user', function ($provider) use ($search) {

                    $provider->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });


                /*
                | Service
                */

                $q->orWhereHas('service', function ($service) use ($search) {

                    $service->where('name', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                });
            });
        }


        /*
        |--------------------------------------------------------------------------
        | Status Filter
        |--------------------------------------------------------------------------
        */

        if ($request->filled('status')) {

            $query->where(
                'status',
                $request->status
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Service Filter
        |--------------------------------------------------------------------------
        */

        if ($request->filled('service_id')) {

            $query->where(
                'service_id',
                $request->service_id
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Provider Filter
        |--------------------------------------------------------------------------
        */

        if ($request->filled('provider_id')) {

            $query->where(
                'provider_id',
                $request->provider_id
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Request Type
        |--------------------------------------------------------------------------
        */

        if ($request->filled('request_type')) {

            $query->where(
                'request_type',
                $request->request_type
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Date From
        |--------------------------------------------------------------------------
        */

        if ($request->filled('date_from')) {

            $query->whereDate(
                'created_at',
                '>=',
                $request->date_from
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Date To
        |--------------------------------------------------------------------------
        */

        if ($request->filled('date_to')) {

            $query->whereDate(
                'created_at',
                '<=',
                $request->date_to
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Minimum Price
        |--------------------------------------------------------------------------
        */

        if ($request->filled('min_price')) {

            $query->whereRaw(
                'COALESCE(final_price, provider_service_price, 0) >= ?',
                [$request->min_price]
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Maximum Price
        |--------------------------------------------------------------------------
        */

        if ($request->filled('max_price')) {

            $query->whereRaw(
                'COALESCE(final_price, provider_service_price, 0) <= ?',
                [$request->max_price]
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Sorting
        |--------------------------------------------------------------------------
        |
        | sort_by:
        | created_at
        | id
        | final_price
        |
        | sort_order:
        | asc
        | desc
        |
        */

        $allowedSorts = [
            'created_at',
            'id',
            'final_price',
        ];

        $sortBy = $request->get(
            'sort_by',
            'created_at'
        );

        $sortOrder = strtolower(
            $request->get(
                'sort_order',
                'desc'
            )
        );

        /*
        | Invalid sort field
        */

        if (!in_array(
            $sortBy,
            $allowedSorts,
            true
        )) {
            $sortBy = 'created_at';
        }


        /*
        | Invalid sort order
        */

        if (!in_array(
            $sortOrder,
            ['asc', 'desc'],
            true
        )) {
            $sortOrder = 'desc';
        }


        /*
        | Amount Sorting
        */

        if ($sortBy === 'final_price') {

            $query->orderByRaw(
                "COALESCE(final_price, provider_service_price, 0) {$sortOrder}"
            );
        } else {

            $query->orderBy(
                $sortBy,
                $sortOrder
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Secondary Sorting
        |--------------------------------------------------------------------------
        |
        | Same values hone par ID se stable ordering.
        |
        */

        if ($sortBy !== 'id') {

            $query->orderBy(
                'id',
                $sortOrder
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        */

        $perPage = (int) (
            $request->get(
                'per_page',
                15
            )
        );

        /*
        | Minimum
        */

        if ($perPage < 1) {
            $perPage = 15;
        }


        /*
        | Maximum 100
        */

        if ($perPage > 100) {
            $perPage = 100;
        }


        $requests = $query
            ->paginate($perPage)
            ->withQueryString();


        /*
        |--------------------------------------------------------------------------
        | Statistics
        |--------------------------------------------------------------------------
        */

        $stats = [

            'total' => ServiceRequest::count(),

            'searching' => ServiceRequest::where(
                'status',
                'searching'
            )->count(),

            'in_progress' => ServiceRequest::whereIn(
                'status',
                [
                    'provider_assigned',
                    'provider_on_the_way',
                    'arrived',
                    'service_started',
                ]
            )->count(),

            'completed' => ServiceRequest::where(
                'status',
                'service_completed'
            )->count(),

            'cancelled' => ServiceRequest::where(
                'status',
                'cancelled'
            )->count(),

            'no_provider_found' => ServiceRequest::where(
                'status',
                'no_provider_found'
            )->count(),
        ];


        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return response()->json([

            'success' => true,

            'stats' => $stats,

            'requests' => $requests,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Filter Options
    |--------------------------------------------------------------------------
    */

    public function options()
    {
        $this->checkAdmin();


        /*
        | Services
        */

        $services = Service::orderBy('name')
            ->get([
                'id',
                'name',
                'category',
            ]);


        /*
        | Approved Providers
        */

        $providers = Provider::with('user')
            ->where(
                'verification_status',
                'approved'
            )
            ->orderBy(
                'id',
                'desc'
            )
            ->get();


        return response()->json([

            'success' => true,

            'services' => $services,

            'providers' => $providers,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Request Details
    |--------------------------------------------------------------------------
    */

    public function show($id)
    {
        $this->checkAdmin();


        $serviceRequest = ServiceRequest::with([

            'customer',

            'provider.user',

            'service',

            'requestProviders.provider.user',

        ])->findOrFail($id);


        return response()->json([

            'success' => true,

            'request' => $serviceRequest,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Cancel Request
    |--------------------------------------------------------------------------
    */

    public function cancel(
        Request $request,
        $id
    ) {
        $this->checkAdmin();


        /*
        | Validation
        */

        $request->validate([

            'reason' => [
                'required',
                'string',
                'min:3',
                'max:1000',
            ],

        ]);


        $serviceRequest =
            ServiceRequest::findOrFail($id);


        /*
        | Already Cancelled
        */

        if (
            $serviceRequest->status ===
            'cancelled'
        ) {

            return response()->json([

                'success' => false,

                'message' =>
                    'Request is already cancelled.',

            ], 422);
        }


        /*
        | Completed
        */

        if (
            $serviceRequest->status ===
            'service_completed'
        ) {

            return response()->json([

                'success' => false,

                'message' =>
                    'Completed request cannot be cancelled.',

            ], 422);
        }


        /*
        | Transaction
        */

        DB::transaction(function () use (
            $serviceRequest,
            $request
        ) {

            /*
            | Cancel Main Request
            */

            $serviceRequest->update([

                'status' => 'cancelled',

                'cancellation_reason' =>
                    trim($request->reason),

            ]);


            /*
            | Cancel Provider Requests
            */

            $serviceRequest
                ->requestProviders()
                ->whereIn(
                    'status',
                    [
                        'pending',
                        'accepted',
                    ]
                )
                ->update([

                    'status' =>
                        'cancelled',

                ]);
        });


        return response()->json([

            'success' => true,

            'message' =>
                'Service request cancelled successfully.',

            'request' =>
                $serviceRequest->fresh([

                    'customer',

                    'provider.user',

                    'service',

                ]),

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Admin Notes / Issue Update
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        $id
    ) {
        $this->checkAdmin();


        /*
        | Validation
        */

        $request->validate([

            'admin_notes' =>
                'nullable|string|max:5000',

            'issue_classification' => [

                'nullable',
                'string',
                'max:100',

            ],

            'issue_status' => [

                'nullable',

                'in:none,open,investigating,resolved',

            ],

        ]);


        $serviceRequest =
            ServiceRequest::findOrFail($id);


        /*
        | Update
        */

        $serviceRequest->update([

            'admin_notes' =>
                $request->admin_notes,

            'issue_classification' =>
                $request->issue_classification,

            'issue_status' =>
                $request->issue_status ?? 'none',

        ]);


        return response()->json([

            'success' => true,

            'message' =>
                'Request information updated successfully.',

            'request' =>
                $serviceRequest->fresh([

                    'customer',

                    'provider.user',

                    'service',

                ]),

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Export CSV
    |--------------------------------------------------------------------------
    */

    public function export(
        Request $request
    ): StreamedResponse {

        $this->checkAdmin();


        $query = ServiceRequest::with([

            'customer',

            'provider.user',

            'service',

        ]);


        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {

            $search = trim(
                $request->search
            );


            $query->where(function ($q) use (
                $search
            ) {

                if (is_numeric($search)) {

                    $q->orWhere(
                        'id',
                        $search
                    );
                }


                /*
                | Customer
                */

                $q->orWhereHas(
                    'customer',
                    function ($customer) use (
                        $search
                    ) {

                        $customer
                            ->where(
                                'name',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'email',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'phone',
                                'like',
                                "%{$search}%"
                            );
                    }
                );


                /*
                | Provider
                */

                $q->orWhereHas(
                    'provider.user',
                    function ($provider) use (
                        $search
                    ) {

                        $provider
                            ->where(
                                'name',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'email',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'phone',
                                'like',
                                "%{$search}%"
                            );
                    }
                );


                /*
                | Service
                */

                $q->orWhereHas(
                    'service',
                    function ($service) use (
                        $search
                    ) {

                        $service
                            ->where(
                                'name',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'category',
                                'like',
                                "%{$search}%"
                            );
                    }
                );
            });
        }


        /*
        |--------------------------------------------------------------------------
        | Status
        |--------------------------------------------------------------------------
        */

        if ($request->filled('status')) {

            $query->where(
                'status',
                $request->status
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Service
        |--------------------------------------------------------------------------
        */

        if ($request->filled('service_id')) {

            $query->where(
                'service_id',
                $request->service_id
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Provider
        |--------------------------------------------------------------------------
        */

        if ($request->filled('provider_id')) {

            $query->where(
                'provider_id',
                $request->provider_id
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Request Type
        |--------------------------------------------------------------------------
        */

        if ($request->filled('request_type')) {

            $query->where(
                'request_type',
                $request->request_type
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Date
        |--------------------------------------------------------------------------
        */

        if ($request->filled('date_from')) {

            $query->whereDate(
                'created_at',
                '>=',
                $request->date_from
            );
        }


        if ($request->filled('date_to')) {

            $query->whereDate(
                'created_at',
                '<=',
                $request->date_to
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Price
        |--------------------------------------------------------------------------
        */

        if ($request->filled('min_price')) {

            $query->whereRaw(
                'COALESCE(final_price, provider_service_price, 0) >= ?',
                [$request->min_price]
            );
        }


        if ($request->filled('max_price')) {

            $query->whereRaw(
                'COALESCE(final_price, provider_service_price, 0) <= ?',
                [$request->max_price]
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Sorting
        |--------------------------------------------------------------------------
        */

        $allowedSorts = [
            'created_at',
            'id',
            'final_price',
        ];


        $sortBy = $request->get(
            'sort_by',
            'created_at'
        );


        $sortOrder = strtolower(
            $request->get(
                'sort_order',
                'desc'
            )
        );


        if (!in_array(
            $sortBy,
            $allowedSorts,
            true
        )) {

            $sortBy = 'created_at';
        }


        if (!in_array(
            $sortOrder,
            ['asc', 'desc'],
            true
        )) {

            $sortOrder = 'desc';
        }


        if ($sortBy === 'final_price') {

            $query->orderByRaw(
                "COALESCE(final_price, provider_service_price, 0) {$sortOrder}"
            );
        } else {

            $query->orderBy(
                $sortBy,
                $sortOrder
            );
        }


        if ($sortBy !== 'id') {

            $query->orderBy(
                'id',
                $sortOrder
            );
        }


        /*
        |--------------------------------------------------------------------------
        | File Name
        |--------------------------------------------------------------------------
        */

        $filename =
            'service_requests_' .
            now()->format(
                'Y_m_d_H_i_s'
            ) .
            '.csv';


        /*
        |--------------------------------------------------------------------------
        | Stream CSV
        |--------------------------------------------------------------------------
        */

        return response()->streamDownload(

            function () use ($query) {

                $handle = fopen(
                    'php://output',
                    'w'
                );


                /*
                | CSV Header
                */

                fputcsv($handle, [

                    'Request ID',

                    'Customer',

                    'Customer Phone',

                    'Service',

                    'Provider',

                    'Provider Phone',

                    'Request Type',

                    'Status',

                    'Service Price',

                    'Extra Charges',

                    'Final Price',

                    'Address',

                    'Created At',

                    'Scheduled At',

                    'Cancellation Reason',

                ]);


                /*
                | Data
                */

                $query->chunk(
                    500,
                    function ($requests) use (
                        $handle
                    ) {

                        foreach (
                            $requests
                            as $serviceRequest
                        ) {

                            fputcsv(
                                $handle,
                                [

                                    /*
                                    | Numeric ID
                                    */

                                    $serviceRequest->id,


                                    /*
                                    | Customer
                                    */

                                    $serviceRequest
                                        ->customer
                                        ->name ?? '',


                                    $serviceRequest
                                        ->customer
                                        ->phone ?? '',


                                    /*
                                    | Service
                                    */

                                    $serviceRequest
                                        ->service
                                        ->name ?? '',


                                    /*
                                    | Provider
                                    */

                                    $serviceRequest
                                        ->provider
                                        ->user
                                        ->name ?? '',


                                    $serviceRequest
                                        ->provider
                                        ->user
                                        ->phone ?? '',


                                    /*
                                    | Request Type
                                    */

                                    ucfirst(
                                        $serviceRequest
                                            ->request_type ?? ''
                                    ),


                                    /*
                                    | Status
                                    */

                                    $serviceRequest
                                        ->status,


                                    /*
                                    | Pricing
                                    */

                                    $serviceRequest
                                        ->provider_service_price,


                                    $serviceRequest
                                        ->extra_charges,


                                    $serviceRequest
                                        ->final_price,


                                    /*
                                    | Address
                                    */

                                    $serviceRequest
                                        ->address,


                                    /*
                                    | Dates
                                    */

                                    optional(
                                        $serviceRequest
                                            ->created_at
                                    )->format(
                                        'Y-m-d H:i:s'
                                    ),


                                    optional(
                                        $serviceRequest
                                            ->scheduled_at
                                    )->format(
                                        'Y-m-d H:i:s'
                                    ),


                                    /*
                                    | Cancellation
                                    */

                                    $serviceRequest
                                        ->cancellation_reason,

                                ]
                            );
                        }
                    }
                );


                fclose($handle);
            },

            $filename,

            [
                'Content-Type' =>
                    'text/csv; charset=UTF-8',
            ]
        );
    }
}