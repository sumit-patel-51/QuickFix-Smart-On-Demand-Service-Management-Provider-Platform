<?php

use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminProviderController;
use App\Http\Controllers\Provider\ProviderBookingController;
use App\Http\Controllers\ProviderController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\Customer\ServiceRequestController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerProfileController;
use App\Http\Controllers\ReviewController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Provider\ProviderServiceController;
use App\Http\Controllers\Provider\ProviderServiceRequestController;
use App\Http\Controllers\Provider\ProviderProfileController;

use App\Http\Controllers\Api\Customer\NearbyProviderController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Test authenticated user
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


// Customer Authentication
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);


// Admin Authentication
Route::post('/admin/login', [AuthController::class, 'adminLogin']);


// Provider Authentication
Route::post('/provider/register', [AuthController::class, 'registerProvider']);
Route::post('/provider/login', [AuthController::class, 'loginProvider']);

Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{id}', [ServiceController::class, 'show']);
/*
|--------------------------------------------------------------------------
| Authenticated Customer Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->prefix('customer')->group(function () {

    // Nearby providers
    Route::get(
        '/nearby-providers',
        [NearbyProviderController::class, 'nearbyProviders']
    );


    // Create booking
    Route::post(
        '/service-requests',
        [ServiceRequestController::class, 'store']
    );

    // Customer bookings
    Route::get(
        '/service-requests',
        [ServiceRequestController::class, 'index']
    );

    // Booking detail
    Route::get(
        '/service-requests/{id}',
        [ServiceRequestController::class, 'show']
    );

    Route::post(
        '/service-requests/{id}/approve-price',
        [ServiceRequestController::class, 'approvePrice']
    );

    Route::post(
        '/service-requests/{id}/reject-price',
        [ServiceRequestController::class, 'rejectPrice']
    );


    // Provider Live Location
    Route::get(
        '/service-requests/{id}/provider-location',
        [ServiceRequestController::class, 'providerLocation']
    );



    // Cancel booking
    Route::post(
        '/service-requests/{id}/cancel',
        [ServiceRequestController::class, 'cancel']
    );

    // Customer → Provider Review
    Route::post(
        '/service-requests/{id}/review',
        [ReviewController::class, 'customerReview']
    );
    Route::get(
        '/providers/{providerId}/review-status',
        [ReviewController::class, 'customerProviderReviewStatus']
    );

    // Get provider reviews
    Route::get(
        '/providers/{providerId}/reviews',
        [ReviewController::class, 'providerReviews']
    );

});




//Provider Routes
Route::middleware('auth:sanctum')->prefix('provider')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Provider Service Requests
    |--------------------------------------------------------------------------
    */

    // Get all requests
    Route::get(
        '/service-requests',
        [ProviderServiceRequestController::class, 'index']
    );
    //Get all request of accepted by provider
    Route::get(
        '/service-requests-accepted',
        [ProviderServiceRequestController::class, 'providerAcceptedindex']
    );

    // Get single request
    Route::get(
        '/service-requests/{id}',
        [ProviderServiceRequestController::class, 'show']
    );

    // Accept request
    Route::post(
        '/service-requests/{id}/accept',
        [ProviderServiceRequestController::class, 'accept']
    );


    Route::post(
        '/service-requests/{id}/reject',
        [ProviderServiceRequestController::class, 'reject']
    );


    Route::post(
        '/service-requests/{id}/expire',
        [ProviderServiceRequestController::class, 'expire']
    );


    // Provider → Customer Review
    Route::post(
        '/service-requests/{id}/review',
        [ReviewController::class, 'providerReview']
    );

    Route::get(
        '/customers/{customerId}/review-status',
        [ReviewController::class, 'providerCustomerReviewStatus']
    );

    Route::get(
        '/providers/reviews',
        [ReviewController::class, 'providerReviews']
    );

    /*
    |--------------------------------------------------------------------------
    | Update Service Request Status
    |--------------------------------------------------------------------------
    */

    Route::put(
        '/service-requests/{id}/status',
        [ProviderServiceRequestController::class, 'updateStatus']
    );

    Route::put(
        '/service-requests/{id}/price',
        [ProviderServiceRequestController::class, 'updatePrice']
    );



    /*
    |--------------------------------------------------------------------------
    | Provider Service Selection - Registration
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/select-services',
        [ProviderController::class, 'selectServices']
    );


    /*
    |--------------------------------------------------------------------------
    | Provider My Services
    |--------------------------------------------------------------------------
    */

    // Get available master services
    Route::get(
        '/available-services',
        [ProviderServiceController::class, 'availableServices']
    );

    // Get provider's own services
    Route::get(
        '/services',
        [ProviderServiceController::class, 'index']
    );

    // Add provider service
    Route::post(
        '/services',
        [ProviderServiceController::class, 'store']
    );

    // Get single provider service
    Route::get(
        '/services/{id}',
        [ProviderServiceController::class, 'show']
    );

    // Provider Live Location
    Route::get(
        '/service-requests/{id}/live-location',
        [ProviderServiceRequestController::class, 'liveLocation']
    );

    // Update provider service
    Route::put(
        '/services/{id}',
        [ProviderServiceController::class, 'update']
    );

    // Delete provider service
    Route::delete(
        '/services/{id}',
        [ProviderServiceController::class, 'destroy']
    );


    /*
    |--------------------------------------------------------------------------
    | Provider Documents
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/documents',
        [ProviderController::class, 'uploadDocuments']
    );

    Route::get(
        '/documents',
        [ProviderController::class, 'documents']
    );


    /*
    |--------------------------------------------------------------------------
    | Provider Profile
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/profile',
        [ProviderController::class, 'profile']
    );

    Route::post(
        '/documents/update',
        [ProviderController::class, 'updateDocument']
    );

    // New My Profile API
    Route::get('/my-profile', [
        ProviderProfileController::class,
        'show'
    ]);

    Route::put('/my-profile', [
        ProviderProfileController::class,
        'update'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Provider Dashboard
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/dashboard',
        [ProviderController::class, 'dashboard']
    );

    /*
|--------------------------------------------------------------------------
| Provider Location
|--------------------------------------------------------------------------
*/

    Route::put(
        '/location',
        [ProviderController::class, 'updateLocation']
    );

    /*
    | Provider Online / Offline Status
    |--------------------------------------------------------------------------
    */
    Route::post('/update-status', [ProviderController::class, 'updateStatus']);

    /*
    |--------------------------------------------------------------------------
    | Logout / User
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/logout',
        [AuthController::class, 'logout']
    );

    Route::get(
        '/user',
        [AuthController::class, 'me']
    );


});


/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'admin'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Admin Users
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/admin/users',
        [AdminUserController::class, 'index']
    );

    Route::get(
        '/admin/users/stats',
        [AdminUserController::class, 'stats']
    );

    Route::get(
        '/admin/users/{id}',
        [AdminUserController::class, 'show']
    );

    Route::put(
        '/admin/users/{id}/status',
        [AdminUserController::class, 'updateStatus']
    );

    Route::put(
        '/admin/users/{id}/verify',
        [AdminUserController::class, 'updateVerification']
    );

    Route::delete(
        '/admin/users/{id}',
        [AdminUserController::class, 'destroy']
    );


    /*
    |--------------------------------------------------------------------------
    | Admin Providers
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/admin/providers',
        [AdminProviderController::class, 'index']
    );

    Route::get(
        '/admin/providers/{id}',
        [AdminProviderController::class, 'show']
    );

    Route::post(
        '/admin/providers/{id}/approve',
        [AdminProviderController::class, 'approve']
    );

    Route::post(
        '/admin/providers/{id}/reject',
        [AdminProviderController::class, 'reject']
    );

    Route::middleware(['auth:sanctum', 'admin'])->get(
        '/documents/view',
        [AdminProviderController::class, 'viewDocument']
    );
});