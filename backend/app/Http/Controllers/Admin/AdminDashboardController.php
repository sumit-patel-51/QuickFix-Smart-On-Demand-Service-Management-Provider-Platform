<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Provider;
use App\Models\Service;
use App\Models\ServiceRequest;
use App\Models\Review;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $currentYear = Carbon::now()->year;

        // Customer Statistics
        $totalCustomers = User::where('role', 'customer')->count();

        // Provider Statistics
        $totalProviders = Provider::count();

        $approvedProviders = Provider::where(
            'verification_status',
            'approved'
        )->count();

        $pendingProviders = Provider::where(
            'verification_status',
            'pending'
        )->count();

        $rejectedProviders = Provider::where(
            'verification_status',
            'rejected'
        )->count();

        $onlineProviders = Provider::where(
            'is_online',
            true
        )->count();

        $offlineProviders = Provider::where(
            'is_online',
            false
        )->count();

        // Service Statistics
        $totalServices = Service::count();

        $activeServices = Service::where(
            'is_active',
            true
        )->count();

        $inactiveServices = Service::where(
            'is_active',
            false
        )->count();

        // Service Request Statistics
        $totalRequests = ServiceRequest::count();

        $searchingRequests = ServiceRequest::where(
            'status',
            'searching'
        )->count();

        $completedRequests = ServiceRequest::where(
            'status',
            'service_completed'
        )->count();

        $cancelledRequests = ServiceRequest::where(
            'status',
            'cancelled'
        )->count();

        $activeRequests = ServiceRequest::whereIn(
            'status',
            [
                'provider_assigned',
                'provider_on_the_way',
                'arrived',
                'service_started'
            ]
        )->count();

        // Reviews
        $totalReviews = Review::count();

        $averageRating = Review::avg('rating') ?? 0;

        // Recent Requests
        $recentRequests = ServiceRequest::with([
            'customer:id,name',
            'service:id,name',
            'provider.user:id,name'
        ])
            ->latest()
            ->take(5)
            ->get();

        // Recent Providers
        $recentProviders = Provider::with([
            'user:id,name,email'
        ])
            ->latest()
            ->take(5)
            ->get();

        // Monthly Request Statistics
        $monthlyData = ServiceRequest::selectRaw(
            'MONTH(created_at) as month, COUNT(*) as total'
        )
            ->whereYear('created_at', $currentYear)
            ->groupBy('month')
            ->pluck('total', 'month');

        $monthlyStatistics = [];

        for ($month = 1; $month <= 12; $month++) {
            $monthlyStatistics[] = [
                'month' => Carbon::create(
                    $currentYear,
                    $month,
                    1
                )->format('M'),

                'total' => (int) ($monthlyData[$month] ?? 0)
            ];
        }

        return response()->json([
            'success' => true,

            'data' => [

                'customers' => [
                    'total' => $totalCustomers,
                ],

                'providers' => [
                    'total' => $totalProviders,
                    'approved' => $approvedProviders,
                    'pending' => $pendingProviders,
                    'rejected' => $rejectedProviders,
                    'online' => $onlineProviders,
                    'offline' => $offlineProviders,
                ],

                'services' => [
                    'total' => $totalServices,
                    'active' => $activeServices,
                    'inactive' => $inactiveServices,
                ],

                'requests' => [
                    'total' => $totalRequests,
                    'searching' => $searchingRequests,
                    'active' => $activeRequests,
                    'completed' => $completedRequests,
                    'cancelled' => $cancelledRequests,
                ],

                'reviews' => [
                    'total' => $totalReviews,
                    'average_rating' => round(
                        (float) $averageRating,
                        2
                    ),
                ],

                'recent_requests' => $recentRequests,

                'recent_providers' => $recentProviders,

                'monthly_statistics' => $monthlyStatistics,
            ]
        ]);
    }
}