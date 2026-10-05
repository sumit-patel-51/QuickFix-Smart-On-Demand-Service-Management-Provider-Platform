<?php

namespace App\Http\Controllers;

use App\Models\Provider;
use App\Models\Review;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Customer → Provider Review
    |--------------------------------------------------------------------------
    */

    public function customerReview(Request $request, $serviceRequestId)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        // Find completed service request
        $serviceRequest = ServiceRequest::where('id', $serviceRequestId)
            ->where('customer_id', $user->id)
            ->where('status', 'service_completed')
            ->first();

        if (!$serviceRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Completed service request not found.',
            ], 404);
        }

        // Provider must be assigned
        if (!$serviceRequest->provider_id) {
            return response()->json([
                'success' => false,
                'message' => 'No provider is assigned to this request.',
            ], 422);
        }

        // Get provider
        $provider = $serviceRequest->provider;

        if (!$provider) {
            return response()->json([
                'success' => false,
                'message' => 'Provider not found.',
            ], 404);
        }

        // Provider's users.id
        $providerUserId = $provider->user_id;

        /*
        |--------------------------------------------------------------------------
        | Check if customer already rated this provider
        |--------------------------------------------------------------------------
        */

        $existingReview = Review::where('reviewer_id', $user->id)
            ->where('reviewee_id', $providerUserId)
            ->where('reviewer_role', 'customer')
            ->exists();

        if ($existingReview) {
            return response()->json([
                'success' => false,
                'message' => 'You have already rated this provider.',
            ], 409);
        }

        /*
        |--------------------------------------------------------------------------
        | Create Review
        |--------------------------------------------------------------------------
        */

        DB::transaction(function () use ($serviceRequest, $user, $validated, $provider, $providerUserId) {

            Review::create([
                'service_request_id' => $serviceRequest->id,
                'reviewer_id' => $user->id,
                'reviewee_id' => $providerUserId,
                'reviewer_role' => 'customer',
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Update Provider Average Rating
            |--------------------------------------------------------------------------
            */

            $averageRating = Review::where(
                'reviewee_id',
                $providerUserId
            )
                ->where('reviewer_role', 'customer')
                ->avg('rating');

            $provider->update([
                'rating' => round($averageRating, 2),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully.',
        ], 201);
    }

    public function customerProviderReviewStatus($providerId)
    {
        $user = Auth::user();

        $provider = Provider::find($providerId);

        if (!$provider) {
            return response()->json([
                'success' => false,
                'message' => 'Provider not found.',
                'id' => $providerId
            ], 404);
        }

        $review = Review::where('reviewer_id', $user->id)
            ->where('reviewee_id', $provider->user_id)
            ->where('reviewer_role', 'customer')
            ->first();

        return response()->json([
            'success' => true,
            'has_reviewed' => (bool) $review,
            'review' => $review,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Provider → Customer Review
    |--------------------------------------------------------------------------
    */

    public function providerReview(Request $request, $serviceRequestId)
    {
        $user = Auth::user();

        // Validate input
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Get Provider Profile
        |--------------------------------------------------------------------------
        */

        $provider = $user->provider;

        if (!$provider) {
            return response()->json([
                'success' => false,
                'message' => 'Provider profile not found.',
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | Find Completed Request
        |--------------------------------------------------------------------------
        */

        $serviceRequest = ServiceRequest::where(
            'id',
            $serviceRequestId
        )
            ->where('provider_id', $provider->id)
            ->where('status', 'service_completed')
            ->first();

        if (!$serviceRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Completed service request not found.',
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | Check Duplicate Review
        |--------------------------------------------------------------------------
        */

        $existingReview = Review::where(
            'service_request_id',
            $serviceRequest->id
        )
            ->where('reviewer_id', $user->id)
            ->where('reviewer_role', 'provider')
            ->exists();

        if ($existingReview) {
            return response()->json([
                'success' => false,
                'message' => 'You have already reviewed this customer.',
            ], 409);
        }

        /*
        |--------------------------------------------------------------------------
        | Create Review
        |--------------------------------------------------------------------------
        */

        $review = Review::create([
            'service_request_id' => $serviceRequest->id,
            'reviewer_id' => $user->id,
            'reviewee_id' => $serviceRequest->customer_id,
            'reviewer_role' => 'provider',
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Customer review submitted successfully.',
            'review' => $review,
        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | Provider Reviews
    |--------------------------------------------------------------------------
    */

    public function providerReviews()
    {
        $user = Auth::user();

        $reviews = Review::with(['reviewer:id,name'])
            ->where('reviewee_id', $user->id)
            ->where('reviewer_role', 'customer')
            ->latest()
            ->get();

        $averageRating = $reviews->avg('rating');

        return response()->json([
            'success' => true,
            'average_rating' => round($averageRating ?? 0, 2),
            'total_reviews' => $reviews->count(),
            'reviews' => $reviews,
        ]);
    }

    //check provider reviewd already
    public function providerCustomerReviewStatus($customerId)
    {
        $user = Auth::user();

        // Make sure logged-in user is a provider
        if ($user->role !== 'provider') {
            return response()->json([
                'success' => false,
                'message' => 'Only providers can check customer reviews.',
            ], 403);
        }

        $provider = $user->provider;

        if (!$provider) {
            return response()->json([
                'success' => false,
                'message' => 'Provider profile not found.',
            ], 404);
        }

        $review = Review::where('reviewer_id', $user->id)
            ->where('reviewee_id', $customerId)
            ->where('reviewer_role', 'provider')
            ->first();

        return response()->json([
            'success' => true,
            'has_reviewed' => (bool) $review,
            'review' => $review,
        ]);
    }
}