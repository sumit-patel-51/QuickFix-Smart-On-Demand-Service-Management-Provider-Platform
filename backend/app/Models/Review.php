<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    protected $fillable = [
        'service_request_id',
        'reviewer_id',
        'reviewee_id',
        'reviewer_role',
        'rating',
        'comment',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    /*
    |--------------------------------------------------------------------------
    | Service Request
    |--------------------------------------------------------------------------
    */

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(
            ServiceRequest::class,
            'service_request_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Reviewer
    |--------------------------------------------------------------------------
    */

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'reviewer_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Reviewee
    |--------------------------------------------------------------------------
    */

    public function reviewee(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'reviewee_id'
        );
    }
}