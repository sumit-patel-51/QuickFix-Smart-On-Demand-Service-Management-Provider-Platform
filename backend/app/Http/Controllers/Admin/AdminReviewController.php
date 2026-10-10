<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;

class AdminReviewController extends Controller
{
    /**
     * Get all reviews for admin
     */
    public function index(Request $request)
    {
        // --------------------------------------------------
        // Pagination
        // --------------------------------------------------
        $perPage = (int) $request->get('per_page', 10);

        // Allowed values
        if (!in_array($perPage, [10, 20, 50], true)) {
            $perPage = 10;
        }

        // --------------------------------------------------
        // Sorting
        // asc = Oldest First
        // desc = Newest First
        // --------------------------------------------------
        $sort = $request->get('sort', 'desc');

        if (!in_array($sort, ['asc', 'desc'], true)) {
            $sort = 'desc';
        }

        // --------------------------------------------------
        // Reviews Query
        // --------------------------------------------------
        $reviews = Review::with([
            'reviewer:id,name,email',
            'reviewee:id,name,email',
            'serviceRequest:id,service_id',
            'serviceRequest.service:id,name',
        ])
            ->orderBy('created_at', $sort)
            ->paginate($perPage);

        // --------------------------------------------------
        // Format Reviews
        // --------------------------------------------------
        $formattedReviews = $reviews->getCollection()->map(function ($review) {
            return [
                'id' => 'REV-' . str_pad(
                    $review->id,
                    3,
                    '0',
                    STR_PAD_LEFT
                ),

                'customer' => [
                    'name' => $review->reviewer?->name ?? 'Unknown',
                    'email' => $review->reviewer?->email ?? '',
                ],

                'provider' => [
                    'name' => $review->reviewee?->name ?? 'Unknown',
                    'email' => $review->reviewee?->email ?? '',
                ],

                'service' => $review->serviceRequest?->service?->name
                    ?? 'Unknown Service',

                'rating' => (int) $review->rating,

                'comment' => $review->comment ?? '',

                'date' => $review->created_at
                    ? $review->created_at->format('Y-m-d')
                    : null,

                'requestId' => $review->service_request_id
                    ? 'QSP-' . str_pad(
                        $review->service_request_id,
                        5,
                        '0',
                        STR_PAD_LEFT
                    )
                    : 'N/A',

                /*
                 * Currently every stored review is published.
                 */
                'status' => 'Published',
            ];
        });

        // Replace original collection with formatted collection
        $reviews->setCollection($formattedReviews);

        // --------------------------------------------------
        // Response
        // --------------------------------------------------
        return response()->json([
            'success' => true,

            'reviews' => $reviews->items(),

            'pagination' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
                'from' => $reviews->firstItem(),
                'to' => $reviews->lastItem(),
            ],

            'sort' => $sort,
        ]);
    }
}