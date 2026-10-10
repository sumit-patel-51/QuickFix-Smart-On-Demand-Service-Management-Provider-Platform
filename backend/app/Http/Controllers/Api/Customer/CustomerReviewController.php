<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Review;

class CustomerReviewController extends Controller
{ 
    public function index(Request $request)
    {
        $user = $request->user();

        $reviews = Review::with([
            'reviewee.provider',
            'reviewee'
        ])
        ->where('reviewer_id', $user->id)
        ->latest()
        ->get()
        ->map(function ($review) {
            $providerUser = $review->reviewee;
            $provider = $providerUser?->provider;

            $profileImage = $providerUser?->profile_photo;

            if ($profileImage) {
                $profileImage = asset(
                    'storage/' . $profileImage
                );
            }

            return [
                'id' => $review->id,
                'rating' => (float) $review->rating,
                'comment' => $review->comment,
                'created_at' => $review->created_at,

                'provider' => [
                    'id' => $provider?->id,
                    'name' => $providerUser?->name ?? 'Service Provider',
                    'profile_image' => $profileImage,
                ],
            ];
        });

        $totalReviews = $reviews->count();

        $averageRating = $totalReviews > 0
            ? round($reviews->avg('rating'), 1)
            : 0;

        return response()->json([
            'success' => true,
            'reviews' => $reviews,
            'total_reviews' => $totalReviews,
            'average_rating' => $averageRating,
        ]);
    }
}
